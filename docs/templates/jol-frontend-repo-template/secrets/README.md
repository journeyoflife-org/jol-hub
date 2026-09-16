# Secrets Management

This directory contains encrypted secrets managed by [SOPS](https://github.com/getsops/sops) with [age](https://age-encryption.org/) encryption.

## Structure

```
secrets/
├── encrypted/
│   ├── common/          # Shared across environments
│   ├── production/      # Production-only secrets
│   └── critical/        # High-sensitivity secrets (payment keys, etc.)
└── README.md
```

## Rules

1. **Never commit unencrypted secrets.** All `.yaml` files in `encrypted/` must be SOPS-encrypted.
2. **Use `.gitkeep` files** to preserve directory structure (already committed).
3. **Validate before commit:** `python3 scripts/sops-validate.py`
4. **Recipients:** See `.sops.yaml` for the authorized age recipients.

## Adding a Secret

```bash
# Create a new encrypted file
sops --age <recipient-public-key> secrets/encrypted/common/my-secret.yaml

# Edit an existing encrypted file
sops secrets/encrypted/common/my-secret.yaml
```

## Validation

The `scripts/sops-validate.py` script checks:
- All `.yaml` files in `encrypted/` are valid SOPS-encrypted documents
- Recipients match the authorized list in `.sops.yaml`
- No plaintext secrets are present

Run in pre-commit hook or CI: `python3 scripts/sops-validate.py`
