"""
JOL-HUB HashiCorp Vault Integration

Provides secure secrets management through HashiCorp Vault with:
- IAM role authentication (AWS)
- Kubernetes authentication (EKS)
- AppRole authentication (generic)
- Automatic secret renewal
- Local development fallback

SOC2 CC6.1 - Secure credential management
GDPR Article 32 - Security of processing
PCI-DSS Requirement 3 - Protect stored cardholder data

Usage:
    from core.vault import VaultClient
    
    # Initialize client
    vault = VaultClient()
    
    # Get a secret
    db_url = vault.get_secret('database/url')
    
    # Get specific key from secret
    stripe_key = vault.get_secret('payments/stripe', key='STRIPE_SECRET_KEY')
"""

import json
import logging
import os
import time
from typing import Any, Dict, Optional
from datetime import datetime, timedelta

logger = logging.getLogger('jolhub.vault')

# Cache for secrets
_secret_cache: Dict[str, Dict[str, Any]] = {}
_token_expiry: Optional[datetime] = None


class VaultError(Exception):
    """Base exception for Vault errors."""
    pass


class VaultAuthenticationError(VaultError):
    """Raised when Vault authentication fails."""
    pass


class VaultSecretNotFoundError(VaultError):
    """Raised when a secret is not found."""
    pass


