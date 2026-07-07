"""
Bitrix24 Webhooks package.
"""

from .handlers import WebhookHandler, WebhookEvent, bitrix24_webhook, get_webhook_handler

__all__ = [
    "WebhookHandler",
    "WebhookEvent",
    "bitrix24_webhook",
    "get_webhook_handler",
]
