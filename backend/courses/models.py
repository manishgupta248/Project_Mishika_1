# courses/models.py
from django.db import models
from django.core.exceptions import ValidationError  # Correct import for ValidationError
from django_currentuser.db.models import CurrentUserField
from enum import Enum
from .validators import validate_pdf
from academics.models import Department

# === ENUM DEFINITIONS ===
class CourseCategory(Enum):
    """Enum for course category options."""
    COMPULSORY = "Compulsory"
    ELECTIVE = "Elective"

    @classmethod
    def choices(cls):
        return [(key.name, key.value) for key in cls]


class CourseType(Enum):
    """Enum for different types of courses."""
    DISSERTATION = "Dissertation"
    LABORATORY = "Laboratory"
    PRACTICAL = "Practical"
    PROJECT = "Project"
    THEORY = "Theory"
    THEORY_AND_PRACTICAL = "Theory and Practical"
    TUTORIAL = "Tutorial"

    @classmethod
    def choices(cls):
        return [(key.name, key.value) for key in cls]


class CBCSCategory(Enum):
    """Enum for CBCS (Choice Based Credit System) categories."""
    MAJOR = "Major"
    MINOR = "Minor"
    CORE = "Core"
    DSE = "Discipline Specific Elective"
    GE = "Generic Elective"
    OE = "Open Elective"
    VAC = "Value Added Course"
    AECC = "Ability Enhancement Compulsory Course"
    SEC = "Skill Enhancement Course"
    MDC = "Multi-Disciplinary Course"
    IDC = "Inter-Disciplinary Course"

    @classmethod
    def choices(cls):
        return [(key.name, key.value) for key in cls]


# === ABSTRACT BASE MODEL ===
class BaseModel(models.Model):
    """Abstract base model providing common fields for auditing."""
    created_by = CurrentUserField(
        null=True,
        related_name='%(class)s_created',
        editable=False,
        help_text="User who created this record (auto-filled)."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        editable=False,
        help_text="Timestamp when the record was created."
    )
    updated_by = CurrentUserField(
        null=True,
        related_name='%(class)s_updated',
        editable=False,
        help_text="User who last updated this record (auto-filled)."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        editable=False,
        help_text="Timestamp when the record was last updated."
    )
    is_deleted = models.BooleanField(
        default=False,
        help_text="Flag for soft deletion."
    )

    class Meta:
        abstract = True

    @property
    def is_active(self):
        return not self.is_deleted


# === COURSE MODEL ===
class Course(BaseModel):
    """Represents an academic course with unique identification and metadata."""
    course_code = models.CharField(
        max_length=10,
        unique=True,
        primary_key=True,
        help_text="Unique identifier for the course (e.g., CS101).",
        db_index=True
    )
    course_name = models.CharField(
        max_length=255,
        help_text="Full name of the course (e.g., Introduction to Programming)."
    )
    course_category = models.CharField(
        max_length=10,
        choices=CourseCategory.choices(),
        default=CourseCategory.COMPULSORY.name,
        help_text="Whether the course is compulsory or elective."
    )
    type = models.CharField(
        max_length=20,
        choices=CourseType.choices(),
        default=CourseType.THEORY.name,
        help_text="Type of course delivery."
    )
    cbcs_category = models.CharField(
        max_length=25,
        choices=CBCSCategory.choices(),
        default=CBCSCategory.CORE.name,
        help_text="CBCS classification of the course."
    )
    maximum_credit = models.PositiveSmallIntegerField(
        choices=[(i, str(i)) for i in range(21)],
        default=0,
        help_text="Maximum credit points (0-20)."
    )
    discipline = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='courses',
        help_text="Department responsible for the course."
    )

    class Meta:
        ordering = ['course_code']
        indexes = [
            models.Index(fields=['course_code']),
            models.Index(fields=['discipline']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(maximum_credit__gte=0) & models.Q(maximum_credit__lte=20),
                name='credit_range_check'
            )
        ]

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"

    # def clean(self):
    #     """Custom validation for the model."""
    #     if not self.course_code.isalnum():
    #         raise ValidationError("Course code must be alphanumeric.")  # Corrected import


# === SYLLABUS MODEL ===
class Syllabus(BaseModel):
    """Represents a syllabus version for a course."""
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        to_field='course_code',
        related_name='syllabi',
        help_text="Associated course for this syllabus."
    )
    course_name = models.CharField(
        max_length=255,
        editable=False,
        help_text="Automatically populated from the associated course."
    )
    syllabus_file = models.FileField(
        upload_to='syllabi/%Y/%m/%d/',
        validators=[validate_pdf],
        max_length=255,
        help_text="PDF file containing the syllabus."
    )
    version = models.CharField(
        max_length=10,
        default='1.0',
        help_text="Syllabus version number (e.g., 1.0, 2.1)."
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional notes about this syllabus version."
    )
    uploaded_by = CurrentUserField(
        related_name='uploaded_syllabi',
        editable=False,
        help_text="User who originally uploaded this syllabus (auto-filled)."
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        editable=False,
        help_text="Timestamp when the syllabus was uploaded."
    )

    class Meta:
        verbose_name_plural = 'Syllabi'
        ordering = ['course', '-version']
        unique_together = ('course', 'version')
        indexes = [
            models.Index(fields=['course', 'version']),
            models.Index(fields=['uploaded_at']),
        ]

    def __str__(self):
        return f"{self.course.course_code} - v{self.version}"

    def save(self, *args, **kwargs):
        self.course_name = self.course.course_name
        super().save(*args, **kwargs)

    def clean(self):
        """Custom validation for syllabus."""
        import re
        if not re.match(r'^\d+\.\d+$', self.version):
            raise ValidationError("Version must be in format 'X.Y' (e.g., 1.0).")  # Corrected import