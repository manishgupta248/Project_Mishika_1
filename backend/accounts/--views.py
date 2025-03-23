# accounts/views.py
"""
API views for user authentication and profile management in the accounts app.
Uses JWT tokens stored in HTTP-only cookies, aligned with settings.SIMPLE_JWT.
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth import authenticate
from django.conf import settings
from django.middleware.csrf import get_token
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer,
)

logger = logging.getLogger(__name__)

class BaseTokenView(APIView):
    """Base class for views handling JWT token cookies."""

    def _set_tokens_in_cookies(self, response, refresh):
        """
        Set access and refresh tokens in HTTP-only cookies.

        Args:
            response (Response): DRF Response object to modify.
            refresh (RefreshToken): JWT refresh token instance.
        """
        secure = not settings.DEBUG  # Secure cookies in production
        access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
        refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()

        response.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'],
            value=str(refresh.access_token),
            httponly=True,
            secure=secure,
            samesite='Strict',
            max_age=int(access_lifetime),
        )
        response.set_cookie(
            key=settings.SIMPLE_JWT['REFRESH_COOKIE'],
            value=str(refresh),
            httponly=True,
            secure=secure,
            samesite='Strict',
            max_age=int(refresh_lifetime),
        )


class RegisterView(BaseTokenView):
    """View for registering a new user and issuing JWT tokens."""
    def post(self, request):
        """
        Handle user registration.

        Args:
            request (Request): HTTP request with user data.

        Returns:
            Response: Success message and user data with tokens in cookies.
        """
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        response = Response(
            {'message': 'Registration successful', 'user': UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        self._set_tokens_in_cookies(response, refresh)
        logger.info(f"User registered: {user.email}")
        return response


class LoginView(BaseTokenView):
    """View for user login and issuing JWT tokens."""
    def post(self, request):
        """
        Handle user login.

        Args:
            request (Request): HTTP request with email and password.

        Returns:
            Response: Success message and user data, or error if credentials are invalid.
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            email=serializer.validated_data['email'].lower(),
            password=serializer.validated_data['password'],
        )
        if not user:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        response = Response(
            {'message': 'Login successful', 'user': UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )
        self._set_tokens_in_cookies(response, refresh)
        logger.info(f"User logged in: {user.email}")
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Safely handle request.data
            refresh_token = None
            if request.data is not None:
                refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                logger.info(f"Refresh token blacklisted for IP: {request.META.get('REMOTE_ADDR')}")
            else:
                logger.info(f"Logout request without refresh token from IP: {request.META.get('REMOTE_ADDR')}")
            return Response({"message": "Logged out successfully"}, status=200)
        except Exception as e:
            logger.error(f"Logout error: {str(e)}")
            # Still return success, as logout intent is clear
            return Response({"message": "Logged out successfully"}, status=200)


class UserProfileView(APIView):
    """View for retrieving and updating user profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieve authenticated user's profile.

        Args:
            request (Request): HTTP request.

        Returns:
            Response: User profile data.
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Update authenticated user's profile.

        Args:
            request (Request): HTTP request with updated profile data.

        Returns:
            Response: Updated user profile data.
        """
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logger.info(f"Profile updated for user: {request.user.email}")
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """View for changing a user's password and invalidating existing tokens."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Handle password change and logout.

        Args:
            request (Request): HTTP request with old and new passwords.

        Returns:
            Response: Success message with cleared cookies.
        """
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.update(request.user, serializer.validated_data)

        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['REFRESH_COOKIE'])
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError as e:
                logger.warning(f"Failed to blacklist refresh token: {str(e)}")

        response = Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK,
        )
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie(settings.SIMPLE_JWT['REFRESH_COOKIE'])
        logger.info(f"Password changed for user: {request.user.email}")
        return response


class TokenRefreshView(APIView):
    """View for refreshing JWT access tokens."""
    def post(self, request):
        """
        Refresh access token using refresh token from cookies.

        Args:
            request (Request): HTTP request with refresh token in cookies.

        Returns:
            Response: New access token in cookies or error if refresh fails.
        """
        refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['REFRESH_COOKIE'])
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            response = Response(
                {'message': 'Token refreshed successfully'},
                status=status.HTTP_200_OK,
            )
            secure = not settings.DEBUG
            access_lifetime = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()

            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=str(token.access_token),
                httponly=True,
                secure=secure,
                samesite='Strict',
                max_age=int(access_lifetime),
            )

            if settings.SIMPLE_JWT['ROTATE_REFRESH_TOKENS']:
                token.blacklist()
                new_refresh = RefreshToken.for_user(request.user)
                refresh_lifetime = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()
                response.set_cookie(
                    key=settings.SIMPLE_JWT['REFRESH_COOKIE'],
                    value=str(new_refresh),
                    httponly=True,
                    secure=secure,
                    samesite='Strict',
                    max_age=int(refresh_lifetime),
                )

            logger.info(f"Token refreshed for user: {request.user.email}")
            return response
        except TokenError:
            return Response(
                {'error': 'Invalid or expired refresh token'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
class CSRFView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({"csrfToken": get_token(request)})