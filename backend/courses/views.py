# courses/views.py
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import Course, Syllabus, CourseCategory, CourseType, CBCSCategory
from .serializers import CourseSerializer, SyllabusSerializer, ChoiceSerializer
from rest_framework.pagination import PageNumberPagination

class CoursePagination(PageNumberPagination):
    """Pagination settings for Course API."""
    page_size = 10
    page_size_query_param = 'limit'
    max_page_size = 100

class SyllabusPagination(PageNumberPagination):
    """Pagination settings for Syllabus API."""
    page_size = 5
    page_size_query_param = 'limit'
    max_page_size = 50

@extend_schema(
    tags=['Courses'],
    responses={200: CourseSerializer(many=True)},
    parameters=[
        OpenApiParameter(name='discipline', type=OpenApiTypes.INT, location=OpenApiParameter.QUERY,
                         description='Filter by department ID'),
        OpenApiParameter(name='course_category', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY,
                         description='Filter by course category (e.g., COMPULSORY, ELECTIVE)'),
        OpenApiParameter(name='type', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY,
                         description='Filter by course type (e.g., THEORY, PRACTICAL)'),
        OpenApiParameter(name='cbcs_category', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY,
                         description='Filter by CBCS category (e.g., CORE, DSE)'),
        OpenApiParameter(name='is_deleted', type=OpenApiTypes.BOOL, location=OpenApiParameter.QUERY,
                         description='Filter by deletion status (true/false)'),
        OpenApiParameter(name='search', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY,
                         description='Search by course_code or course_name'),
        OpenApiParameter(name='ordering', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY,
                         description='Order by: course_code, course_name, created_at, updated_at'),
    ],
    examples=[
        OpenApiExample(
            'List Courses Example',
            value=[{'course_code': 'CS101', 'course_name': 'Intro to Programming', 'course_category': 'COMPULSORY'}],
            response_only=True,
        )
    ]
)
class CourseViewSet(viewsets.ModelViewSet):
    """ViewSet for CRUD operations on Course model."""
    serializer_class = CourseSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['discipline', 'course_category', 'type', 'cbcs_category', 'is_deleted']
    search_fields = ['course_code', 'course_name']
    ordering_fields = ['course_code', 'course_name', 'created_at', 'updated_at']
    ordering = ['course_code']
    pagination_class = CoursePagination
    queryset = Course.objects.all()

    def get_permissions(self):
        """Dynamic permissions based on action."""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        elif self.action in ['create', 'update', 'partial_update']:
            return [IsAuthenticated()]
        elif self.action == 'destroy':
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter queryset based on user role."""
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return self.queryset
        return self.queryset.filter(is_deleted=False)

    @extend_schema(
        description="Soft delete a course by setting is_deleted to true.",
        responses={204: None}
    )
    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()

@extend_schema(
    tags=['Syllabi'],
    responses={200: SyllabusSerializer(many=True)},
    parameters=[
        OpenApiParameter(name='course', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY,
                         description='Filter by course_code'),
        OpenApiParameter(name='version', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY,
                         description='Filter by syllabus version (e.g., 1.0)'),
        OpenApiParameter(name='is_deleted', type=OpenApiTypes.BOOL, location=OpenApiParameter.QUERY,
                         description='Filter by deletion status (true/false)'),
        OpenApiParameter(name='search', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY,
                         description='Search by course__course_code, course_name, or version'),
        OpenApiParameter(name='ordering', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY,
                         description='Order by: course__course_code, version, uploaded_at, updated_at'),
    ],
    examples=[
        OpenApiExample(
            'List Syllabi Example',
            value=[{'id': 1, 'course': 'CS101', 'version': '1.0', 'syllabus_file': '/syllabi/2023/10/01/cs101.pdf'}],
            response_only=True,
        )
    ]
)
class SyllabusViewSet(viewsets.ModelViewSet):
    """ViewSet for CRUD operations on Syllabus model."""
    serializer_class = SyllabusSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['course', 'version', 'is_deleted']
    search_fields = ['course__course_code', 'course_name', 'version']
    ordering_fields = ['course__course_code', 'version', 'uploaded_at', 'updated_at']
    ordering = ['course__course_code', '-version']
    pagination_class = SyllabusPagination
    queryset = Syllabus.objects.all()

    def get_permissions(self):
        """Dynamic permissions based on action."""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        elif self.action in ['create', 'update', 'partial_update']:
            return [IsAuthenticated()]
        elif self.action == 'destroy':
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter queryset based on user role."""
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return self.queryset
        return self.queryset.filter(is_deleted=False)

    @extend_schema(
        description="Soft delete a syllabus by setting is_deleted to true.",
        responses={204: None}
    )
    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()

class ChoiceAPIView(APIView):
    """Base class for retrieving Enum choices."""
    permission_classes = [AllowAny]
    choice_class = None

    @extend_schema(
        responses={200: ChoiceSerializer(many=True)},
        examples=[
            OpenApiExample(
                'Choices Example',
                value=[{'value': 'COMPULSORY', 'label': 'Compulsory'}],
                response_only=True,
            )
        ]
    )
    def get(self, request):
        if not self.choice_class:
            return Response({"error": "Choice class not defined"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        choices = self.choice_class.choices()
        serializer = ChoiceSerializer(choices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@extend_schema(tags=['Choices'], description="List available course category options.")
class CourseCategoryChoicesView(ChoiceAPIView):
    choice_class = CourseCategory

@extend_schema(tags=['Choices'], description="List available course type options.")
class CourseTypeChoicesView(ChoiceAPIView):
    choice_class = CourseType

@extend_schema(tags=['Choices'], description="List available CBCS category options.")
class CBCSCategoryChoicesView(ChoiceAPIView):
    choice_class = CBCSCategory