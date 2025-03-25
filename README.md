#   Authentication Logic
    The authentication logic spans settings.py, authentication.py, views.py, serializers.py, 
    and urls.py. Below is a comprehensive review based on the refactored versions:

#   Components:
    Settings (settings.py):
        JWT Configuration: SIMPLE_JWT defines token lifetimes (15 min access, 1 day refresh), 
        rotation, and blacklisting, stored in access_token and refresh_token cookies.

    Security: Cookies are HTTP-only, secure in production (not DEBUG), and use Strict SameSite policy.

    REST Framework: Uses CookieJWTAuthentication as the default authentication class.

#   Authentication (authentication.py):

    Logic: Checks for tokens in cookies first, with an optional header fallback. Validates tokens and ensures the user is active.

    Strengths: Robust error handling, logging, and integration with rest_framework_simplejwt.

#   Views (views.py):
    Register/Login: Issues tokens in cookies using _set_tokens_in_cookies.
    Logout/Change Password: Blacklists refresh tokens and clears cookies.
    Token Refresh: Rotates refresh tokens if configured and updates cookies.
    Profile: Requires authentication via IsAuthenticated.

#   Serializers (serializers.py):
    Validation: Enforces email uniqueness, password complexity, and read-only fields.
    User Creation: Integrates with CustomUserManager for normalized field creation.

#   URLs (urls.py):
    Endpoints: Covers registration, login, logout, profile, password change, and token refresh under the auth/ prefix.

#   Flow:
*   User Registration/Login:
        User submits data → Serializer validates → Tokens issued in cookies → Response with user data.
*   Authenticated Requests:
        CookieJWTAuthentication extracts token from access_token cookie → Validates → Sets request.user.
*   Token Refresh:
        refresh_token cookie used → New access token issued → Optional refresh token rotation.
*   Logout/Password Change:
        Refresh token blacklisted → Cookies cleared.

    Strengths:
        Security: HTTP-only cookies prevent XSS; Strict SameSite mitigates CSRF; token blacklisting enhances logout safety.
        Scalability: Stateless JWT with cookie storage integrates well with Next.js frontend.
        Consistency: Refactored files use settings.SIMPLE_JWT keys and lifetimes uniformly.

    Weaknesses and Suggestions:
*   CSRF Protection:
        Issue: While SameSite=Strict helps, authenticated POST requests (e.g., profile update) might still need CSRF tokens since Django’s CsrfViewMiddleware is active.
    Suggestion: Ensure frontend sends X-CSRFToken header for POST requests or disable CsrfViewMiddleware if relying solely on JWT.
*   Refresh Token Rotation:
    Issue: Rotation is optional (ROTATE_REFRESH_TOKENS=True), but the frontend must handle new refresh tokens.
    Suggestion: Document this behavior for Next.js developers to update cookies client-side if needed.
*   Token Lifetime Hardcoding:
    Issue: views.py uses hardcoded max_age (15 min, 7 days) instead of fully relying on SIMPLE_JWT settings.
    Fix: Already addressed in refactored views.py by using total_seconds().
*   Header Fallback:
    Issue: ALLOW_HEADER_AUTH is configurable but not used elsewhere, potentially confusing.
    Suggestion: Either remove it or document its purpose (e.g., for testing) in settings.py.
*   Email Verification:
    Issue: is_email_verified exists but isn’t enforced in login or profile views.
    Suggestion: Add a check in LoginView or CookieJWTAuthentication to reject unverified users if intended.
*   Error Handling:
    Strength: Good logging and specific error codes.
    Suggestion: Consider custom exception responses in university.utils.custom_exception_handler (referenced in settings.py) for consistent API error formatting.

#   Final Comments:
    The authentication system is well-designed for a Django-Next.js setup, leveraging JWT in HTTP-only cookies for security and statelessness. The refactored code improves maintainability and aligns with Django best practices. Addressing the above suggestions (especially CSRF and email verification) would make it more robust. If you plan to scale, consider adding rate limiting (already in REST_FRAMEWORK) and session timeout handling on the frontend.

