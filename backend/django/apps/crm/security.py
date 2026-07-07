"""
CRM Security Controls Module

Provides:
- PII encryption utilities
- Input validation and sanitization
- Rate limiting configurations
- Security decorators
- Cross-tenant access prevention
"""

import hashlib
import logging
import re
import secrets
import string
from base64 import b64encode, b64decode
from dataclasses import dataclass
from datetime import timedelta
from typing import Any, Dict, List, Optional, Set

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from django.utils.crypto import get_random_string

logger = logging.getLogger('jolhub.crm.security')


# =============================================================================
# PII ENCRYPTION
# =============================================================================

class PIIEncryption:
    """
    Field-level encryption for PII data.
    
    Uses Fernet (AES-128-CBC) for symmetric encryption.
    Key derivation from Django SECRET_KEY for consistency.
    """
    
    _fernet: Optional[Fernet] = None
    
    @classmethod
    def _get_fernet(cls) -> Fernet:
        """Get or create Fernet instance."""
        if cls._fernet is None:
            # Derive key from Django SECRET_KEY
            secret_key = settings.SECRET_KEY.encode()
            salt = b'jolhub_crm_pii_salt_v1'  # Fixed salt for consistency
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = b64encode(kdf.derive(secret_key))
            cls._fernet = Fernet(key)
        
        return cls._fernet
    
    @classmethod
    def encrypt(cls, plaintext: str) -> str:
        """
        Encrypt a plaintext string.
        
        Args:
            plaintext: String to encrypt
            
        Returns:
            Base64-encoded encrypted string
        """
        if not plaintext:
            return ''
        
        fernet = cls._get_fernet()
        encrypted = fernet.encrypt(plaintext.encode('utf-8'))
        return b64encode(encrypted).decode('utf-8')
    
    @classmethod
    def decrypt(cls, ciphertext: str) -> str:
        """
        Decrypt a ciphertext string.
        
        Args:
            ciphertext: Base64-encoded encrypted string
            
        Returns:
            Decrypted plaintext string
        """
        if not ciphertext:
            return ''
        
        fernet = cls._get_fernet()
        try:
            decrypted = fernet.decrypt(b64decode(ciphertext.encode('utf-8')))
            return decrypted.decode('utf-8')
        except InvalidToken:
            logger.error("Failed to decrypt PII - invalid token")
            return '[ENCRYPTED]'
    
    @classmethod
    def encrypt_dict(cls, data: Dict, fields: Set[str]) -> Dict:
        """
        Encrypt specific fields in a dictionary.
        
        Args:
            data: Dictionary to process
            fields: Set of field names to encrypt
            
        Returns:
            Dictionary with encrypted fields
        """
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = cls.encrypt(str(result[field]))
        return result
    
    @classmethod
    def decrypt_dict(cls, data: Dict, fields: Set[str]) -> Dict:
        """
        Decrypt specific fields in a dictionary.
        
        Args:
            data: Dictionary to process
            fields: Set of field names to decrypt
            
        Returns:
            Dictionary with decrypted fields
        """
        result = data.copy()
        for field in fields:
            if field in result and result[field]:
                result[field] = cls.decrypt(result[field])
        return result


# =============================================================================
# INPUT VALIDATION
# =============================================================================

