"""
Bitrix24 REST API Client
Handles authentication, rate limiting, retry logic, and batch operations.
"""

import asyncio
import hashlib
import json
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, Generic, List, Optional, TypeVar, Union

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")


class Bitrix24Error(Exception):
    """Base exception for Bitrix24 SDK errors."""
    pass


class Bitrix24AuthError(Bitrix24Error):
    """Authentication or token error."""
    def __init__(self, message: str, expired: bool = False):
        super().__init__(message)
        self.expired = expired


class Bitrix24RateLimitError(Bitrix24Error):
    """Rate limit exceeded error."""
    def __init__(self, retry_after: Optional[int] = None):
        super().__init__("Rate limit exceeded")
        self.retry_after = retry_after


class Bitrix24ApiError(Bitrix24Error):
    """API error response."""
    def __init__(self, code: str, message: str, status_code: int = 400, details: Optional[Dict] = None):
        super().__init__(message)
        self.code = code
        self.status_code = status_code
        self.details = details or {}


@dataclass
class Bitrix24Config:
    """Configuration for Bitrix24 client."""
    domain: str
    access_token: str
    refresh_token: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    timeout: int = 30
    max_retries: int = 3
    rate_limit_per_second: int = 2

    @classmethod
    def from_settings(cls) -> "Bitrix24Config":
        """Create config from Django settings."""
        return cls(
            domain=getattr(settings, "BITRIX24_DOMAIN", ""),
            access_token=getattr(settings, "BITRIX24_ACCESS_TOKEN", ""),
            refresh_token=getattr(settings, "BITRIX24_REFRESH_TOKEN", ""),
            client_id=getattr(settings, "BITRIX24_CLIENT_ID", ""),
            client_secret=getattr(settings, "BITRIX24_CLIENT_SECRET", ""),
        )


@dataclass
class Bitrix24Response(Generic[T]):
    """Standard Bitrix24 API response."""
    result: T
    time: Optional[Dict[str, float]] = None
    next: Optional[int] = None
    total: Optional[int] = None


@dataclass
class BatchCommand:
    """A single command in a batch request."""
    method: str
    params: Optional[Dict[str, Any]] = None


