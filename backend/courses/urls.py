# courses/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, SyllabusViewSet, CourseCategoryChoicesView,
    CourseTypeChoicesView, CBCSCategoryChoicesView
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'syllabi', SyllabusViewSet, basename='syllabus')

urlpatterns = [
    path('', include(router.urls)),
    path('course-category-choices/', CourseCategoryChoicesView.as_view(), name='course-category-choices'),
    path('course-type-choices/', CourseTypeChoicesView.as_view(), name='course-type-choices'),
    path('cbcs-category-choices/', CBCSCategoryChoicesView.as_view(), name='cbcs-category-choices'),
]

# API Endpoints:
# - GET/POST /courses/ - List or create courses
# - GET/PUT/DELETE /courses/{course_code}/ - Retrieve, update, or soft-delete a course
# - GET/POST /syllabi/ - List or create syllabi
# - GET/PUT/DELETE /syllabi/{id}/ - Retrieve, update, or soft-delete a syllabus
# - GET /course-categories/ - List course category options
# - GET /course-types/ - List course type options
# - GET /cbcs-categories/ - List CBCS category options