------------------------------------------------------------------------

# NextJS Frontend

    The refactored code will handle token refresh, automatic inclusion of cookies in requests, logout functionality, and proper error handling, while adhering to best practices. I'll use the existing libraries (Axios, Zustand, react-hot-toast, react-hook-form) and ensure compatibility with Tailwind CSS in the src folder structure. Since you're not using TypeScript, I'll stick to JavaScript.

#   Alignment with Backend:
*   HTTP-only Cookies: Tokens are stored in HTTP-only cookies by the backend (access_token, refresh_token)  and sent automatically with withCredentials: true.
*   Token Refresh: authClient.js handles access token expiration by calling /auth/token/refresh/. New refresh tokens (if rotated) are updated in cookies automatically by the backend.
*   Logout: Calls /auth/logout/ to blacklist the refresh token and clear cookies.
*   Authenticated Requests: apiClient includes cookies in every request, validated by CookieJWTAuthentication on the backend.
*   Error Handling: Frontend logs errors and displays them via react-hot-toast, aligning with backend’s JSON error responses.

Additional Notes:
Dependencies: Assumes src/lib/utils/errorHandler.js exists or can be removed if not needed. I’ve simplified error handling to use raw Axios errors.
Missing Files: You’ll need to create pages (/login, /profile) and forms using react-hook-form and Tailwind CSS. Let me know if you’d like examples!
CSRF: Since backend uses CsrfViewMiddleware and SameSite=Strict, no CSRF token is needed for these endpoints, but ensure this aligns with your security requirements.
Suggestions:
Protect Routes: Use checkAuth in a higher-order component or middleware to protect authenticated routes.
Form Validation: Integrate react-hook-form in login/register pages for client-side validation.
Error Formatting: Consider a utility to format Axios errors consistently (e.g., error.response?.data?.error).

DynamicForm with react-hook-form: For better form management, integrate react-hook-form:

Development Debugging: Current console logs are sufficient for development. If you later need structured error handling, reintroduce errorHandler.js.

# Current Authentication Flow 
Based on setup:

# Backend: 
    Uses Django with DRF and SimpleJWT (assumed) for HTTP-only cookie-based JWT authentication.
*   /auth/login/: Sets access/refresh tokens in cookies.
*   /auth/logout/: Invalidates session (optionally blacklists refresh token).
*   /auth/password/change/: Updates password and invalidates tokens.
*   /auth/me/: Returns authenticated user data.

#   Frontend: 
    Next.js with Zustand (authStore.js) and Axios (authClient.js, authService.js).
*   Login: POST to /auth/login/, stores user data in Zustand, redirects to /profile.
*   Logout: POST to /auth/logout/, clears state, redirects to /login.
*   Profile Fetch: GET /auth/me/ to populate user data.
*   Password Change: POST to /auth/password/change/, followed by logout and redirect.
*   Token Refresh: Handled by authClient.js interceptor (though simplified in the latest version).

    The flow is functional, with HTTP-only cookies ensuring secure token storage and automatic credential inclusion via withCredentials: true.

========================================================================
# Academics App

The **Academics App** is a full-stack application built with Django (backend) and Next.js (frontend) to manage academic departments within a university system. It provides CRUD (Create, Read, Update, Delete) functionality for departments, with soft deletion support, audit tracking, and a user-friendly interface.

## Backend (Django)

### Overview
- **App Name**: `academics`
- **Purpose**: Manage academic departments with a RESTful API.
- **Location**: `academics/` directory in the Django project.

