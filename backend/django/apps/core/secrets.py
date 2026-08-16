"""
JOL-HUB AWS Secrets Manager Integration

Provides secure loading of secrets from AWS Secrets Manager with:
- Automatic secret caching
- Fallback to environment variables
- IAM role authentication
- Local development support

SOC2 CC6.1 - Secure credential management
GDPR Article 32 - Security of processing
PCI-DSS Requirement 3 - Protect stored cardholder data

Usage:
    from core.secrets import get_secret
    
    # Get a secret value
    db_url = get_secret('database/url')
    
    # Get specific key from JSON secret
    smtp_pass = get_secret('email/smtp', key='PASSWORD')

Model A (ADR-0005): jol-hub holds NO Stripe credentials; donations flow
through the marketplace payment boundary. get_stripe_keys() was purged
(STEP 18) and must not return — data/tests/test_dependency_guard.py and
the payment-boundary CI guard enforce this.
"""

import json
import logging
import os
import functools
from typing import Any, Dict, Optional
from datetime import datetime, timedelta

logger = logging.getLogger('jolhub.secrets')

# Cache for secrets (TTL-based)
_secret_cache: Dict[str, Dict[str, Any]] = {}
_CACHE_TTL_SECONDS = 300  # 5 minutes


class SecretNotFoundError(Exception):
    """Raised when a secret cannot be found."""
    pass


class SecretAccessError(Exception):
    """Raised when there's an error accessing secrets."""
    pass


def _get_boto_client():
    """
    Get boto3 Secrets Manager client.
    
    Uses IAM role credentials in production,
    falls back to environment/local credentials in development.
    """
    try:
        import boto3
        from botocore.config import Config
        
        config = Config(
            region_name=os.environ.get('AWS_REGION', 'eu-west-1'),
            retries={'max_attempts': 3, 'mode': 'standard'},
        )
        
        return boto3.client('secretsmanager', config=config)
    except ImportError:
        logger.warning("boto3 not installed, secrets manager disabled")
        return None
    except Exception as e:
        logger.error(f"Failed to create Secrets Manager client: {e}")
        return None


def _is_cache_valid(cached_at: datetime) -> bool:
    """Check if cached secret is still valid."""
    return datetime.utcnow() - cached_at < timedelta(seconds=_CACHE_TTL_SECONDS)


def _get_from_cache(secret_name: str) -> Optional[Dict[str, Any]]:
    """Get secret from cache if valid."""
    if secret_name in _secret_cache:
        entry = _secret_cache[secret_name]
        if _is_cache_valid(entry['cached_at']):
            return entry['value']
    return None


def _add_to_cache(secret_name: str, value: Dict[str, Any]) -> None:
    """Add secret to cache."""
    _secret_cache[secret_name] = {
        'value': value,
        'cached_at': datetime.utcnow(),
    }


