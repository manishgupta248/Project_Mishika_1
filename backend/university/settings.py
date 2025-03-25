# university/settings.py
"""
Django settings for the University project.
Generated and customized for a secure, scalable backend integrated with Next.js.
"""
import os
from pathlib import Path
from decouple import config, Csv
from django.core.exceptions import ImproperlyConfigured
import logging
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Helper function to raise errors for missing environment variables
def get_env_variable(var_name, default=None, cast=None):
    """
    Retrieve an environment variable with optional default and casting.

    Args:
        var_name (str): Name of the environment variable.
        default: Default value if variable is not set (optional).
        cast: Function to cast the value (e.g., bool, int, Csv) (optional).

    Returns:
        The casted or raw value of the environment variable.

    Raises:
        ImproperlyConfigured: If variable is required and not found.
    """
    try:
        # If a cast is provided, apply it; otherwise, return the raw value
        if cast is not None:
            return config(var_name, default=default, cast=cast)
        return config(var_name, default=default)
    except KeyError:
        if default is None:
            error_msg = f"Set the {var_name} environment variable"
            logger.error(error_msg)
            raise ImproperlyConfigured(error_msg)
        return default

# Core Security Settings
SECRET_KEY = get_env_variable('SECRET_KEY')  # Required, no default
DEBUG = get_env_variable('DEBUG', default='False', cast=bool)
ALLOWED_HOSTS = get_env_variable('ALLOWED_HOSTS', cast=Csv())

# Application Mode
DEBUG = config("DEBUG", default=False, cast=bool)  # Default to False for safety

# Application definition
INSTALLED_APPS = [
    # Django Core Apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-Party Apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    'rest_framework_simplejwt.token_blacklist',
    'django_filters',
    'import_export',
    # Local Apps
    'accounts.apps.AccountsConfig',
    'academics.apps.AcademicsConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # For static file serving
    'django.contrib.sessions.middleware.SessionMiddleware',
    "corsheaders.middleware.CorsMiddleware",  # Must be before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django_currentuser.middleware.ThreadLocalUserMiddleware',  # For CurrentUserField
]

ROOT_URLCONF = 'university.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'university.wsgi.application'


# Database Configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': get_env_variable('DB_NAME'),
        'USER': get_env_variable('DB_USER'),
        'PASSWORD': get_env_variable('DB_PASSWORD'),
        'HOST': get_env_variable('DB_HOST'),
        'PORT': get_env_variable('DB_PORT', cast=int),
        'CONN_MAX_AGE': 600,  # Persistent connections for performance
        'OPTIONS': {'connect_timeout': 10},
    }
}


# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = get_env_variable('TIME_ZONE', default='UTC')
USE_I18N = True
USE_TZ = True   # Enable timezone-aware datetimes



# Static files (CSS, JavaScript, Images)
# Static and Media Files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# My Additional Settings

# CORS Configuration
CORS_ALLOWED_ORIGINS = get_env_variable('CORS_ALLOWED_ORIGINS', cast=Csv())
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type', 'dnt',
    'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]

# Custom User Model
AUTH_USER_MODEL = "accounts.CustomUser"

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('accounts.authentication.CookieJWTAuthentication',),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'EXCEPTION_HANDLER': 'university.utils.custom_exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {'anon': '100/hour', 'user': '1000/hour'},
    'DEFAULT_RENDERER_CLASSES': ('rest_framework.renderers.JSONRenderer',),
}

# Security Settings
SECURE_SSL_REDIRECT = get_env_variable('SECURE_SSL_REDIRECT', default='False', cast=bool)
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0  # 1 year HSTS in production
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
CSRF_COOKIE_SECURE = get_env_variable('CSRF_COOKIE_SECURE', default='False', cast=bool)
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax' if DEBUG else 'Strict'
SESSION_COOKIE_SECURE = get_env_variable('SESSION_COOKIE_SECURE', default='False', cast=bool)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax' if DEBUG else 'Strict'
CSRF_TRUSTED_ORIGINS = get_env_variable('CSRF_TRUSTED_ORIGINS', default='', cast=Csv())

# JWT Configuration (for django-rest-framework-simplejwt)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': get_env_variable('JWT_SIGNING_KEY', default=SECRET_KEY),
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'AUTH_COOKIE': 'access_token',
    'REFRESH_COOKIE': 'refresh_token',
    'AUTH_COOKIE_SECURE': not DEBUG,  # Secure in production
    'AUTH_COOKIE_HTTP_ONLY': True,
    'AUTH_COOKIE_SAMESITE': 'Strict',
}

# API Documentation (DRF Spectacular)
SPECTACULAR_SETTINGS = {
    'TITLE': 'University API',
    'DESCRIPTION': 'API for managing user authentication and academic resources',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': True,
    'SECURITY': [{
        'BearerAuth': {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
        }
    }],
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
    },
}

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'accounts': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Additional Settings
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
SITE_ID = 1

# Email Configuration (Uncomment and configure in production)
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = get_env_variable('EMAIL_HOST', default='smtp.gmail.com')
# EMAIL_PORT = get_env_variable('EMAIL_PORT', default=587, cast=int)
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = get_env_variable('EMAIL_HOST_USER')
# EMAIL_HOST_PASSWORD = get_env_variable('EMAIL_HOST_PASSWORD')
# DEFAULT_FROM_EMAIL = get_env_variable('DEFAULT_FROM_EMAIL')

# Health Check
DATABASE_HEALTH_CHECK = True

# Startup Validation
def perform_startup_validation():
    """Validate essential directories and database connection at startup."""
    try:
        os.makedirs(BASE_DIR / 'logs', exist_ok=True)
        os.makedirs(MEDIA_ROOT, exist_ok=True)
        from django.db import connections
        connections['default'].ensure_connection()
    except Exception as e:
        logger.error(f"Startup validation failed: {str(e)}")
        raise

try:
    perform_startup_validation()
except Exception as e:
    raise  # Re-raise to prevent server startup if validation fails

# Pillow Validation
try:
    from PIL import Image
except ImportError:
    logger.error("Pillow is required for image processing.")
    raise ImproperlyConfigured("Install Pillow with 'pip install Pillow'")