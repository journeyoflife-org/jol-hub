"""
Custom throttle classes for GDPR / SOC2 compliance.

SOC2 CC6.1 - Logical and physical access controls.
ISO 27001 A.12.4.1 - Event logging and rate limiting.

Rate limit strategy:
- Auth endpoints: 10/hour (prevent brute force)
- GDPR data export: 5/hour (prevent data scraping)
- GDPR data deletion: 3/hour (prevent abuse)
- Donation creation: 20/hour (prevent fraud)
- Donation refund: 10/hour (prevent financial abuse)
"""

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class AuthRateThrottle(UserRateThrottle):
    """
    Rate limiter for authentication endpoints.
    
    SOC2 CC6.1 - Prevents brute force attacks on login.
    Rate: 10 requests per hour per user.
    """
    scope = 'auth'


class AuthAnonRateThrottle(AnonRateThrottle):
    """
    Rate limiter for anonymous auth attempts (login, register).
    
    Prevents credential stuffing attacks from unauthenticated users.
    Rate: 10 requests per hour per IP.
    """
    scope = 'auth'


class GDPRExportThrottle(UserRateThrottle):
    """
    Rate limiter for GDPR data export endpoints.
    
    GDPR Art. 20 - Data portability.
    ISO 27001 A.12.4.1 - Prevents data scraping.
    Rate: 5 requests per hour per user.
    """
    scope = 'gdpr_export'


class GDPRDeleteThrottle(UserRateThrottle):
    """
    Rate limiter for GDPR data deletion endpoints.
    
    GDPR Art. 17 - Right to erasure.
    Rate: 3 requests per hour per user.
    """
    scope = 'gdpr_delete'


class DonationCreateThrottle(UserRateThrottle):
    """
    Rate limiter for donation creation.
    
    SOC2 CC6.1 - Prevents fraudulent donation attempts.
    Rate: 20 requests per hour per user.
    """
    scope = 'donation_create'


class DonationRefundThrottle(UserRateThrottle):
    """
    Rate limiter for donation refunds.
    
    SOC2 CC6.1 - Prevents financial abuse.
    Rate: 10 requests per hour per user.
    """
    scope = 'donation_refund'