### Key Components
1. **Model**: `Department` (`academics/models.py`)
   - Fields:
     - `id`: Auto-generated 4-digit unique identifier (e.g., "1000").
     - `name`: Department name (max 50 chars, letters/spaces/& only).
     - `faculty`: Enum-based faculty affiliation (e.g., "I&C" for Information & Computing).
     - Audit fields: `created_by`, `created_at`, `updated_by`, `updated_at`.
     - `is_deleted`: Boolean flag for soft deletion (default: `False`).
   - Features:
     - Custom `DepartmentManager` for auto-incrementing IDs (1000–9999).
     - Soft deletion via overridden `delete()` method.
     - Unique constraint on active (`is_deleted=False`) `name` and `faculty` pairs.

2. **Serializer**: `DepartmentSerializer` (`academics/serializers.py`)
   - Handles serialization/deserialization for CRUD operations.
   - Includes `FacultyChoiceSerializer` for faculty dropdown options.
   - Validates authenticated requests and uses the custom manager for creation.

3. **ViewSet**: `DepartmentViewSet` (`academics/views.py`)
   - Provides RESTful endpoints for department management.
   - Permissions: `AllowAny` for GET (list/retrieve), `IsAuthenticated` for POST/PUT/DELETE.
   - Filtering: Supports `faculty` and `is_deleted` query params.
   - Soft deletion: Sets `is_deleted=True` instead of hard delete.
   - Custom queryset: Staff see all departments; others see only active ones (`is_deleted=False`).

4. **URLs**: (`academics/urls.py`)
   - Endpoints:
     - `GET /academic/departments/`: List departments.
     - `GET /academic/departments/<id>/`: Retrieve a department.
     - `POST /academic/departments/`: Create a department (authenticated).
     - `PUT /academic/departments/<id>/`: Update a department (authenticated).
     - `DELETE /academic/departments/<id>/`: Soft-delete a department (authenticated).
     - `GET /academic/faculty-choices/`: List faculty options.

## Frontend (Next.js)

### Overview
- **Page**: `Departments` (`src/app/departments/page.js`)
- **Purpose**: Provide a UI to manage departments, integrating with the backend API.
- **Location**: `src/app/departments/` and supporting files in `src/`.

### Key Components
1. **Environment**: `.env.local`
   - Configures API endpoints (e.g., `NEXT_PUBLIC_ACADEMIC_DEPARTMENTS_PATH=/academic/departments/`).
   - Defines base URL (`NEXT_PUBLIC_API_URL=http://localhost:8000`).

2. **API Service**: `departmentService.js` (`src/lib/api/`)
   - Handles API calls for CRUD operations and faculty choices using `apiClient`.
   - Methods: `getDepartments`, `getDepartment`, `createDepartment`, `updateDepartment`, `deleteDepartment`, `getFacultyChoices`.

3. **State Management**: `departmentStore.js` (`src/stores/`)
   - Uses Zustand to manage department state (`departments`, `facultyChoices`, `isLoading`, `error`).
   - Actions: Fetch, create, update, and soft-delete departments, with toast notifications.

4. **Components**:
   - **DynamicForm** (`src/components/common/DynamicForm.js`):
     - Reusable form with support for `text`, `textarea`, `file`, and `select` inputs.
     - Uses `react-hook-form` for validation and state management.
     - Pre-populates data for editing and sanitizes inputs.
   - **GenericTable** (`src/components/common/GenericTable.js`):
     - Reusable table with sorting, searching, and action buttons (Edit, Delete).
     - Displays department data with clickable names for details.

5. **Departments Page** (`src/app/departments/page.js`):
   - Features:
     - Displays a table of active departments (`is_deleted=False`).
     - Form for creating/updating departments with faculty dropdown.
     - Soft-delete confirmation via toast with "Yes, Delete" and "Cancel" options.
     - Department details in a toast popup.
   - Integration:
     - Fetches departments and faculty choices on mount.
     - Filters out soft-deleted departments from the UI.

