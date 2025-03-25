from django.contrib import admin
from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget, BooleanWidget
from import_export.admin import ImportExportModelAdmin
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE
from django.contrib.contenttypes.models import ContentType
from .models import Course, Syllabus, CourseCategory, CourseType, CBCSCategory
from academics.models import Department, User  # Adjust based on your app structure


# === COURSE RESOURCE ===
class CourseResource(resources.ModelResource):
    """Resource class for Course model import/export."""
    
    created_by = fields.Field(
        column_name='created_by',
        attribute='created_by',
        widget=ForeignKeyWidget(User, field='username'),
    )
    
    updated_by = fields.Field(
        column_name='updated_by',
        attribute='updated_by',
        widget=ForeignKeyWidget(User, field='username'),
    )
    
    discipline = fields.Field(
        column_name='discipline',
        attribute='discipline',
        widget=ForeignKeyWidget(Department, field='id'),
    )
    
    course_category = fields.Field(
        column_name='course_category',
        attribute='course_category',
    )
    
    type = fields.Field(
        column_name='type',
        attribute='type',
    )
    
    cbcs_category = fields.Field(
        column_name='cbcs_category',
        attribute='cbcs_category',
    )
    
    is_deleted = fields.Field(
        column_name='is_deleted',
        attribute='is_deleted',
        widget=BooleanWidget(),
    )

    class Meta:
        model = Course
        fields = (
            'course_code', 'course_name', 'course_category', 'type', 'cbcs_category',
            'maximum_credit', 'discipline', 'created_by', 'created_at', 'updated_by',
            'updated_at', 'is_deleted'
        )
        export_order = (
            'course_code', 'course_name', 'course_category', 'type', 'cbcs_category',
            'maximum_credit', 'discipline', 'created_by', 'created_at', 'updated_by',
            'updated_at', 'is_deleted'
        )
        import_id_fields = ('course_code',)
        skip_unchanged = True
        report_skipped = True

    def before_import_row(self, row, **kwargs):
        """Validate and prepare data before import."""
        # Validate course_category
        course_category = row.get('course_category')
        if course_category not in [c.name for c in CourseCategory]:
            raise ValueError(f"Invalid course_category '{course_category}'. Must be one of: {[c.name for c in CourseCategory]}")
        
        # Validate type
        course_type = row.get('type')
        if course_type not in [t.name for t in CourseType]:
            raise ValueError(f"Invalid type '{course_type}'. Must be one of: {[t.name for t in CourseType]}")
        
        # Validate cbcs_category
        cbcs_category = row.get('cbcs_category')
        if cbcs_category not in [c.name for c in CBCSCategory]:
            raise ValueError(f"Invalid cbcs_category '{cbcs_category}'. Must be one of: {[c.name for c in CBCSCategory]}")
        
        # Validate course_code
        # course_code = row.get('course_code')
        # if not course_code or not isinstance(course_code, str) or not course_code.isalnum():
        #     raise ValueError(f"Course code '{course_code}' must be a non-empty alphanumeric string")

        # Validate maximum_credit
        max_credit = row.get('maximum_credit')
        if max_credit and (not isinstance(max_credit, (int, str)) or int(max_credit) not in range(21)):
            raise ValueError(f"Maximum credit '{max_credit}' must be an integer between 0 and 20")

    def dehydrate_created_by(self, course):
        """Format created_by for export."""
        return course.created_by.username if course.created_by else ''

    def dehydrate_updated_by(self, course):
        """Format updated_by for export."""
        return course.updated_by.username if course.updated_by else ''

    def dehydrate_discipline(self, course):
        """Format discipline for export."""
        return course.discipline.id if course.discipline else ''


