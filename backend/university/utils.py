# university/utils.py
import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError, AuthenticationFailed, PermissionDenied
from django.http import Http404

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Custom exception handler to enhance DRF error responses with additional context.
    
    Args:
        exc: The exception raised during request processing.
        context: Dictionary containing request, view, and other context data.
    
    Returns:
        Response object with enriched error data or None if unhandled.
    """
    # Get the default DRF exception handler response
    response = exception_handler(exc, context)
    
    if response is not None:
        # Enrich response data
        error_data = {
            "status_code": response.status_code,
            "error": str(exc),
            "view": str(context.get('view', 'unknown')),
            "method": context['request'].method,
        }
        
        # Customize error messages based on exception type
        if isinstance(exc, ValidationError):
            error_data["message"] = "Invalid input data provided."
            logger.warning(
                f"Validation error in {context['view']} "
                f"(Method: {context['request'].method}): {exc}"
            )
        elif isinstance(exc, AuthenticationFailed):
            error_data["message"] = "Authentication failed. Please check your credentials."
            logger.error(f"Auth error in {context['view']}: {exc}")
        elif isinstance(exc, PermissionDenied):
            error_data["message"] = "You do not have permission to perform this action."
            logger.error(f"Permission denied in {context['view']}: {exc}")
        elif isinstance(exc, Http404):
            error_data["message"] = "Requested resource not found."
            logger.info(f"404 in {context['view']}: {exc}")
        else:
            error_data["message"] = "An unexpected error occurred."
            logger.error(
                f"Unhandled exception in {context['view']} "
                f"(Method: {context['request'].method}): {exc}",
                exc_info=True  # Include stack trace in logs
            )
        
        # Preserve field-specific errors if present (e.g., from ValidationError)
        if isinstance(exc, ValidationError) and hasattr(exc, 'detail'):
            error_data["details"] = exc.detail
        
        response.data = error_data
    
    return response

# Ensure this is registered in settings.py
# REST_FRAMEWORK = {
#     'EXCEPTION_HANDLER': 'university.utils.custom_exception_handler',
# }