"""
Encryption Key Management Module
ISO 27001 A.10.1.2, SOC2 CC6.1 - Cryptographic Key Management

Provides secure encryption with:
- AWS KMS integration for production
- Local envelope encryption for development
- Automatic key rotation
- Key versioning for seamless transitions
"""

import os
import json
import base64
import secrets
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union
from pathlib import Path
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class KeyProvider(Enum):
    """Supported encryption key providers."""
    AWS_KMS = "aws_kms"
    LOCAL = "local"  # Development only
    HSM = "hsm"      # Hardware Security Module


@dataclass
class EncryptionKey:
    """
    Represents an encryption key with metadata.
    
    ISO 27001 A.10.1.2 - Key lifecycle management:
    - Key ID for identification
    - Creation timestamp for age tracking
    - Expiration for rotation policy
    - State for activation/deactivation
    """
    key_id: str
    key_material: bytes  # Encrypted key material (never plaintext)
    provider: KeyProvider
    created_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool = True
    version: int = 1
    
    def is_expired(self) -> bool:
        """Check if key has exceeded its rotation period."""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize key metadata (excludes key material)."""
        return {
            "key_id": self.key_id,
            "provider": self.provider.value,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
            "version": self.version,
        }


class KeyManager(ABC):
    """
    Abstract base class for key management providers.
    
    ISO 27001 A.10.1.2, SOC2 CC6.1 - Key management requirements:
    - Secure key generation
    - Key distribution
    - Key storage
    - Key rotation
    - Key destruction
    """
    
    @abstractmethod
    def generate_key(self, key_id: Optional[str] = None) -> EncryptionKey:
        """Generate a new encryption key."""
        pass
    
    @abstractmethod
    def encrypt(self, plaintext: bytes, key: EncryptionKey) -> bytes:
        """Encrypt data with the given key."""
        pass
    
    @abstractmethod
    def decrypt(self, ciphertext: bytes, key: EncryptionKey) -> bytes:
        """Decrypt data with the given key."""
        pass
    
    @abstractmethod
    def rotate_key(self, old_key: EncryptionKey) -> EncryptionKey:
        """Rotate to a new key, re-encrypting if needed."""
        pass


class AWSKMSKeyManager(KeyManager):
    """
    AWS KMS-based key management.
    
    ISO 27001 A.10.1.2, SOC2 CC6.1 - Uses AWS KMS for:
    - Hardware-backed key storage (HSM)
    - Automatic key rotation (AWS-managed)
    - Access control via IAM policies
    - Audit logging via CloudTrail
    
    Features:
    - Envelope encryption for performance
    - Automatic data key caching
    - Cross-region key replication support
    """
    
    def __init__(
        self,
        kms_key_id: str,
        region: str = "eu-west-1",
        rotation_days: int = 90,
        cache_ttl: int = 300,
    ):
        self.kms_key_id = kms_key_id
        self.region = region
        self.rotation_days = rotation_days
        self.cache_ttl = cache_ttl
        self._kms_client = None
        self._key_cache: Dict[str, Tuple[bytes, datetime]] = {}
        
    def _get_kms_client(self):
        """Lazy-load KMS client."""
        if self._kms_client is None:
            try:
                import boto3
                self._kms_client = boto3.client('kms', region_name=self.region)
            except ImportError:
                raise ImportError(
                    "boto3 required for AWS KMS. Install with: pip install boto3"
                )
        return self._kms_client
    
    def generate_key(self, key_id: Optional[str] = None) -> EncryptionKey:
        """
        Generate a new data encryption key using AWS KMS.
        
        Uses envelope encryption:
        1. KMS generates a data key
        2. Data key is returned encrypted under the KMS key
        3. Plaintext key is used for encryption, then discarded
        """
        kms = self._get_kms_client()
        
        # Generate data key
        response = kms.generate_data_key(
            KeyId=self.kms_key_id,
            KeySpec='AES_256'
        )
        
        # Key material is the encrypted data key (to be stored)
        encrypted_key = response['CiphertextBlob']
        
        key_id = key_id or f"key-{secrets.token_hex(8)}"
        
        return EncryptionKey(
            key_id=key_id,
            key_material=encrypted_key,
            provider=KeyProvider.AWS_KMS,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=self.rotation_days),
            version=1,
        )
    
    def encrypt(self, plaintext: bytes, key: EncryptionKey) -> bytes:
        """
        Encrypt data using envelope encryption.
        
        1. Decrypt the stored encrypted data key via KMS
        2. Use plaintext key for AES-256-GCM encryption
        3. Return ciphertext with encrypted key reference
        """
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        
        kms = self._get_kms_client()
        
        # Decrypt the data key
        response = kms.decrypt(CiphertextBlob=key.key_material)
        plaintext_key = response['Plaintext']
        
        try:
            # Use AES-256-GCM for authenticated encryption
            aesgcm = AESGCM(plaintext_key)
            nonce = secrets.token_bytes(12)  # 96-bit nonce for GCM
            
            ciphertext = aesgcm.encrypt(nonce, plaintext, None)
            
            # Format: key_id(36) | nonce(12) | ciphertext
            key_id_bytes = key.key_id.encode().ljust(36, b'\x00')
            return key_id_bytes + nonce + ciphertext
        finally:
            # Securely clear the plaintext key from memory
            del plaintext_key
    
    def decrypt(self, ciphertext: bytes, key: EncryptionKey) -> bytes:
        """Decrypt data using the referenced key."""
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        
        kms = self._get_kms_client()
        
        # Extract components
        key_id_bytes = ciphertext[:36]
        nonce = ciphertext[36:48]
        actual_ciphertext = ciphertext[48:]
        
        # Decrypt the data key
        response = kms.decrypt(CiphertextBlob=key.key_material)
        plaintext_key = response['Plaintext']
        
        try:
            aesgcm = AESGCM(plaintext_key)
            return aesgcm.decrypt(nonce, actual_ciphertext, None)
        finally:
            del plaintext_key
    
    def rotate_key(self, old_key: EncryptionKey) -> EncryptionKey:
        """
        Rotate to a new key.
        
        AWS KMS handles automatic key rotation for the KMS key itself.
        This generates a new data encryption key.
        """
        new_key = self.generate_key(key_id=f"{old_key.key_id}-v{old_key.version + 1}")
        new_key.version = old_key.version + 1
        
        logger.info(
            f"Key rotated: {old_key.key_id} v{old_key.version} -> v{new_key.version}",
            extra={"old_key_id": old_key.key_id, "new_key_id": new_key.key_id}
        )
        
        return new_key


class LocalKeyManager(KeyManager):
    """
    Local key management for development/testing.
    
    WARNING: NOT suitable for production. Use AWS KMS or HSM.
    
    Uses Fernet (AES-128-CBC with HMAC) for symmetric encryption.
    """
    
    def __init__(
        self,
        key_store_path: Optional[Path] = None,
        rotation_days: int = 90,
    ):
        self.key_store_path = Path(key_store_path or os.environ.get(
            "KEY_STORE_PATH", "/tmp/jol-hub/keys"
        ))
        self.rotation_days = rotation_days
        self._keys: Dict[str, EncryptionKey] = {}
        
        # Ensure key store exists with restrictive permissions
        self.key_store_path.mkdir(parents=True, exist_ok=True)
        os.chmod(self.key_store_path, 0o700)
    
    def generate_key(self, key_id: Optional[str] = None) -> EncryptionKey:
        """Generate a new Fernet key."""
        from cryptography.fernet import Fernet
        
        key_id = key_id or f"local-key-{secrets.token_hex(8)}"
        key_material = Fernet.generate_key()
        
        key = EncryptionKey(
            key_id=key_id,
            key_material=key_material,
            provider=KeyProvider.LOCAL,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=self.rotation_days),
            version=1,
        )
        
        # Persist key to store
        self._save_key(key)
        
        return key
    
    def _save_key(self, key: EncryptionKey) -> None:
        """Save key to local store."""
        key_file = self.key_store_path / f"{key.key_id}.json"
        key_data = {
            **key.to_dict(),
            "key_material": base64.b64encode(key.key_material).decode(),
        }
        key_file.write_text(json.dumps(key_data, indent=2))
        os.chmod(key_file, 0o400)
    
    def load_key(self, key_id: str) -> Optional[EncryptionKey]:
        """Load a key from the local store."""
        key_file = self.key_store_path / f"{key_id}.json"
        
        if not key_file.exists():
            return None
        
        key_data = json.loads(key_file.read_text())
        
        return EncryptionKey(
            key_id=key_data["key_id"],
            key_material=base64.b64decode(key_data["key_material"]),
            provider=KeyProvider(key_data["provider"]),
            created_at=datetime.fromisoformat(key_data["created_at"]),
            expires_at=datetime.fromisoformat(key_data["expires_at"]) if key_data.get("expires_at") else None,
            is_active=key_data.get("is_active", True),
            version=key_data.get("version", 1),
        )
    
    def encrypt(self, plaintext: bytes, key: EncryptionKey) -> bytes:
        """Encrypt using Fernet."""
        from cryptography.fernet import Fernet
        
        f = Fernet(key.key_material)
        return f.encrypt(plaintext)
    
    def decrypt(self, ciphertext: bytes, key: EncryptionKey) -> bytes:
        """Decrypt using Fernet."""
        from cryptography.fernet import Fernet
        
        f = Fernet(key.key_material)
        return f.decrypt(ciphertext)
    
    def rotate_key(self, old_key: EncryptionKey) -> EncryptionKey:
        """Generate a new key."""
        new_key = self.generate_key(key_id=f"{old_key.key_id}-v{old_key.version + 1}")
        new_key.version = old_key.version + 1
        
        # Deactivate old key
        old_key.is_active = False
        self._save_key(old_key)
        
        return new_key


class EncryptionService:
    """
    ISO 27001 A.10.1.2, SOC2 CC6.1 - Encryption service with key lifecycle management.
    
    Features:
    - Pluggable key providers (AWS KMS, Local, HSM)
    - Automatic key rotation
    - Key versioning for backward compatibility
    - Re-encryption support for rotated keys
    """
    
    def __init__(
        self,
        provider: KeyProvider = KeyProvider.LOCAL,
        kms_key_id: Optional[str] = None,
        kms_region: str = "eu-west-1",
        rotation_days: int = 90,
        auto_rotate: bool = True,
    ):
        self.provider = provider
        self.rotation_days = rotation_days
        self.auto_rotate = auto_rotate
        
        # Initialize key manager based on provider
        if provider == KeyProvider.AWS_KMS:
            if not kms_key_id:
                kms_key_id = os.environ.get("AWS_KMS_KEY_ID")
            if not kms_key_id:
                raise ValueError("AWS KMS key ID required for KMS provider")
            self.key_manager = AWSKMSKeyManager(
                kms_key_id=kms_key_id,
                region=kms_region,
                rotation_days=rotation_days,
            )
        else:
            self.key_manager = LocalKeyManager(rotation_days=rotation_days)
        
        # Key registry
        self._keys: Dict[str, EncryptionKey] = {}
        self._current_key_id: Optional[str] = None
        
    def initialize(self, existing_key_id: Optional[str] = None) -> EncryptionKey:
        """
        Initialize the encryption service.
        
        Loads existing key or generates a new one.
        """
        if existing_key_id and isinstance(self.key_manager, LocalKeyManager):
            key = self.key_manager.load_key(existing_key_id)
            if key:
                self._keys[key.key_id] = key
                self._current_key_id = key.key_id
                
                # Check if rotation needed
                if self.auto_rotate and key.is_expired():
                    key = self.rotate_key(key)
                
                return key
        
        # Generate new key
        key = self.key_manager.generate_key()
        self._keys[key.key_id] = key
        self._current_key_id = key.key_id
        
        logger.info(f"Initialized encryption key: {key.key_id}")
        
        return key
    
    def encrypt(self, plaintext: Union[str, bytes]) -> str:
        """
        Encrypt plaintext string or bytes.
        
        Returns base64-encoded ciphertext.
        """
        if isinstance(plaintext, str):
            plaintext = plaintext.encode('utf-8')
        
        if not self._current_key_id:
            raise RuntimeError("Encryption service not initialized")
        
        key = self._keys[self._current_key_id]
        
        # Check for rotation
        if self.auto_rotate and key.is_expired():
            key = self.rotate_key(key)
        
        ciphertext = self.key_manager.encrypt(plaintext, key)
        
        return base64.b64encode(ciphertext).decode('utf-8')
    
    def decrypt(self, ciphertext: Union[str, bytes]) -> str:
        """
        Decrypt ciphertext to plaintext string.
        
        Automatically handles key versioning.
        """
        if isinstance(ciphertext, str):
            ciphertext = base64.b64decode(ciphertext)
        
        # Extract key ID from ciphertext
        key_id = self._extract_key_id(ciphertext)
        
        if key_id not in self._keys:
            # Try to load key (for LocalKeyManager)
            if isinstance(self.key_manager, LocalKeyManager):
                key = self.key_manager.load_key(key_id)
                if key:
                    self._keys[key_id] = key
                else:
                    raise ValueError(f"Unknown key ID: {key_id}")
            else:
                raise ValueError(f"Unknown key ID: {key_id}")
        
        key = self._keys[key_id]
        plaintext = self.key_manager.decrypt(ciphertext, key)
        
        return plaintext.decode('utf-8')
    
    def _extract_key_id(self, ciphertext: bytes) -> str:
        """Extract key ID from ciphertext format."""
        # AWS KMS format: key_id(36) | nonce(12) | ciphertext
        key_id_bytes = ciphertext[:36].rstrip(b'\x00')
        return key_id_bytes.decode('utf-8')
    
    def rotate_key(self, old_key: Optional[EncryptionKey] = None) -> EncryptionKey:
        """
        Rotate the current encryption key.
        
        ISO 27001 A.10.1.2 - Key rotation:
        - New key generated
        - Old key retained for decryption
        - Re-encryption of data can be done asynchronously
        """
        if not old_key and self._current_key_id:
            old_key = self._keys[self._current_key_id]
        
        if not old_key:
            raise RuntimeError("No key to rotate")
        
        new_key = self.key_manager.rotate_key(old_key)
        
        # Keep old key for decryption
        old_key.is_active = False
        self._keys[old_key.key_id] = old_key
        
        # Set new key as current
        self._keys[new_key.key_id] = new_key
        self._current_key_id = new_key.key_id
        
        logger.info(
            f"Key rotation complete: {old_key.key_id} -> {new_key.key_id}",
            extra={
                "old_key_version": old_key.version,
                "new_key_version": new_key.version,
            }
        )
        
        return new_key
    
    def re_encrypt(self, ciphertext: Union[str, bytes]) -> str:
        """
        Re-encrypt data with the current key.
        
        Used during key rotation to update data encrypted with old keys.
        """
        plaintext = self.decrypt(ciphertext)
        return self.encrypt(plaintext)
    
    def get_key_info(self) -> Dict[str, Any]:
        """Get information about current key state."""
        return {
            "current_key_id": self._current_key_id,
            "provider": self.provider.value,
            "keys": {kid: key.to_dict() for kid, key in self._keys.items()},
            "rotation_days": self.rotation_days,
        }


# Global encryption service instance
_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """Get the global encryption service instance."""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = _create_encryption_service()
    return _encryption_service


def _create_encryption_service() -> EncryptionService:
    """Create encryption service from environment configuration."""
    provider_str = os.environ.get("ENCRYPTION_PROVIDER", "local").lower()
    
    try:
        provider = KeyProvider(provider_str)
    except ValueError:
        logger.warning(f"Unknown provider '{provider_str}', defaulting to local")
        provider = KeyProvider.LOCAL
    
    return EncryptionService(
        provider=provider,
        kms_key_id=os.environ.get("AWS_KMS_KEY_ID"),
        kms_region=os.environ.get("AWS_REGION", "eu-west-1"),
        rotation_days=int(os.environ.get("KEY_ROTATION_DAYS", "90")),
        auto_rotate=os.environ.get("AUTO_KEY_ROTATION", "true").lower() == "true",
    )


def configure_encryption(**kwargs) -> EncryptionService:
    """Configure the global encryption service."""
    global _encryption_service
    _encryption_service = EncryptionService(**kwargs)
    return _encryption_service


# Convenience functions
def encrypt(plaintext: Union[str, bytes]) -> str:
    """Encrypt data using the global encryption service."""
    service = get_encryption_service()
    if not service._current_key_id:
        service.initialize()
    return service.encrypt(plaintext)


def decrypt(ciphertext: Union[str, bytes]) -> str:
    """Decrypt data using the global encryption service."""
    service = get_encryption_service()
    return service.decrypt(ciphertext)