def get_secret(
    secret_name: str,
    key: Optional[str] = None,
    environment_prefix: Optional[str] = None,
    required: bool = True,
) -> Optional[str]:
    """
    Get a secret value from AWS Secrets Manager.
    
    Falls back to environment variables if:
    - Secret not found in Secrets Manager
    - Running in local development (no AWS credentials)
    - AWS_SECRETS_ENABLED=false
    
    Args:
        secret_name: Secret name/path (e.g., 'jol-hub/production/django/secret-key')
        key: If secret is JSON, extract this key
        environment_prefix: Environment variable prefix for fallback
        required: Raise error if secret not found
    
    Returns:
        Secret value or None if not found and not required
    
    Raises:
        SecretNotFoundError: If secret not found and required=True
        SecretAccessError: If there's an error accessing the secret
    """
    # Check if Secrets Manager is enabled
    secrets_enabled = os.environ.get('AWS_SECRETS_ENABLED', 'true').lower() == 'true'
    
    # Build environment variable name for fallback
    env_var_name = None
    if environment_prefix:
        env_var_name = f"{environment_prefix}_{key}" if key else environment_prefix
    elif key:
        env_var_name = key
    
    # Try environment variable first in development
    if not secrets_enabled and env_var_name:
        env_value = os.environ.get(env_var_name)
        if env_value:
            return env_value
    
    # Try cache
    cached = _get_from_cache(secret_name)
    if cached is not None:
        if key:
            return cached.get(key)
        return cached
    
    # Try Secrets Manager
    if secrets_enabled:
        client = _get_boto_client()
        if client:
            try:
                # Build full secret name if not already prefixed
                full_name = secret_name
                if not secret_name.startswith('jol-hub/'):
                    env = os.environ.get('ENVIRONMENT', 'development')
                    project = os.environ.get('PROJECT_NAME', 'jol-hub')
                    full_name = f"{project}/{env}/{secret_name}"
                
                response = client.get_secret_value(SecretId=full_name)
                
                # Parse secret value
                if 'SecretString' in response:
                    secret_value = response['SecretString']
                    try:
                        parsed = json.loads(secret_value)
                        _add_to_cache(full_name, parsed)
                        
                        if key:
                            return parsed.get(key)
                        return secret_value
                    except json.JSONDecodeError:
                        # Not JSON, return as-is
                        _add_to_cache(full_name, {'value': secret_value})
                        return secret_value
                
            except client.exceptions.ResourceNotFoundException:
                logger.debug(f"Secret not found: {secret_name}")
            except client.exceptions.InvalidRequestException as e:
                logger.error(f"Invalid request for secret {secret_name}: {e}")
            except client.exceptions.InvalidParameterException as e:
                logger.error(f"Invalid parameter for secret {secret_name}: {e}")
            except client.exceptions.DecryptionFailure as e:
                logger.error(f"Decryption failed for secret {secret_name}: {e}")
            except Exception as e:
                logger.error(f"Error retrieving secret {secret_name}: {e}")
    
    # Fall back to environment variable
    if env_var_name:
        env_value = os.environ.get(env_var_name)
        if env_value:
            logger.debug(f"Using environment variable fallback for {env_var_name}")
            return env_value
    
    if required:
        raise SecretNotFoundError(f"Secret not found: {secret_name}")
    
    return None


def get_database_url() -> str:
    """Get database connection URL from Secrets Manager or environment."""
    url = get_secret(
        'database/url',
        key='DATABASE_URL',
        environment_prefix='DATABASE_URL',
        required=False,
    )
    
    if url:
        return url
    
    # Build from components if URL not available
    db_name = os.environ.get('DB_NAME', 'jolhub')
    db_user = os.environ.get('DB_USER', 'jolhub')
    db_pass = os.environ.get('DB_PASSWORD', '')
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '5432')
    
    return f"postgres://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"


def get_paypal_credentials() -> Dict[str, str]:
    """Get PayPal API credentials from Secrets Manager."""
    client_id = get_secret(
        'payments/paypal',
        key='PAYPAL_CLIENT_ID',
        environment_prefix='PAYPAL_CLIENT_ID',
        required=False,
    ) or os.environ.get('PAYPAL_CLIENT_ID', '')
    
    client_secret = get_secret(
        'payments/paypal',
        key='PAYPAL_CLIENT_SECRET',
        environment_prefix='PAYPAL_CLIENT_SECRET',
        required=False,
    ) or os.environ.get('PAYPAL_CLIENT_SECRET', '')
    
    mode = get_secret(
        'payments/paypal',
        key='PAYPAL_MODE',
        environment_prefix='PAYPAL_MODE',
        required=False,
    ) or os.environ.get('PAYPAL_MODE', 'sandbox')
    
    return {
        'client_id': client_id,
        'client_secret': client_secret,
        'mode': mode,
    }


