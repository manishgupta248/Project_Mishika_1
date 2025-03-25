# validators.py
from django.core.exceptions import ValidationError
import os

def validate_pdf(value, max_size_mb=5):
    """
    Validate that a file is a PDF and within size limit.
    
    Args:
        value: File object to validate
        max_size_mb: Maximum file size in megabytes (default: 5)
    """
    ext = os.path.splitext(value.name)[1].lower()
    if ext != '.pdf':
        raise ValidationError('Only PDF files are allowed.')
    max_size_bytes = max_size_mb * 1024 * 1024
    if value.size > max_size_bytes:
        raise ValidationError(f'File size must be under {max_size_mb}MB.')