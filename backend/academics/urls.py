from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, FacultyChoicesView

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')

urlpatterns = [
    path('', include(router.urls)),
    path('faculty-choices/', FacultyChoicesView.as_view(), name='faculty-choices'),
]

"""
API Endpoints:
- GET /academics/departments/ : List departments (public, filtered for non-staff)
- GET /academics/departments/<id>/ : Retrieve a department (public)
- POST /academics/departments/ : Create a department (authenticated)
- PUT /academics/departments/<id>/ : Update a department (authenticated)
- DELETE /academics/departments/<id>/ : Soft-delete a department (authenticated)
- GET /academics/faculty-choices/ : List faculty choices (public)
"""