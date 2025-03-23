// src/components/common/Footer.js
/**
 * Footer component for the application with Tailwind styling.
 */

export default function Footer() {
    return (
      <footer className="bg-[#800000] text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} Akriti. All rights reserved.</p>
      </footer>
    );
  }