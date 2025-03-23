# accounts/serializers.py
"""
Serializers for the accounts app, handling user data, registration, login, and password changes.
Aligned with CustomUser model and Django REST Framework Simple JWT settings.
"""

import re
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CustomUser

User = get_user_model()  # Use a more generic name for clarity

class UserSerializer(serializers.ModelSerializer):
    """Serializer for retrieving and updating CustomUser details."""
    full_name = serializers.ReadOnlyField(source='get_full_name')  # Explicitly map to property

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'full_name', 'mobile_number',
            'profile_picture', 'bio', 'role', 'is_email_verified',
            'date_joined', 'last_updated',
        ]
        read_only_fields = [
            'email', 'full_name', 'role', 'is_email_verified',
            'date_joined', 'last_updated',
        ]

    def validate(self, data):
        """
        Prevent updates to read-only fields.

        Args:
            data (dict): Data to validate.

        Returns:
            dict: Validated data.

        Raises:
            serializers.ValidationError: If read-only fields are included in update.
        """
        if self.instance and any(field in data for field in self.Meta.read_only_fields):
            raise serializers.ValidationError({
                'error': 'Cannot modify read-only fields.',
                'read_only_fields': self.Meta.read_only_fields,
            })
        return data


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for registering a new CustomUser."""
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        help_text='Password must be at least 8 characters with a number and special character.',
    )

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'password', 'mobile_number',
            'profile_picture', 'bio',
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_email(self, value):
        """
        Ensure email is unique and normalized.

        Args:
            value (str): Email to validate.

        Returns:
            str: Normalized email.

        Raises:
            serializers.ValidationError: If email is already in use.
        """
        email = value.lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("This email is already registered.")
        return email

    def validate_password(self, value):
        """
        Enforce password complexity requirements.

        Args:
            value (str): Password to validate.

        Returns:
            str: Validated password.

        Raises:
            serializers.ValidationError: If complexity rules are not met.
        """
        if not re.search(r'[0-9]', value) or not re.search(r'[!@#$%^&*]', value):
            raise serializers.ValidationError(
                "Password must include at least one number and one special character (!@#$%^&*)."
            )
        return value

    def create(self, validated_data):
        """
        Create a new user using the CustomUserManager.

        Args:
            validated_data (dict): Validated data for user creation.

        Returns:
            User: The created user instance.
        """
        return User.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing a user's password."""
    old_password = serializers.CharField(
        write_only=True,
        help_text='Current password for verification.',
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        help_text='New password (min 8 chars, with number and special character).',
    )

    def validate_old_password(self, value):
        """
        Verify the current password.

        Args:
            value (str): Old password to check.

        Returns:
            str: Validated old password.

        Raises:
            serializers.ValidationError: If old password is incorrect.
        """
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError("Incorrect current password.")
        return value

    def validate_new_password(self, value):
        """
        Enforce complexity for the new password.

        Args:
            value (str): New password to validate.

        Returns:
            str: Validated new password.

        Raises:
            serializers.ValidationError: If complexity rules are not met.
        """
        if not re.search(r'[0-9]', value) or not re.search(r'[!@#$%^&*]', value):
            raise serializers.ValidationError(
                "New password must include at least one number and one special character (!@#$%^&*)."
            )
        return value

    def validate(self, data):
        """
        Ensure new password differs from old.

        Args:
            data (dict): Data containing old and new passwords.

        Returns:
            dict: Validated data.

        Raises:
            serializers.ValidationError: If new password matches old.
        """
        if data['old_password'] == data['new_password']:
            raise serializers.ValidationError("New password must be different from the old password.")
        return data

    def update(self, instance, validated_data):
        """
        Update the user's password.

        Args:
            instance (User): User instance to update.
            validated_data (dict): Validated data with new password.

        Returns:
            User: Updated user instance.
        """
        instance.set_password(validated_data['new_password'])
        instance.save()
        return instance


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    email = serializers.EmailField(
        help_text='Email address used for login.',
    )
    password = serializers.CharField(
        write_only=True,
        help_text='Password for authentication.',
    )