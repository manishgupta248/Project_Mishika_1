// src/components/common/Sidebar.js
'use client';
/**
 * Sidebar navigation component with Tailwind styling.
 * Displays links for key sections of the application.
 */

import Link from 'next/link';

export default function Sidebar() {
  const navItems = [
    { href: '/', label: 'Dashboard' },
    { href: '/departments', label: 'Departments' },
    { href: '/courses', label: 'Courses' },
    { href: '/syllabi', label: 'Syllabi' },
  ];

  return (
    <aside className="w-64 bg-gray-50 p-4 shadow-lg h-screen sticky top-0 hidden lg:block">
      <h2 className="text-lg font-bold text-[#800000] mb-6 tracking-tight">JCBUST</h2>
      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block p-3 text-[#800000] hover:bg-gray-200 rounded-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:ring-offset-2"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}