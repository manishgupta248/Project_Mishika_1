from django.db import models, transaction
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django_currentuser.db.models import CurrentUserField
from enum import Enum

User = get_user_model()

class Faculty(Enum):
    """Enum representing faculties a department can belong to."""
    INFORMATION_COMPUTING = "I&C"
    ENGINEERING_TECHNOLOGY = "E&T"
    INTERDISCIPLINARY_RESEARCH = "I&R"
    LIFE_SCIENCES = "LS"
    LIBERAL_ARTS_MEDIA = "LAMS"
    MANAGEMENT_STUDIES = "MS"
    SCIENCES = "SC"
    CCSD = "CCSD"

    @classmethod
    def choices(cls):
        return [(member.value, member.name.replace("_", " ").title()) for member in cls]


class DepartmentManager(models.Manager):
    """Custom manager for Department model with auto-incremented IDs."""
    INITIAL_ID = 1000
    MAX_ID = 9999

    def create_department(self, name: str, faculty: str, **extra_fields) -> 'Department':
        with transaction.atomic():
            last_dept = self.filter(is_deleted=False).order_by('-id').first()
            next_id = self.INITIAL_ID if not last_dept else int(last_dept.id) + 1

            if next_id > self.MAX_ID:
                raise ValueError(f"Department ID cannot exceed {self.MAX_ID}")

            dept_id = f"{next_id:04d}"  # Cleaner string formatting
            return self.create(id=dept_id, name=name, faculty=faculty, **extra_fields)


class Department(models.Model):
    """Academic department model with unique ID, faculty affiliation, and audit fields."""
    
    # Fields
    id = models.CharField(
        max_length=4,
        primary_key=True,
        validators=[RegexValidator(r'^\d{4}$', "ID must be a four-digit number")],
        help_text="Unique four-digit ID (auto-generated)",
        editable=False,
    )
    
    name = models.CharField(
        max_length=50,
        validators=[RegexValidator(r'^[a-zA-Z\s&]+$', "Name must contain only letters, spaces, or '&'")],
        help_text="Department name (e.g., 'Computer Science')",
    )
    
    faculty = models.CharField(
        max_length=4,
        choices=Faculty.choices(),
        help_text="Faculty affiliation",
    )
    
    # Audit Fields
    created_by = CurrentUserField(
        related_name='created_departments',
        editable=False,
        help_text="User who created this department",
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        editable=False,
        help_text="Creation timestamp",
    )
    
    updated_by = CurrentUserField(
        on_update=True,
        related_name='updated_departments',
        editable=False,
        help_text="User who last updated this department",
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        editable=False,
        help_text="Last update timestamp",
    )
    
    is_deleted = models.BooleanField(
        default=False,
        help_text="Soft deletion flag",
    )

    # Manager
    objects = DepartmentManager()

    # Meta
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'faculty'],
                condition=models.Q(is_deleted=False),
                name='unique_active_name_faculty',
            )
        ]
        indexes = [
            models.Index(fields=['faculty']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['id']

    # Methods
    def clean(self) -> None:
        if self.pk and self.id != f"{int(self.id):04d}":
            raise ValidationError("ID must remain a four-digit padded string")
        super().clean()

    def save(self, *args, **kwargs) -> None:
        if not self.pk and not hasattr(self, '_id_set_by_manager'):
            raise ValueError("Use Department.objects.create_department() to create departments")
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.id} - {self.name} ({self.faculty})"

    @property
    def is_active(self) -> bool:
        return not self.is_deleted

    def delete(self, using=None, keep_parents=False, soft: bool = True) -> None:
        if soft:
            self.is_deleted = True
            self.save(using=using)
        else:
            super().delete(using=using, keep_parents=keep_parents)


# Signal
def department_pre_save(sender, instance, **kwargs) -> None:
    if not instance.pk:
        instance._id_set_by_manager = True

models.signals.pre_save.connect(department_pre_save, sender=Department)