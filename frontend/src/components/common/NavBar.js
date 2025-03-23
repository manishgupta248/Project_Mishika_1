// src/components/common/NavBar.js
'use client';
/**
 * Navigation bar component with responsive design and authentication integration.
 * Uses Tailwind CSS and integrates with authStore for user state.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/stores/authStore';
import toast from 'react-hot-toast';
import { Loading } from './Loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function NavBar() {
  const { user, isAuthenticated, logout, isLoading } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Handle logout with error logging
  const handleLogout = async () => {
    try {
      await logout(router);
      setDropdownOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.error('[NavBar] Logout error:', error.message);
      toast.error(error.response?.data?.error || 'Logout failed');
    }
  };

  const toggleDropdown = useCallback(() => setDropdownOpen((prev) => !prev), []);
  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);

  // Close dropdown/menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <nav className="bg-[#800000] text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="text-2xl font-bold tracking-tight">
          <Link href="/" className="hover:text-gray-200 transition duration-200">
            Akriti
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="py-2 px-3 hover:bg-[#660000] rounded-md transition duration-200"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="py-2 px-3 hover:bg-[#660000] rounded-md transition duration-200"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="py-2 px-3 hover:bg-[#660000] rounded-md transition duration-200"
          >
            Contact
          </Link>
        </div>

        {/* User/Auth Section */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1 hover:bg-[#660000] transition duration-200"
                aria-label={`User menu for ${user.full_name || user.email}`}
              >
                <span className="text-sm md:text-base hidden md:inline">
                  Welcome, {user.first_name} {user.last_name}
                </span>
                {user.profile_picture ? (
                  <img
                    src={`${API_BASE_URL}${user.profile_picture}`}
                    alt={`${user.full_name || user.email}'s profile`}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-300 shadow-sm"
                    onError={(e) => (e.target.src = '/default-profile.jpg')}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center border-2 border-blue-300 shadow-sm">
                    <span className="text-lg font-semibold">{user.first_name[0]}</span>
                  </div>
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg transition-all duration-200 ease-in-out">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 hover:bg-gray-100 rounded-t-lg"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/login"
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 rounded-md transition duration-200 shadow-sm"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 rounded-md transition duration-200 shadow-sm"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMenu}
            className="md:hidden focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden mt-4 space-y-2 bg-[#660000] rounded-lg p-4 transition-all duration-300 ease-in-out"
          ref={menuRef}
        >
          <Link
            href="/"
            className="block px-4 py-2 hover:bg-[#800000] rounded-md"
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/about"
            className="block px-4 py-2 hover:bg-[#800000] rounded-md"
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/contact"
            className="block px-4 py-2 hover:bg-[#800000] rounded-md"
            onClick={() => setMenuOpen(false)}
          >
            Contact
          </Link>
          {!isAuthenticated ? (
            <>
              <Link
                href="/login"
                className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
                onClick={() => setMenuOpen(false)}
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/profile"
                className="block px-4 py-2 hover:bg-[#800000] rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-[#800000] rounded-md"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}