# === SYLLABUS RESOURCE ===
class SyllabusResource(resources.ModelResource):
    """Resource class for Syllabus model import/export."""
    
    course = fields.Field(
        column_name='course',
        attribute='course',
        widget=ForeignKeyWidget(Course, field='course_code'),
    )
    
    uploaded_by = fields.Field(
        column_name='uploaded_by',
        attribute='uploaded_by',
        widget=ForeignKeyWidget(User, field='username'),
    )
    
    updated_by = fields.Field(
        column_name='updated_by',
        attribute='updated_by',
        widget=ForeignKeyWidget(User, field='username'),
    )
    
    is_deleted = fields.Field(
        column_name='is_deleted',
        attribute='is_deleted',
        widget=BooleanWidget(),
    )

    class Meta:
        model = Syllabus
        fields = (
            'id', 'course', 'course_name', 'syllabus_file', 'uploaded_by', 'uploaded_at',
            'updated_by', 'updated_at', 'description', 'version', 'is_deleted'
        )
        export_order = (
            'id', 'course', 'course_name', 'syllabus_file', 'uploaded_by', 'uploaded_at',
            'updated_by', 'updated_at', 'description', 'version', 'is_deleted'
        )
        import_id_fields = ('id',)
        skip_unchanged = True
        report_skipped = True

    def before_import_row(self, row, **kwargs):
        """Validate and prepare data before import."""
        # Validate version
        version = row.get('version')
        import re
        if not version or not re.match(r'^\d+\.\d+$', version):
            raise ValueError(f"Version '{version}' must be in format 'X.Y' (e.g., 1.0)")

        # Validate course
        course_code = row.get('course')
        if not Course.objects.filter(course_code=course_code).exists():
            raise ValueError(f"Course with code '{course_code}' does not exist")

    def dehydrate_course(self, syllabus):
        """Format course for export."""
        return syllabus.course.course_code if syllabus.course else ''

    def dehydrate_uploaded_by(self, syllabus):
        """Format uploaded_by for export."""
        return syllabus.uploaded_by.username if syllabus.uploaded_by else ''

    def dehydrate_updated_by(self, syllabus):
        """Format updated_by for export."""
        return syllabus.updated_by.username if syllabus.updated_by else ''

    def dehydrate_syllabus_file(self, syllabus):
        """Format syllabus_file for export."""
        return syllabus.syllabus_file.url if syllabus.syllabus_file else ''


# === COURSE ADMIN ===
@admin.register(Course)
class CourseAdmin(ImportExportModelAdmin):
    """Admin configuration for Course model."""
    
    resource_class = CourseResource
    
    list_display = ('course_code', 'course_name', 'course_category', 'type', 'cbcs_category', 'is_active', 'created_at')
    list_filter = ('course_category', 'type', 'cbcs_category', 'is_deleted', 'created_at')
    search_fields = ('course_code', 'course_name')
    readonly_fields = ('created_by', 'created_at', 'updated_by', 'updated_at')
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course_code', 'course_name', 'course_category', 'type', 'cbcs_category', 'maximum_credit', 'discipline', 'is_deleted'),
        }),
        ('Audit Information', {
            'fields': ('created_by', 'created_at', 'updated_by', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset for admin list view."""
        qs = super().get_queryset(request)
        return qs.select_related('discipline', 'created_by', 'updated_by')

    def has_delete_permission(self, request, obj=None):
        """Allow soft deletion only via is_deleted field."""
        return False

    def delete_model(self, request, obj):
        """Override to enforce soft deletion."""
        obj.is_deleted = True
        obj.save()

    def generate_log_entries(self, result, request):
        """Override to log import actions."""
        for row_idx, row in enumerate(result):
            if row.import_type in ('new', 'update'):
                action_flag = ADDITION if row.import_type == 'new' else CHANGE
                LogEntry.objects.log_action(
                    user_id=request.user.pk,
                    content_type_id=ContentType.objects.get_for_model(self.model).pk,
                    object_id=row.object_id,
                    object_repr=row.object_repr,
                    action_flag=action_flag,
                    change_message=f"Imported via excel file (row {row_idx + 1})",
                )


# === SYLLABUS ADMIN ===
@admin.register(Syllabus)
class SyllabusAdmin(ImportExportModelAdmin):
    """Admin configuration for Syllabus model."""
    
    resource_class = SyllabusResource
    
    list_display = ('id', 'course', 'version', 'uploaded_at', 'is_active')
    list_filter = ('course', 'is_deleted', 'uploaded_at')
    search_fields = ('course__course_code', 'course_name', 'version')
    readonly_fields = ('course_name', 'uploaded_by', 'uploaded_at', 'updated_by', 'updated_at')
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('course', 'course_name', 'syllabus_file', 'version', 'description', 'is_deleted'),
        }),
        ('Audit Information', {
            'fields': ('uploaded_by', 'uploaded_at', 'updated_by', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset for admin list view."""
        qs = super().get_queryset(request)
        return qs.select_related('course', 'uploaded_by', 'updated_by')

    def has_delete_permission(self, request, obj=None):
        """Allow soft deletion only via is_deleted field."""
        return False

    def delete_model(self, request, obj):
        """Override to enforce soft deletion."""
        obj.is_deleted = True
        obj.save()

    def generate_log_entries(self, result, request):
        """Override to log import actions."""
        for row_idx, row in enumerate(result):
            if row.import_type in ('new', 'update'):
                action_flag = ADDITION if row.import_type == 'new' else CHANGE
                LogEntry.objects.log_action(
                    user_id=request.user.pk,
                    content_type_id=ContentType.objects.get_for_model(self.model).pk,
                    object_id=row.object_id,
                    object_repr=row.object_repr,
                    action_flag=action_flag,
                    change_message=f"Imported via excel file (row {row_idx + 1})",
                )