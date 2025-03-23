# accounts/authentication.py
"""
Custom JWT authentication class for the accounts app.
Authenticates users using tokens stored in HTTP-only cookies, with optional header fallback.
"""

import logging
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.conf import settings

logger = logging.getLogger(__name__)

class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom authentication class extending JWTAuthentication.
    Prioritizes token retrieval from cookies, with fallback to headers if enabled.
    """

    def authenticate(self, request):
        """
        Authenticate a request using a JWT token from cookies or headers.

        Args:
            request (Request): The incoming HTTP request.

        Returns:
            tuple: (user, validated_token) if authentication succeeds, None if no token is provided.

        Raises:
            AuthenticationFailed: If token is invalid, user is inactive, or other errors occur.
        """
        # Retrieve token from cookie (primary method)
        raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE'])

        # Fallback to header if cookie is empty and header auth is enabled
        if not raw_token and getattr(settings, 'ALLOW_HEADER_AUTH', False):
            header = self.get_header(request)
            if header:
                raw_token = self.get_raw_token(header)

        # If no token is found, return None (unauthenticated)
        if not raw_token:
            logger.debug("No JWT token found in cookies or headers.")
            return None

        try:
            # Validate the token
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)

            # Check if user is active
            if not user.is_active:
                logger.warning(f"Authentication failed: Inactive user '{user.email}'.")
                raise AuthenticationFailed(
                    _("User account is disabled."),
                    code='user_inactive',
                )

            logger.debug(f"User authenticated successfully: {user.email}")
            return (user, validated_token)

        except InvalidToken as e:
            logger.warning(f"Invalid token provided: {str(e)}")
            raise AuthenticationFailed(
                _("Invalid or expired token."),
                code='invalid_token',
            )
        except get_user_model().DoesNotExist:
            logger.error("User associated with token not found.")
            raise AuthenticationFailed(
                _("User not found."),
                code='user_not_found',
            )
        except Exception as e:
            logger.error(f"Unexpected authentication error: {str(e)}")
            raise AuthenticationFailed(
                _("Authentication failed due to an unexpected error."),
                code='authentication_failed',
            )