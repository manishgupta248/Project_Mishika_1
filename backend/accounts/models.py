# accounts/models.py
"""
Custom user model and manager for the University project.
Extends Django's AbstractUser with email-based authentication and additional fields.
"""

import os
from django.conf import settings
from django.contrib.auth.models import AbstractUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models, IntegrityError
from django.utils import timezone
import bleach

class CustomUserManager(BaseUserManager):
    """Custom manager for handling user creation with email-based authentication."""

    def _normalize_fields(self, email, first_name, last_name):
        """
        Normalize email and name fields for consistency.

        Args:
            email (str): User's email address.
            first_name (str): User's first name.
            last_name (str): User's last name.

        Returns:
            tuple: Normalized (email, first_name, last_name).

        Raises:
            ValueError: If any required field is missing or invalid.
        """
        if not email:
            raise ValueError("A valid email address is required.")
        if not first_name:
            raise ValueError("First name is required.")
        if not last_name:
            raise ValueError("Last name is required.")

        return (
            self.normalize_email(email).strip().lower(),
            first_name.strip().title(),
            last_name.strip().title(),
        )

    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
        """
        Create and save a regular user with the given details.

        Args:
            email (str): User's email address.
            first_name (str): User's first name.
            last_name (str): User's last name.
            password (str, optional): User's password.
            **extra_fields: Additional fields for the user model.

        Returns:
            CustomUser: The created user instance.

        Raises:
            ValidationError: If creation fails due to validation or database issues.
        """
        email, first_name, last_name = self._normalize_fields(email, first_name, last_name)
        user = self.model(email=email, first_name=first_name, last_name=last_name, **extra_fields)

        user.set_password(password)
        try:
            user.full_clean()  # Run model validation
            user.save(using=self._db)
            return user
        except IntegrityError as e:
            if "email" in str(e).lower():
                raise ValidationError(f"Email '{email}' is already in use.")
            raise ValidationError(f"Database error during user creation: {str(e)}")
        except ValidationError:
            raise
        except Exception as e:
            raise ValidationError(f"Unexpected error during user creation: {str(e)}")

    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        """
        Create and save a superuser with elevated privileges.

        Args:
            email (str): Superuser's email address.
            first_name (str): Superuser's first name.
            last_name (str): Superuser's last name.
            password (str, optional): Superuser's password.
            **extra_fields: Additional fields for the user model.

        Returns:
            CustomUser: The created superuser instance.

        Raises:
            ValueError: If superuser flags are not set correctly.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_email_verified', True)  # Auto-verify superusers

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, first_name, last_name, password, **extra_fields)


def user_profile_pic_path(instance, filename):
    """
    Generate a unique upload path for user profile pictures.

    Args:
        instance (CustomUser): The user instance.
        filename (str): Original filename of the uploaded image.

    Returns:
        str: Path to store the profile picture (e.g., 'profile_pics/user@example.com_YYYYMMDD_HHMMSS.ext').

    Raises:
        ValueError: If email is missing.
    """
    if not instance.email:
        raise ValueError("Email is required to generate profile picture path.")

    ext = filename.rsplit('.', 1)[-1].lower()  # Extract file extension safely
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    return os.path.join('profile_pics', f"{instance.email}_{timestamp}.{ext}")


def validate_image_size(value):
    """
    Validate that the uploaded image size does not exceed 5MB.

    Args:
        value (File): The uploaded image file.

    Raises:
        ValidationError: If the file size exceeds 5MB.
    """
    MAX_SIZE = 5 * 1024 * 1024  # 5MB in bytes
    if value.size > MAX_SIZE:
        size_mb = value.size / (1024 * 1024)
        raise ValidationError(f"Image size must be under 5MB. Current size: {size_mb:.2f}MB")


def validate_email_domain(value):
    """
    Restrict email domains to prevent use of disposable or blocked domains.

    Args:
        value (str): Email address to validate.

    Raises:
        ValidationError: If the domain is in the blocked list.
    """
    blocked_domains = getattr(settings, 'BLOCKED_EMAIL_DOMAINS', ['example.com', 'test.com'])
    domain = value.split('@')[-1].lower()
    if domain in blocked_domains:
        raise ValidationError(f"Emails from '{domain}' are not permitted.")


class CustomUser(AbstractUser, PermissionsMixin):
    """
    Custom user model replacing username with email as the primary identifier.
    Includes additional fields like role, profile picture, and mobile number.
    """

    # Remove username field as email is the primary identifier
    username = None

    # Core Fields
    email = models.EmailField(
        unique=True,
        max_length=255,
        blank=False,
        null=False,
        db_index=True,
        verbose_name='Email Address',
        help_text='Enter a valid email address.',
        validators=[validate_email_domain],
        error_messages={'unique': 'This email is already registered.'},
    )

    first_name = models.CharField(
        max_length=50,
        blank=False,
        null=False,
        verbose_name='First Name',
        help_text='Enter your first name.',
    )

    last_name = models.CharField(
        max_length=50,
        blank=False,
        null=False,
        verbose_name='Last Name',
        help_text='Enter your last name.',
    )

    mobile_number = models.CharField(
        max_length=13,
        validators=[
            RegexValidator(
                regex=r'^\+91[6-9]\d{9}$',
                message='Enter a valid Indian mobile number (e.g., +919876543210).',
            )
        ],
        blank=True,
        null=True,
        unique=True,
        verbose_name='Mobile Number',
        help_text='Enter a 10-digit Indian mobile number with +91 prefix (e.g., +919876543210).',
    )

    profile_picture = models.ImageField(
        upload_to=user_profile_pic_path,
        blank=True,
        null=True,
        default='profile_pics/default.jpg',
        verbose_name='Profile Picture',
        validators=[validate_image_size],
        help_text='Upload a profile picture (max 5MB).',
    )

    bio = models.TextField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name='Biography',
        help_text='A short bio about yourself (max 500 characters).',
    )

    # Status Fields
    is_email_verified = models.BooleanField(
        default=False,
        verbose_name='Email Verified',
        help_text='Indicates if the email has been verified.',
    )

    date_joined = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date Joined',
        help_text='Timestamp of user creation.',
    )

    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name='Last Updated',
        help_text='Timestamp of last user update.',
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Active',
        help_text='Designates whether this user account is active.',
    )

    # Role Definition
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student',
        verbose_name='Role',
        help_text='User role within the system.',
    )

    # Manager and Authentication Configuration
    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        """Metadata for the CustomUser model."""
        ordering = ['email']
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email'], name='email_idx'),
            models.Index(fields=['first_name', 'last_name'], name='name_idx'),
            models.Index(fields=['mobile_number'], name='mobile_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['mobile_number'],
                condition=models.Q(mobile_number__isnull=False),
                name='unique_mobile_number_if_not_null',
            ),
        ]

    def __str__(self):
        """Return string representation of the user."""
        return self.email

    @property
    def full_name(self):
        """Return the user's full name as a property."""
        return f"{self.first_name} {self.last_name}".strip()

    def clean(self):
        """Sanitize bio field and run parent validation."""
        if self.bio:
            self.bio = bleach.clean(self.bio, tags=['p', 'strong', 'em'], strip=True)
        super().clean()

    def save(self, *args, **kwargs):
        """
        Override save method to normalize fields and manage profile pictures.

        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.
        """
        # Normalize fields
        self.email = self.email.strip().lower()
        self.first_name = self.first_name.strip().title()
        self.last_name = self.last_name.strip().title()
        if self.bio:
            self.bio = self.bio.strip()

        # Handle profile picture updates
        if self.pk and 'profile_picture' in self.get_deferred_fields():
            try:
                old_user = CustomUser.objects.get(pk=self.pk)
                if (
                    old_user.profile_picture
                    and old_user.profile_picture != self.profile_picture
                    and old_user.profile_picture != 'profile_pics/default.jpg'
                    and os.path.isfile(old_user.profile_picture.path)
                ):
                    os.remove(old_user.profile_picture.path)
            except CustomUser.DoesNotExist:
                pass  # Handle case where old instance is missing gracefully

        # Validate default profile picture existence
        default_path = os.path.join(settings.MEDIA_ROOT, 'profile_pics', 'default.jpg')
        if not self.profile_picture and not os.path.exists(default_path):
            raise ValidationError("Default profile picture 'profile_pics/default.jpg' is missing.")

        super().save(*args, **kwargs)