# university/urls.py
"""
Root URL configuration for the University Django project.
Defines the top-level URL patterns and includes app-specific routes.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Base URL patterns for the project
urlpatterns = [
    # Admin Interface
    # In production, consider changing to a non-default path (e.g., 'secret-admin/') for obscurity
    path('admin/', admin.site.urls, name='admin'),

    # API Documentation Endpoints
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui',
    ),

    # Application Routes
    path(
        'auth/',
        include(('accounts.urls', 'accounts'), namespace='accounts'),
        name='auth-root',
    ),
    # path(
    #     'academic/',
    #     include(('academics.urls', 'academics'), namespace='academic'),
    #     name='academic-root',
    # ),

    # Placeholder for Future Apps
    # Uncomment and configure as new apps are developed
    # path(
    #     'courses/',
    #     include(('courses.urls', 'courses'), namespace='courses'),
    #     name='courses-root',
    # ),
]

# Development Static and Media File Serving
if settings.DEBUG:
    # Serve static files in development mode
    urlpatterns += static(
        settings.STATIC_URL,
        document_root=settings.STATIC_ROOT,
    )
    # Serve media files in development mode
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )

# URL Structure Documentation
"""
URL Patterns Overview:
    - /admin/          : Django admin interface for managing the application
    - /api/schema/     : Endpoint for retrieving the OpenAPI schema
    - /api/docs/       : Swagger UI for interactive API documentation
    - /auth/           : Authentication endpoints (e.g., login, register)
    - /academic/       : Academic-related endpoints (e.g., courses, grades)
    - /courses/        : Future endpoint for course management (placeholder)

Best Practices:
    - In production, use a web server (e.g., Nginx or Apache) to serve static and media files.
    - Avoid exposing predictable admin URLs in production; customize the path for security.
    - Ensure DEBUG=False in production to disable static/media serving via Django.
"""