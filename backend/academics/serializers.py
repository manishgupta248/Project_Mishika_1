from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Department, Faculty


class FacultyChoiceSerializer(serializers.Serializer):
    """Serializer for Faculty Enum choices, providing value-label pairs for frontend dropdowns."""
    value = serializers.CharField(help_text="Faculty code (e.g., 'I&C')")
    label = serializers.CharField(help_text="Human-readable faculty name (e.g., 'Information Computing')")

    def to_representation(self, instance):
        """Convert Faculty enum tuple to a value-label dictionary."""
        return {'value': instance[0], 'label': instance[1]}


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department model, supporting CRUD operations with audit fields."""
    created_by = serializers.StringRelatedField(read_only=True)
    updated_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Department
        fields = (
            'id', 'name', 'faculty', 'created_by', 'created_at',
            'updated_by', 'updated_at', 'is_deleted'
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_by', 'updated_at')

    def validate(self, attrs):
        """Validate data before create or update."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Authentication is required.")
        return attrs

    def create(self, validated_data):
        """Create a department using the custom manager."""
        try:
            return Department.objects.create_department(
                name=validated_data['name'],
                faculty=validated_data['faculty']
            )
        except ValueError as e:
            raise serializers.ValidationError(str(e))

    def update(self, instance, validated_data):
        """Update department fields, preserving audit trail."""
        instance.name = validated_data.get('name', instance.name)
        instance.faculty = validated_data.get('faculty', instance.faculty)
        instance.save()
        return instance

    @extend_schema_field(serializers.CharField)
    def get_id(self, obj):
        """Document ID as a four-digit string in OpenAPI schema."""
        return obj.id