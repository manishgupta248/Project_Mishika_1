from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import Department, Faculty
from .serializers import DepartmentSerializer, FacultyChoiceSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing Department CRUD operations with filtering and soft deletion."""
    serializer_class = DepartmentSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ('faculty', 'is_deleted')
    queryset = Department.objects.all().order_by('id')
    pagination_class = None  # Optional: disable pagination

    def get_permissions(self):
        """Apply permissions: AllowAny for GET, IsAuthenticated for others."""
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter queryset: staff see all, others see only active departments."""
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            return self.queryset
        return self.queryset.filter(is_deleted=False)

    @extend_schema(
        responses={200: DepartmentSerializer(many=True)},
        parameters=[
            OpenApiParameter(name='faculty', description='Filter by faculty code', type=str),
            OpenApiParameter(name='is_deleted', description='Filter by soft deletion status', type=bool),
        ],
    )
    def list(self, request, *args, **kwargs):
        """List departments with optional filtering by faculty and is_deleted."""
        return super().list(request, *args, **kwargs)

    @extend_schema(
        request=DepartmentSerializer,
        responses={201: DepartmentSerializer},
    )
    def create(self, request, *args, **kwargs):
        """Create a new department (requires authentication)."""
        return super().create(request, *args, **kwargs)

    @extend_schema(
        request=DepartmentSerializer,
        responses={200: DepartmentSerializer},
    )
    def update(self, request, *args, **kwargs):
        """Update an existing department (requires authentication)."""
        return super().update(request, *args, **kwargs)

    def perform_destroy(self, instance):
        """Perform soft deletion instead of hard deletion."""
        instance.delete(soft=True)

    @extend_schema(
        responses={204: None},
        description="Soft-delete a department by setting is_deleted=True",
    )
    def destroy(self, request, *args, **kwargs):
        """Soft-delete a department (requires authentication)."""
        return super().destroy(request, *args, **kwargs)


class FacultyChoicesView(APIView):
    """API endpoint to retrieve Faculty enum choices for frontend dropdowns."""
    permission_classes = (AllowAny,)

    @extend_schema(
        responses={200: FacultyChoiceSerializer(many=True)},
        description="List all faculty choices as value-label pairs.",
    )
    def get(self, request):
        """Return Faculty enum choices."""
        choices = Faculty.choices()
        serializer = FacultyChoiceSerializer(choices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)