class InputValidator:
    """
    Input validation and sanitization for CRM data.
    
    Provides:
    - Email validation and normalization
    - Phone number validation
    - Name sanitization
    - Address validation
    - SQL injection prevention
    - XSS prevention
    """
    
    # Patterns for validation
    EMAIL_PATTERN = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    PHONE_PATTERN = re.compile(
        r'^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$'
    )
    
    # Suspicious patterns for security
    SQL_INJECTION_PATTERNS = [
        r"('|\")(;|--|\)|union|select|insert|delete|update|drop|exec)",
        r"(union.*select|select.*from)",
        r"(insert.*into|delete.*from)",
        r"(drop\s+table|truncate\s+table)",
        r"(exec\s*\(|execute\s*\()",
    ]
    
    XSS_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe',
        r'<embed',
        r'<object',
    ]
    
    @classmethod
    def validate_email(cls, email: str) -> tuple[bool, str]:
        """
        Validate and normalize email address.
        
        Returns:
            Tuple of (is_valid, normalized_email)
        """
        if not email:
            return True, ''
        
        # Normalize
        email = email.lower().strip()
        
        # Check format
        if not cls.EMAIL_PATTERN.match(email):
            return False, email
        
        # Check for suspicious patterns
        for pattern in cls.SQL_INJECTION_PATTERNS + cls.XSS_PATTERNS:
            if re.search(pattern, email, re.IGNORECASE):
                logger.warning(f"Suspicious email pattern detected: {email[:50]}")
                return False, email
        
        # Length check
        if len(email) > 254:
            return False, email
        
        return True, email
    
    @classmethod
    def validate_phone(cls, phone: str) -> tuple[bool, str]:
        """
        Validate and normalize phone number.
        
        Returns:
            Tuple of (is_valid, normalized_phone)
        """
        if not phone:
            return True, ''
        
        # Remove whitespace
        phone = phone.strip()
        
        # Check format
        if not cls.PHONE_PATTERN.match(phone):
            return False, phone
        
        # Check length (digits only)
        digits = re.sub(r'\D', '', phone)
        if len(digits) < 7 or len(digits) > 15:
            return False, phone
        
        return True, phone
    
    @classmethod
    def sanitize_name(cls, name: str) -> str:
        """
        Sanitize a name field.
        
        - Removes HTML tags
        - Removes control characters
        - Normalizes whitespace
        - Limits length
        """
        if not name:
            return ''
        
        # Remove HTML tags
        name = re.sub(r'<[^>]+>', '', name)
        
        # Remove control characters
        name = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', name)
        
        # Normalize whitespace
        name = ' '.join(name.split())
        
        # Limit length
        return name[:255]
    
    @classmethod
    def sanitize_text(cls, text: str, max_length: int = 5000) -> str:
        """
        Sanitize general text input.
        
        - Removes HTML tags
        - Removes control characters
        - Checks for injection patterns
        """
        if not text:
            return ''
        
        # Check for SQL injection
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"SQL injection pattern detected in text input")
                # Remove the suspicious content
                text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        # Check for XSS
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"XSS pattern detected in text input")
                # Remove the suspicious content
                text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        # Remove control characters
        text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
        
        # Limit length
        return text[:max_length]
    
    @classmethod
    def validate_address(cls, address: Dict[str, str]) -> Dict[str, str]:
        """
        Validate and sanitize address fields.
        """
        result = {}
        
        for field in ['street', 'city', 'postal_code', 'country']:
            value = address.get(field, '')
            if value:
                result[field] = cls.sanitize_text(value, max_length=255)
        
        return result


# =============================================================================
# RATE LIMITING
# =============================================================================

@dataclass
class RateLimitConfig:
    """Rate limit configuration."""
    requests_per_second: int = 10
    requests_per_minute: int = 100
    requests_per_hour: int = 1000
    burst_size: int = 20