class VaultClient:
    """
    HashiCorp Vault client with multiple authentication methods.
    
    Authentication Methods (in order of precedence):
    1. IAM Role (AWS ECS/Lambda)
    2. Kubernetes Service Account (EKS)
    3. AppRole (generic)
    4. Token (development)
    """
    
    def __init__(
        self,
        vault_addr: Optional[str] = None,
        vault_namespace: Optional[str] = None,
        vault_role: Optional[str] = None,
    ):
        self.vault_addr = vault_addr or os.environ.get('VAULT_ADDR', 'https://vault.jol-hub.eu')
        self.vault_namespace = vault_namespace or os.environ.get('VAULT_NAMESPACE', '')
        self.vault_role = vault_role or os.environ.get('VAULT_ROLE', '')
        self.token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None
        self._secret_cache: Dict[str, Dict[str, Any]] = {}
        
        # Initialize session
        self._session = None
        self._initialize_session()
    
    def _initialize_session(self):
        """Initialize HTTP session with authentication."""
        try:
            import requests
            self._session = requests.Session()
            self._session.headers.update({
                'Content-Type': 'application/json',
            })
            
            if self.vault_namespace:
                self._session.headers.update({
                    'X-Vault-Namespace': self.vault_namespace,
                })
            
            # Authenticate
            self._authenticate()
            
        except ImportError:
            logger.warning("requests not installed, Vault client disabled")
    
    def _authenticate(self):
        """Authenticate with Vault using available method."""
        if not self._session:
            return
        
        # Try IAM authentication first (AWS)
        if self._try_iam_auth():
            return
        
        # Try Kubernetes authentication
        if self._try_kubernetes_auth():
            return
        
        # Try AppRole authentication
        if self._try_approle_auth():
            return
        
        # Fall back to token authentication
        self._try_token_auth()
    
    def _try_iam_auth(self) -> bool:
        """Try AWS IAM role authentication."""
        try:
            import boto3
            from botocore.exceptions import NoCredentialsError
            
            # Get caller identity
            sts = boto3.client('sts')
            identity = sts.get_caller_identity()
            
            # Get IAM auth token
            iam_request = self._get_iam_auth_request()
            
            if not iam_request:
                return False
            
            # Authenticate with Vault
            auth_path = 'auth/aws/login'
            response = self._session.post(
                f"{self.vault_addr}/v1/{auth_path}",
                json={
                    'role': self.vault_role or f"jol-hub-{os.environ.get('ENVIRONMENT', 'production')}",
                    'iam_http_request_method': 'POST',
                    'iam_request_url': iam_request['url'],
                    'iam_request_body': iam_request['body'],
                    'iam_request_headers': iam_request['headers'],
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data['auth']['client_token']
                lease_duration = data['auth'].get('lease_duration', 3600)
                self._token_expiry = datetime.utcnow() + timedelta(seconds=lease_duration)
                self._session.headers['X-Vault-Token'] = self.token
                logger.info("Successfully authenticated with Vault via IAM")
                return True
            
        except NoCredentialsError:
            logger.debug("No AWS credentials found, skipping IAM auth")
        except ImportError:
            logger.debug("boto3 not installed, skipping IAM auth")
        except Exception as e:
            logger.debug(f"IAM authentication failed: {e}")
        
        return False
    
    def _get_iam_auth_request(self) -> Optional[Dict[str, str]]:
        """Get IAM authentication request headers."""
        try:
            import boto3
            import base64
            
            sts = boto3.client('sts', region_name='eu-west-1')
            
            # Create a request
            sts.get_caller_identity()
            
            # Get the signed headers
            # This is a simplified version - real implementation would use
            # botocore's auth to sign the request properly
            return {
                'url': 'https://sts.amazonaws.com/',
                'body': 'Action=GetCallerIdentity&Version=2011-06-15',
                'headers': json.dumps({
                    'host': 'sts.amazonaws.com',
                }),
            }
            
        except Exception as e:
            logger.debug(f"Failed to get IAM auth request: {e}")
            return None
    
    def _try_kubernetes_auth(self) -> bool:
        """Try Kubernetes service account authentication."""
        try:
            # Read service account token
            sa_token_path = '/var/run/secrets/kubernetes.io/serviceaccount/token'
            
            if not os.path.exists(sa_token_path):
                return False
            
            with open(sa_token_path, 'r') as f:
                jwt_token = f.read()
            
            # Authenticate with Vault
            auth_path = 'auth/kubernetes/login'
            response = self._session.post(
                f"{self.vault_addr}/v1/{auth_path}",
                json={
                    'role': self.vault_role or 'jol-hub',
                    'jwt': jwt_token,
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data['auth']['client_token']
                lease_duration = data['auth'].get('lease_duration', 3600)
                self._token_expiry = datetime.utcnow() + timedelta(seconds=lease_duration)
                self._session.headers['X-Vault-Token'] = self.token
                logger.info("Successfully authenticated with Vault via Kubernetes")
                return True
            
        except FileNotFoundError:
            logger.debug("No Kubernetes service account token found")
        except Exception as e:
            logger.debug(f"Kubernetes authentication failed: {e}")
        
        return False
    
    def _try_approle_auth(self) -> bool:
        """Try AppRole authentication."""
        role_id = os.environ.get('VAULT_ROLE_ID')
        secret_id = os.environ.get('VAULT_SECRET_ID')
        
        if not role_id or not secret_id:
            return False
        
        try:
            auth_path = 'auth/approle/login'
            response = self._session.post(
                f"{self.vault_addr}/v1/{auth_path}",
                json={
                    'role_id': role_id,
                    'secret_id': secret_id,
                },
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data['auth']['client_token']
                lease_duration = data['auth'].get('lease_duration', 3600)
                self._token_expiry = datetime.utcnow() + timedelta(seconds=lease_duration)
                self._session.headers['X-Vault-Token'] = self.token
                logger.info("Successfully authenticated with Vault via AppRole")
                return True
            
        except Exception as e:
            logger.debug(f"AppRole authentication failed: {e}")
        
        return False
    
    def _try_token_auth(self) -> bool:
        """Try token authentication (development)."""
        token = os.environ.get('VAULT_TOKEN')
        
        if not token:
            return False
        
        self.token = token
        self._token_expiry = datetime.utcnow() + timedelta(hours=24)
        self._session.headers['X-Vault-Token'] = self.token
        logger.info("Using token authentication (development)")
        return True
    
    def _ensure_valid_token(self):
        """Ensure we have a valid token, renewing if necessary."""
        if not self.token:
            self._authenticate()
            return
        
        if self._token_expiry and datetime.utcnow() > self._token_expiry - timedelta(minutes=5):
            # Token is about to expire, renew
            self._authenticate()
    
    def get_secret(
        self,
        path: str,
        key: Optional[str] = None,
        mount_point: str = 'secret',
        required: bool = True,
    ) -> Optional[str]:
        """
        Get a secret from Vault.
        
        Args:
            path: Secret path (e.g., 'database/url')
            key: If secret is a dict, extract this key
            mount_point: Vault secrets engine mount point
            required: Raise error if secret not found
        
        Returns:
            Secret value or None
        """
        if not self._session:
            return self._fallback_to_env(path, key, required)
        
        self._ensure_valid_token()
        
        # Check cache
        cache_key = f"{mount_point}/{path}"
        if cache_key in self._secret_cache:
            cached = self._secret_cache[cache_key]
            if key:
                return cached.get(key)
            return cached
        
        try:
            # Build URL for KV v2
            url = f"{self.vault_addr}/v1/{mount_point}/data/{path}"
            
            response = self._session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                secret_data = data.get('data', {}).get('data', {})
                
                # Cache the secret
                self._secret_cache[cache_key] = secret_data
                
                if key:
                    return secret_data.get(key)
                
                # Return full secret as JSON string
                return json.dumps(secret_data)
            
            elif response.status_code == 404:
                if required:
                    raise VaultSecretNotFoundError(f"Secret not found: {path}")
                return self._fallback_to_env(path, key, required)
            
            else:
                logger.error(f"Vault error: {response.status_code} - {response.text}")
                return self._fallback_to_env(path, key, required)
            
        except Exception as e:
            logger.error(f"Failed to get secret from Vault: {e}")
            return self._fallback_to_env(path, key, required)
    
    def _fallback_to_env(
        self,
        path: str,
        key: Optional[str],
        required: bool,
    ) -> Optional[str]:
        """Fall back to environment variable."""
        # Convert path to env var name
        env_name = path.replace('/', '_').upper()
        
        if key:
            env_name = f"{key}"
        
        value = os.environ.get(env_name)
        
        if value:
            return value
        
        if required:
            raise VaultSecretNotFoundError(f"Secret not found in Vault or env: {path}")
        
        return None
    
    def set_secret(
        self,
        path: str,
        data: Dict[str, str],
        mount_point: str = 'secret',
    ) -> bool:
        """
        Set a secret in Vault.
        
        Args:
            path: Secret path
            data: Secret data as dict
            mount_point: Vault secrets engine mount point
        
        Returns:
            True if successful
        """
        if not self._session:
            raise VaultError("Vault client not initialized")
        
        self._ensure_valid_token()
        
        try:
            # Build URL for KV v2
            url = f"{self.vault_addr}/v1/{mount_point}/data/{path}"
            
            response = self._session.post(url, json={'data': data})
            
            if response.status_code in (200, 204):
                # Clear cache for this path
                cache_key = f"{mount_point}/{path}"
                if cache_key in self._secret_cache:
                    del self._secret_cache[cache_key]
                return True
            
            logger.error(f"Failed to set secret: {response.status_code} - {response.text}")
            return False
            
        except Exception as e:
            logger.error(f"Failed to set secret: {e}")
            return False
    
    def clear_cache(self):
        """Clear the secret cache."""
        self._secret_cache.clear()


# Singleton client
_vault_client: Optional[VaultClient] = None


def get_vault_client() -> VaultClient:
    """Get or create Vault client singleton."""
    global _vault_client
    if _vault_client is None:
        _vault_client = VaultClient()
    return _vault_client


def get_secret(
    path: str,
    key: Optional[str] = None,
    required: bool = True,
) -> Optional[str]:
    """
    Convenience function to get a secret from Vault.
    
    Falls back to environment variables if Vault is unavailable.
    """
    try:
        client = get_vault_client()
        return client.get_secret(path, key=key, required=required)
    except VaultSecretNotFoundError:
        if required:
            raise
        return None
    except Exception as e:
        logger.error(f"Vault error: {e}")
        return None
