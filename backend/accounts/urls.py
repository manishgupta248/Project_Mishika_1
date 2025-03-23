# accounts/urls.py
"""
URL configuration for the accounts app.
Defines endpoints for authentication and user profile management.
"""

from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView,
    UserProfileView, ChangePasswordView, TokenRefreshView,
)

app_name = 'accounts'  # Namespace for URL reversing

urlpatterns = [
    path(
        'register/',
        RegisterView.as_view(),
        name='register',
    ),
    path(
        'login/',
        LoginView.as_view(),
        name='login',
    ),
    path(
        'logout/',
        LogoutView.as_view(),
        name='logout',
    ),
    path(
        'me/',
        UserProfileView.as_view(),
        name='user_profile',
    ),
    path(
        'password/change/',
        ChangePasswordView.as_view(),
        name='change_password',
    ),
    path(
        'token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh',
    ),
]

"""
URL Patterns Overview:
    - auth/register/        : Register a new user
    - auth/login/           : Login and obtain JWT tokens
    - auth/logout/          : Logout and blacklist refresh token
    - auth/me/              : Get or update user profile
    - auth/password/change/ : Change user password
    - auth/token/refresh/   : Refresh JWT access token
"""