## Functionality
- **Create**: Add a new department with a unique name and faculty.
- **Read**: View all active departments (staff can filter by `is_deleted` via API).
- **Update**: Edit department name or faculty, preserving audit trail.
- **Delete**: Soft-delete departments (sets `is_deleted=True`), hidden from non-staff UI.

## Soft Deletion
- **Backend**: Marks departments as `is_deleted=True` instead of removing them.
- **Frontend**: Filters out soft-deleted departments from the table after deletion.

## Setup
1. **Backend**:
   - Install dependencies: `pip install -r requirements.txt`.
   - Run migrations: `python manage.py migrate`.
   - Start server: `python manage.py runserver`.
2. **Frontend**:
   - Install dependencies: `npm install`.
   - Configure `.env.local` with backend URL.
   - Run dev server: `npm run dev`.

## Notes
- **Authentication**: Required for create, update, and delete actions.
- **API Base Path**: `/academic/` (configured in `university/urls.py`).
- **Date**: Documentation reflects state as of March 25, 2025.

---

# DynamicForm Component

This `DynamicForm` component is a reusable form solution for Next.js applications, built with `react-hook-form` and Tailwind CSS. It supports various input types, including text, textarea, file uploads, and select dropdowns, with built-in sanitization and accessibility features.

## Features

-   **Dynamic Field Configuration:**
    -      Accepts an array of field configurations (`fields`) to render different input types dynamically.
    -      Supports `text`, `textarea`, `file`, and `select` input types.
    -      Allows setting labels, required status, placeholders, max lengths, and select options.
-   **Form State Management with `react-hook-form`:**
    -      Utilizes `react-hook-form` for efficient form state management and validation.
    -      Provides controlled inputs with automatic value tracking and validation.
    -      Handles form submission with sanitized data.
-   **Input Sanitization:**
    -      Automatically sanitizes text inputs and textareas by removing extra spaces and trimming leading/trailing spaces.
    -      Ensures data consistency and prevents unexpected input issues.
-   **Validation:**
    -      Supports required and max length validations based on field configurations.
    -      Displays validation error messages below each field.
    -   `onTouched` mode for validation.
-   **Server-Side Error Handling:**
    -      Accepts external errors (`errors`) from the server and displays them alongside client-side validation errors.
    -      Synchronizes server-side errors with form state using `useEffect`.
-   **Loading and Submission States:**
    -      Disables the form during submission or loading (`isLoading`, `isSubmitting`).
    -      Displays a "Submitting..." message on the submit button.
-   **Accessibility:**
    -      Includes accessibility attributes (e.g., `aria-label`, `aria-required`, `aria-describedby`, `aria-invalid`, `aria-busy`).
    -      Provides error message association with input fields.
    -   Focuses on the first error field after submission fails.
-   **Customizable UI with Tailwind CSS:**
    -      Styled with Tailwind CSS for consistent and responsive design.
    -      Provides a clean and modern form layout.
-   **Initial Values:**
    -   Supports `initialValues` prop to pre-populate the form.
-   **Extra Content:**
    -   Allows adding extra content below the form with the `extraContent` prop.

## Usage

```jsx
import { DynamicForm } from './components/common/DynamicForm';

const MyForm = ({ onSubmit, errors, isLoading }) => {
  const fields = [
    { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 50 },
    { name: 'email', label: 'Email', type: 'text', required: true },
    { name: 'message', label: 'Message', type: 'textarea', placeholder: 'Enter your message', maxLength: 500 },
    { name: 'file', label: 'Upload File', type: 'file', accept: '.pdf,.doc' },
    { name: 'category', label: 'Category', type: 'select', options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ], required: true },
  ];

  const handleSubmit = async (data) => {
    await onSubmit(data);
  };

  return (
    <DynamicForm
      fields={fields}
      onSubmit={handleSubmit}
      buttonText="Submit Form"
      errors={errors}
      isLoading={isLoading}
      initialValues={{ name: 'John Doe', email: '[email address removed]' }}
    />
  );
};

export default MyForm;