def get_email_credentials() -> Dict[str, str]:
    """Get SMTP credentials from Secrets Manager."""
    host = get_secret(
        'email/smtp',
        key='EMAIL_HOST',
        environment_prefix='EMAIL_HOST',
        required=False,
    ) or os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
    
    port = get_secret(
        'email/smtp',
        key='EMAIL_PORT',
        environment_prefix='EMAIL_PORT',
        required=False,
    ) or os.environ.get('EMAIL_PORT', '587')
    
    user = get_secret(
        'email/smtp',
        key='EMAIL_HOST_USER',
        environment_prefix='EMAIL_HOST_USER',
        required=False,
    ) or os.environ.get('EMAIL_HOST_USER', '')
    
    password = get_secret(
        'email/smtp',
        key='EMAIL_HOST_PASSWORD',
        environment_prefix='EMAIL_HOST_PASSWORD',
        required=False,
    ) or os.environ.get('EMAIL_HOST_PASSWORD', '')
    
    use_tls = get_secret(
        'email/smtp',
        key='EMAIL_USE_TLS',
        environment_prefix='EMAIL_USE_TLS',
        required=False,
    ) or os.environ.get('EMAIL_USE_TLS', 'True')
    
    return {
        'host': host,
        'port': int(port) if port else 587,
        'user': user,
        'password': password,
        'use_tls': use_tls.lower() == 'true' if isinstance(use_tls, str) else use_tls,
    }


def get_bitrix24_credentials() -> Dict[str, str]:
    """Get Bitrix24 webhook credentials from Secrets Manager."""
    webhook_url = get_secret(
        'integrations/bitrix24',
        key='WEBHOOK_URL',
        environment_prefix='BITRIX24_WEBHOOK_URL',
        required=False,
    ) or os.environ.get('BITRIX24_WEBHOOK_URL', '')
    
    portal_id = get_secret(
        'integrations/bitrix24',
        key='PORTAL_ID',
        environment_prefix='BITRIX24_PORTAL_ID',
        required=False,
    ) or os.environ.get('BITRIX24_PORTAL_ID', '')
    
    return {
        'webhook_url': webhook_url,
        'portal_id': portal_id,
    }


def get_encryption_key() -> str:
    """
    Get PII encryption key from Secrets Manager.
    
    GDPR Article 32 - Encryption at rest
    """
    key = get_secret(
        'security/encryption',
        key='PII_ENCRYPTION_KEY',
        environment_prefix='PII_ENCRYPTION_KEY',
        required=False,
    )
    
    if not key:
        # Generate a key for development
        from cryptography.fernet import Fernet
        key = Fernet.generate_key().decode()
        logger.warning("Generated temporary encryption key (development only)")
    
    return key


def get_django_secret_key() -> str:
    """Get Django SECRET_KEY from Secrets Manager."""
    key = get_secret(
        'django/secret-key',
        key='SECRET_KEY',
        environment_prefix='SECRET_KEY',
        required=False,
    )
    
    if not key:
        # Generate for development
        import secrets
        import string
        key = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(50))
        logger.warning("Generated temporary Django secret key (development only)")
    
    return key


def get_nextauth_secret() -> str:
    """Get NextAuth.js secret from Secrets Manager."""
    key = get_secret(
        'frontend/nextauth',
        key='NEXTAUTH_SECRET',
        environment_prefix='NEXTAUTH_SECRET',
        required=False,
    )
    
    if not key:
        import secrets
        import string
        key = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(64))
        logger.warning("Generated temporary NextAuth secret (development only)")
    
    return key


def clear_cache() -> None:
    """Clear the secrets cache."""
    global _secret_cache
    _secret_cache = {}
    logger.debug("Secrets cache cleared")


# Decorator for secrets caching
def cached_secret(ttl_seconds: int = 300):
    """
    Decorator to cache function results as secrets.
    
    Args:
        ttl_seconds: Cache TTL in seconds
    """
    def decorator(func):
        cache = {}
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            cache_key = str((args, sorted(kwargs.items())))
            
            if cache_key in cache:
                entry = cache[cache_key]
                if _is_cache_valid(entry['cached_at']):
                    return entry['value']
            
            result = func(*args, **kwargs)
            cache[cache_key] = {
                'value': result,
                'cached_at': datetime.utcnow(),
            }
            return result
        
        return wrapper
    return decorator
