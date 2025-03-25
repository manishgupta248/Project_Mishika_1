# courses/serializers.py
import re
from rest_framework import serializers
from .models import Course, Syllabus, Department

class ChoiceSerializer(serializers.Serializer):
    """Serializer for Enum choices to provide value-label pairs for frontend."""
    value = serializers.CharField(source='name')
    label = serializers.CharField()

    def to_representation(self, instance):
        return {'value': instance[0], 'label': instance[1]}

class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model CRUD operations."""
    created_by = serializers.StringRelatedField(read_only=True)
    updated_by = serializers.StringRelatedField(read_only=True)
    discipline = serializers.PrimaryKeyRelatedField(queryset=Department.objects.all())

    class Meta:
        model = Course
        fields = [
            'course_code', 'course_name', 'course_category', 'type', 'cbcs_category',
            'maximum_credit', 'discipline', 'created_by', 'created_at', 'updated_by',
            'updated_at', 'is_deleted'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_by', 'updated_at']

    def validate(self, data):
        if 'course_code' in data:
            course_code = data['course_code']
             # Regular expression to match the format CSE-101-V1
            if not re.match(r'^[A-Za-z]+-\d+-[Vv\d]+$', course_code):
                raise serializers.ValidationError({"course_code": "Course code must be in the format CSE-101-V1."})
        return data

class SyllabusSerializer(serializers.ModelSerializer):
    """Serializer for Syllabus model CRUD operations."""
    uploaded_by = serializers.StringRelatedField(read_only=True)
    updated_by = serializers.StringRelatedField(read_only=True)
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.filter(is_deleted=False))
    syllabus_file = serializers.FileField(max_length=255, use_url=True)

    class Meta:
        model = Syllabus
        fields = [
            'id', 'course', 'course_name', 'syllabus_file', 'uploaded_by', 'uploaded_at',
            'updated_by', 'updated_at', 'description', 'version', 'is_deleted'
        ]
        read_only_fields = ['course_name', 'uploaded_by', 'uploaded_at', 'updated_by', 'updated_at']

    def validate_version(self, value):
        import re
        if not re.match(r'^\d+\.\d+$', value):
            raise serializers.ValidationError("Version must be in format 'X.Y' (e.g., 1.0).")
        return value

    def validate_syllabus_file(self, value):
        from .validators import validate_pdf
        validate_pdf(value)
        return value