class Bitrix24Client:
    """
    Bitrix24 REST API Client.
    
    Provides type-safe interface for Bitrix24 CRM operations with:
    - Automatic rate limiting
    - Retry logic with exponential backoff
    - Batch request support
    - GDPR-compliant audit logging
    
    Example:
        config = Bitrix24Config.from_settings()
        client = Bitrix24Client(config)
        
        contact = await client.contacts.get("123")
        deal = await client.deals.create_donation(...)
    """
    
    def __init__(self, config: Bitrix24Config):
        self.config = config
        self._base_url = f"{config.domain.rstrip('/')}/rest"
        self._last_request_time = 0.0
        self._request_count = 0
        
        # Lazy import to avoid circular dependencies
        from .api.contacts import ContactApi
        from .api.deals import DealApi
        from .api.events import EventApi
        from .api.email import EmailApi
        from .audit.logger import ComplianceAuditLogger
        
        self._contacts: Optional[ContactApi] = None
        self._deals: Optional[DealApi] = None
        self._events: Optional[EventApi] = None
        self._email: Optional[EmailApi] = None
        self._audit_logger: Optional[ComplianceAuditLogger] = None
    
    @property
    def contacts(self) -> "ContactApi":
        """Contacts API module."""
        if self._contacts is None:
            from .api.contacts import ContactApi
            self._contacts = ContactApi(self)
        return self._contacts
    
    @property
    def deals(self) -> "DealApi":
        """Deals API module."""
        if self._deals is None:
            from .api.deals import DealApi
            self._deals = DealApi(self)
        return self._deals
    
    @property
    def events(self) -> "EventApi":
        """Events API module."""
        if self._events is None:
            from .api.events import EventApi
            self._events = EventApi(self)
        return self._events
    
    @property
    def email(self) -> "EmailApi":
        """Email marketing API module."""
        if self._email is None:
            from .api.email import EmailApi
            self._email = EmailApi(self)
        return self._email
    
    @property
    def audit(self) -> "ComplianceAuditLogger":
        """Compliance audit logger."""
        if self._audit_logger is None:
            from .audit.logger import ComplianceAuditLogger
            self._audit_logger = ComplianceAuditLogger()
        return self._audit_logger
    
    async def get(
        self,
        method: str,
        params: Optional[Dict[str, Any]] = None,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
    ) -> Bitrix24Response:
        """Make a GET request to Bitrix24 API."""
        await self._rate_limit()
        
        url = f"{self._base_url}/{method}"
        params = params or {}
        params["auth"] = self.config.access_token
        
        return await self._request(
            "GET", url, params=params,
            entity_id=entity_id, entity_type=entity_type, method=method
        )
    
    async def post(
        self,
        method: str,
        data: Optional[Dict[str, Any]] = None,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
    ) -> Bitrix24Response:
        """Make a POST request to Bitrix24 API."""
        await self._rate_limit()
        
        url = f"{self._base_url}/{method}?auth={self.config.access_token}"
        
        return await self._request(
            "POST", url, json=data,
            entity_id=entity_id, entity_type=entity_type, method=method
        )
    
    async def batch(
        self,
        commands: Dict[str, BatchCommand],
        halt_on_error: bool = False,
    ) -> Dict[str, Bitrix24Response]:
        """
        Execute multiple API calls in a single batch request.
        
        Args:
            commands: Dictionary of named commands
            halt_on_error: Stop processing on first error
        
        Returns:
            Dictionary of responses keyed by command name
        """
        await self._rate_limit()
        
        batch_data = {}
        for key, cmd in commands.items():
            cmd_str = cmd.method
            if cmd.params:
                params_str = "&".join(
                    f"{k}={v}" for k, v in cmd.params.items()
                    if v is not None
                )
                if params_str:
                    cmd_str += f"?{params_str}"
            batch_data[f"cmd[{key}]"] = cmd_str
        
        batch_data["halt"] = "1" if halt_on_error else "0"
        
        response = await self.post("batch", batch_data)
        
        # Parse batch results
        results = {}
        if isinstance(response.result, dict):
            for key, value in response.result.items():
                if isinstance(value, dict) and "result" in value:
                    results[key] = Bitrix24Response(result=value["result"])
        
        return results
    
    async def _request(
        self,
        method: str,
        url: str,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        api_method: Optional[str] = None,
        **kwargs,
    ) -> Bitrix24Response:
        """Internal request method with retry logic."""
        last_error = None
        
        for attempt in range(self.config.max_retries):
            try:
                async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                    response = await client.request(method, url, **kwargs)
                    
                    # Handle rate limiting
                    if response.status_code == 429:
                        retry_after = int(response.headers.get("Retry-After", 1))
                        raise Bitrix24RateLimitError(retry_after)
                    
                    data = response.json()
                    
                    # Check for API errors
                    if not response.is_success or "error" in data:
                        error = data.get("error", "UNKNOWN_ERROR")
                        error_desc = data.get("error_description", "Unknown error")
                        
                        if error in ("expired_token", "invalid_token"):
                            raise Bitrix24AuthError(error_desc, expired=True)
                        
                        raise Bitrix24ApiError(
                            error, error_desc, response.status_code, data
                        )
                    
                    # Log successful request
                    await self.audit.log_api_call(
                        method=api_method or url.split("/")[-1],
                        entity_type=entity_type,
                        entity_id=entity_id,
                        status="success",
                    )
                    
                    return Bitrix24Response(
                        result=data.get("result"),
                        time=data.get("time"),
                        next=data.get("next"),
                        total=data.get("total"),
                    )
                    
            except Bitrix24AuthError:
                raise
            except Bitrix24RateLimitError as e:
                last_error = e
                if attempt < self.config.max_retries - 1:
                    await self._delay(e.retry_after or (2 ** attempt))
                    continue
            except httpx.TimeoutException:
                last_error = Bitrix24Error(f"Request timed out after {self.config.timeout}s")
                if attempt < self.config.max_retries - 1:
                    await self._delay(2 ** attempt)
                    continue
            except Exception as e:
                last_error = e
        
        # Log failed request
        await self.audit.log_api_call(
            method=api_method or "unknown",
            entity_type=entity_type,
            entity_id=entity_id,
            status="failed",
            error=str(last_error),
        )
        
        raise last_error or Bitrix24Error("Request failed after max retries")
    
    async def _rate_limit(self):
        """Enforce rate limiting."""
        now = time.time()
        elapsed = now - self._last_request_time
        min_interval = 1.0 / self.config.rate_limit_per_second
        
        if elapsed < min_interval:
            await self._delay(min_interval - elapsed)
        
        self._last_request_time = time.time()
    
    async def _delay(self, seconds: float):
        """Async delay."""
        await asyncio.sleep(seconds)
    
    async def refresh_token(self) -> Dict[str, str]:
        """Refresh the access token using refresh token."""
        if not all([self.config.refresh_token, self.config.client_id, self.config.client_secret]):
            raise Bitrix24AuthError("Missing credentials for token refresh")
        
        url = f"{self.config.domain}/oauth/token/"
        params = {
            "grant_type": "refresh_token",
            "client_id": self.config.client_id,
            "client_secret": self.config.client_secret,
            "refresh_token": self.config.refresh_token,
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            
            if not response.is_success:
                raise Bitrix24AuthError("Token refresh failed")
            
            data = response.json()
            self.config.access_token = data["access_token"]
            self.config.refresh_token = data.get("refresh_token", self.config.refresh_token)
            
            return data


# Sync wrapper for synchronous contexts
class Bitrix24ClientSync:
    """Synchronous wrapper for Bitrix24Client."""
    
    def __init__(self, config: Bitrix24Config):
        self._async_client = Bitrix24Client(config)
    
    def _run(self, coro):
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)
    
    @property
    def contacts(self):
        return self._async_client.contacts
    
    @property
    def deals(self):
        return self._async_client.deals
    
    @property
    def events(self):
        return self._async_client.events
    
    @property
    def email(self):
        return self._async_client.email
    
    def get(self, method: str, params: Optional[Dict] = None, **kwargs):
        return self._run(self._async_client.get(method, params, **kwargs))
    
    def post(self, method: str, data: Optional[Dict] = None, **kwargs):
        return self._run(self._async_client.post(method, data, **kwargs))
    
    def batch(self, commands: Dict[str, BatchCommand], **kwargs):
        return self._run(self._async_client.batch(commands, **kwargs))
