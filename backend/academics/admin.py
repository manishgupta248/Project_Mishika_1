from django.contrib import admin
from import_export import resources, fields
from import_export.widgets import ForeignKeyWidget, BooleanWidget, CharWidget
from import_export.admin import ImportExportModelAdmin
from django.contrib.admin.models import LogEntry, ADDITION, CHANGE
from django.contrib.contenttypes.models import ContentType  # Correct import for ContentType
from academics.models import Department, Faculty, User  # Adjust import based on your app structure


class DepartmentResource(resources.ModelResource):
    """Resource class for Department model import/export."""
    
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
    
    faculty = fields.Field(
        column_name='faculty',
        attribute='faculty',
        widget=CharWidget(),
    )
    
    is_deleted = fields.Field(
        column_name='is_deleted',
        attribute='is_deleted',
        widget=BooleanWidget(),
    )

    class Meta:
        model = Department
        fields = ('id', 'name', 'faculty', 'created_by', 'created_at', 'updated_by', 'updated_at', 'is_deleted')
        export_order = ('id', 'name', 'faculty', 'created_by', 'created_at', 'updated_by', 'updated_at', 'is_deleted')
        import_id_fields = ('id',)
        skip_unchanged = True
        report_skipped = True

    def before_import_row(self, row, **kwargs):
        """Validate and prepare data before import."""
        faculty_value = row.get('faculty')
        if faculty_value not in [f.value for f in Faculty]:
            raise ValueError(f"Invalid faculty value '{faculty_value}'. Must be one of: {[f.value for f in Faculty]}")
        
        dept_id = row.get('id')
        if dept_id and (not isinstance(dept_id, str) or not dept_id.isdigit() or len(dept_id) != 4):
            raise ValueError(f"ID '{dept_id}' must be a four-digit string (e.g., '1000')")

    def dehydrate_created_by(self, department):
        """Format created_by for export."""
        return department.created_by.username if department.created_by else ''

    def dehydrate_updated_by(self, department):
        """Format updated_by for export."""
        return department.updated_by.username if department.updated_by else ''

    def save_instance(self, instance, new, row, **kwargs):
        """Override save_instance to use create_department for new instances."""
        if new:
            instance = Department.objects.create_department(
                name=row['name'],
                faculty=row['faculty'],
            )
            if 'is_deleted' in row:
                instance.is_deleted = row['is_deleted']
            instance.save()
        else:
            super().save_instance(instance, new, row, **kwargs)
        return instance

    def before_save_instance(self, instance, row, **kwargs):
        """Skip default save to avoid triggering model restriction."""
        pass


@admin.register(Department)
class DepartmentAdmin(ImportExportModelAdmin):
    """Admin configuration for Department model."""
    
    resource_class = DepartmentResource
    
    list_display = ('id', 'name', 'faculty', 'is_active', 'created_at', 'updated_at')
    list_filter = ('faculty', 'is_deleted', 'created_at')
    search_fields = ('id', 'name')
    readonly_fields = ('id', 'created_by', 'created_at', 'updated_by', 'updated_at')
    list_per_page = 25
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'faculty', 'is_deleted'),
        }),
        ('Audit Information', {
            'fields': ('created_by', 'created_at', 'updated_by', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset for admin list view."""
        qs = super().get_queryset(request)
        return qs.select_related('created_by', 'updated_by')

    def save_model(self, request, obj, form, change):
        """Override save to ensure proper ID generation for new departments."""
        if not change:
            new_obj = Department.objects.create_department(
                name=form.cleaned_data['name'],
                faculty=form.cleaned_data['faculty'],
            )
            obj.pk = new_obj.pk
        else:
            super().save_model(request, obj, form, change)

    def has_delete_permission(self, request, obj=None):
        """Allow soft deletion only via is_deleted field."""
        return False

    def delete_model(self, request, obj):
        """Override to enforce soft deletion."""
        obj.delete(soft=True)

    def generate_log_entries(self, result, request):
        """Override to use compatible logging without single_object."""
        for row_idx, row in enumerate(result):
            if row.import_type in ('new', 'update'):
                action_flag = ADDITION if row.import_type == 'new' else CHANGE
                LogEntry.objects.log_action(
                    user_id=request.user.pk,
                    content_type_id=ContentType.objects.get_for_model(self.model).pk,  # Correct method
                    object_id=row.object_id,
                    object_repr=row.object_repr,
                    action_flag=action_flag,
                    change_message=f"Imported via excel file (row {row_idx + 1})",
                )