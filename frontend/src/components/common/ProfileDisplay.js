// src/components/common/ProfileDisplay.js
'use client';
/**
 * Component to display user profile information with enhanced styling.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProfileDisplay({ user }) {
  const profilePictureUrl = user.profile_picture
    ? `${API_BASE_URL}${user.profile_picture.startsWith('/') ? '' : '/'}${user.profile_picture}`
    : '/default-profile.jpg';

  return (
    <div className="mb-8 text-center bg-white p-6 rounded-lg shadow-md">
      <img
        src={profilePictureUrl}
        alt={`${user.full_name || user.email}'s Profile Picture`}
        className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-2 border-gray-300 shadow-sm"
        onError={(e) => {
          e.target.src = '/default-profile.jpg';
          console.error('[ProfileDisplay] Failed to load profile picture:', profilePictureUrl);
        }}
      />
      <h1 className="text-2xl font-bold text-gray-800">{user.full_name || user.email}</h1>
      <p className="text-gray-600 text-sm">{user.email}</p>
      <p className="text-gray-600 text-sm">Role: {user.role || 'User'}</p>
      <p className="mt-2 text-gray-700 italic">"{user.bio || 'No bio provided'}"</p>
      <p className="text-gray-700">Mobile: {user.mobile_number || 'Not set'}</p>
      <p className="text-gray-500 text-xs mt-2">
        Joined: {new Date(user.date_joined).toLocaleDateString()}
      </p>
    </div>
  );
}