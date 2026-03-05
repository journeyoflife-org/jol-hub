"""
Custom DRF exception handler — returns consistent JSON error envelopes.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Wraps DRF default exceptions in a uniform shape:

        {
            "error":   "<snake_case_code>",
            "message": "<human-readable message>",
            "details": [...optional field errors...]
        }
    """
    response = exception_handler(exc, context)

    if response is None:
        return None

    error_code = 'error'
    message = 'An error occurred.'
    details = None

    if isinstance(response.data, dict):
        # DRF ValidationError with field errors
        if 'detail' in response.data:
            message = str(response.data['detail'])
            error_code = getattr(response.data['detail'], 'code', 'error')
        else:
            # Field-level validation errors
            error_code = 'validation_error'
            message = 'Invalid input.'
            details = response.data
    elif isinstance(response.data, list):
        error_code = 'validation_error'
        message = 'Invalid input.'
        details = response.data

    payload = {'error': error_code, 'message': message}
    if details:
        payload['details'] = details

    response.data = payload
    return response
