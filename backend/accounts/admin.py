# accounts/admin.py
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from import_export import resources, fields
from import_export.admin import ImportExportModelAdmin
from .models import CustomUser

User = get_user_model()

class CustomUserResource(resources.ModelResource):
    """Resource class for CustomUser model for import/export."""

    role = fields.Field(attribute='role', column_name='role')

    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'first_name', 'last_name', 'mobile_number', 'role', 'is_email_verified', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_updated')
        export_order = ('id', 'email', 'first_name', 'last_name', 'mobile_number', 'role', 'is_email_verified', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_updated')
        import_id_fields = ('email',)

    def dehydrate_role(self, user):
        """Export role as the display name instead of the value."""
        return user.get_role_display()

    def before_import_row(self, row, **kwargs):
        """Validate and normalize role before importing."""
        if 'role' in row:
            value = str(row['role']).strip()
            choice_dict = {key: key for key, _ in CustomUser.ROLE_CHOICES}
            display_dict = {display.lower(): key for key, display in CustomUser.ROLE_CHOICES}
            if value in choice_dict:
                row['role'] = value
            elif value.lower() in display_dict:
                row['role'] = display_dict[value.lower()]
            else:
                raise ValueError(f"Invalid role value: {value}. Must be one of {list(choice_dict.keys())} or {list(display_dict.keys())}")

@admin.register(CustomUser)
class CustomUserAdmin(ImportExportModelAdmin, UserAdmin):
    """Admin class for CustomUser model."""
    resource_class = CustomUserResource
    list_display = ('email', 'first_name', 'last_name', 'mobile_number', 'role', 'is_email_verified', 'is_active', 'is_staff', 'is_superuser', 'date_joined', 'last_updated')
    list_filter = ('role', 'is_email_verified', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'first_name', 'last_name', 'mobile_number')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'mobile_number', 'profile_picture', 'bio')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Role', {'fields': ('role', 'is_email_verified')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password', 'password2', 'mobile_number', 'role', 'profile_picture', 'bio', 'is_email_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
    )
    readonly_fields = ('last_login', 'date_joined', 'last_updated')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.is_email_verified = False # ensure new users are not auto verified.
        super().save_model(request, obj, form, change)