class RateLimiter:
    """
    Sliding window rate limiter.
    
    Provides:
    - Per-tenant rate limiting
    - Per-user rate limiting
    - Per-IP rate limiting
    - Configurable limits
    """
    
    CACHE_PREFIX = 'jolhub:ratelimit:'
    
    CONFIGS = {
        'default': RateLimitConfig(),
        'gdpr_export': RateLimitConfig(
            requests_per_hour=5,
            requests_per_minute=2,
            burst_size=3,
        ),
        'gdpr_delete': RateLimitConfig(
            requests_per_hour=3,
            requests_per_minute=1,
            burst_size=2,
        ),
        'financial': RateLimitConfig(
            requests_per_hour=20,
            requests_per_minute=10,
            burst_size=5,
        ),
    }
    
    @classmethod
    def check_rate_limit(
        cls,
        key: str,
        config_name: str = 'default'
    ) -> tuple[bool, int, int]:
        """
        Check if rate limit is exceeded.
        
        Args:
            key: Unique key (e.g., tenant_id, user_id, IP)
            config_name: Name of rate limit config
            
        Returns:
            Tuple of (allowed, remaining, reset_seconds)
        """
        config = cls.CONFIGS.get(config_name, cls.CONFIGS['default'])
        cache_key = f"{cls.CACHE_PREFIX}{config_name}:{key}"
        
        now = timezone.now().timestamp()
        window_start = now - 3600  # 1 hour window
        
        # Get current window
        window = cache.get(cache_key, [])
        
        # Remove expired entries
        window = [t for t in window if t > window_start]
        
        # Check limits
        requests_last_hour = len(window)
        requests_last_minute = len([t for t in window if t > now - 60])
        requests_last_second = len([t for t in window if t > now - 1])
        
        if requests_last_hour >= config.requests_per_hour:
            reset = int(window[0] + 3600 - now) if window else 3600
            return False, 0, reset
        
        if requests_last_minute >= config.requests_per_minute:
            reset = int(min(t for t in window if t > now - 60) + 60 - now)
            return False, 0, reset
        
        if requests_last_second >= config.requests_per_second:
            reset = 1
            return False, 0, reset
        
        # Allow request
        window.append(now)
        cache.set(cache_key, window, 3600)
        
        remaining = config.requests_per_hour - requests_last_hour - 1
        return True, remaining, 0
    
    @classmethod
    def get_client_key(cls, request) -> str:
        """Generate rate limit key for request."""
        from apps.crm.middleware import get_current_tenant_id
        
        tenant_id = get_current_tenant_id() or 'anonymous'
        user_id = request.user.id if hasattr(request, 'user') and request.user.is_authenticated else 'anonymous'
        ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        
        return f"{tenant_id}:{user_id}:{ip}"


# =============================================================================
# SECURITY DECORATORS
# =============================================================================

def audit_operation(operation: str, entity_type: str):
    """
    Decorator to audit an operation.
    
    Args:
        operation: Operation name (e.g., 'create', 'update', 'delete')
        entity_type: Entity type (e.g., 'contact', 'deal')
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            from apps.crm.models import AuditEntry
            from apps.crm.middleware import get_current_tenant_id, get_current_tenant_context
            
            result = func(*args, **kwargs)
            
            # Log to audit
            tenant_id = get_current_tenant_id()
            context = get_current_tenant_context()
            
            if tenant_id:
                AuditEntry.objects.create(
                    organization_id=tenant_id,
                    event_type=AuditEntry.EventType.UPDATE,
                    operation=operation,
                    entity_type=entity_type,
                    entity_id=str(kwargs.get('pk', '')),
                    actor_ip=context.ip_address if context else None,
                )
            
            return result
        return wrapper
    return decorator


def require_consent(entity_type: str):
    """
    Decorator to require consent before accessing special category data.
    
    Args:
        entity_type: Type of entity being accessed
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            from django.core.exceptions import PermissionDenied
            from apps.crm.models import ConsentStatus
            
            # Get the instance (assuming first arg after self is request or instance)
            instance = None
            for arg in args[1:]:  # Skip self
                if hasattr(arg, 'consent_status'):
                    instance = arg
                    break
            
            if instance and instance.consent_status != ConsentStatus.GRANTED:
                logger.warning(
                    f"Access denied to {entity_type} without consent: "
                    f"tenant={instance.organization_id}, id={instance.id}"
                )
                raise PermissionDenied(
                    "Consent required to access this data"
                )
            
            return func(*args, **kwargs)
        return wrapper
    return decorator


def prevent_cross_tenant_access(func):
    """
    Decorator to prevent cross-tenant data access.
    
    Validates that the requested resource belongs to the current tenant.
    """
    def wrapper(self, request, *args, **kwargs):
        from django.core.exceptions import PermissionDenied
        from apps.crm.middleware import get_current_tenant_id
        
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            raise PermissionDenied("Tenant context required")
        
        # Get the object and validate ownership
        obj = self.get_object()
        if str(obj.organization_id) != str(tenant_id):
            logger.error(
                f"Cross-tenant access attempt: tenant={tenant_id}, "
                f"resource_tenant={obj.organization_id}, resource_id={obj.id}"
            )
            TENANT_ISOLATION_VIOLATIONS.labels(
                tenant_id=tenant_id,
                source_tenant=tenant_id,
                target_tenant=str(obj.organization_id)
            ).inc()
            raise PermissionDenied("Access to this resource is forbidden")
        
        return func(self, request, *args, **kwargs)
    return wrapper
