'use client';

import { useState, useEffect } from 'react';

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only run this code on the client side
  useEffect(() => {
    setMounted(true);
    // Initialize dark mode based on local storage or system preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
      if (savedMode === 'true') {
        document.documentElement.classList.add('dark-mode');
      }
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark-mode');
      }
    }
  }, []);

  // Apply dark mode changes to document
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  };

  if (!mounted) return null; // Don't render anything on the server side

  return (
    <button
      onClick={toggleDarkMode}
      className="fixed bottom-4 left-4 z-50 p-3 rounded-full shadow-xl transition-all duration-300"
      style={{ 
        backgroundColor: darkMode ? '#121212' : '#fff',
        border: darkMode ? '3px solid #33ff33' : '2px solid #4f46e5',
        boxShadow: darkMode 
          ? '0 0 15px rgba(0, 255, 0, 0.7), 0 0 30px rgba(0, 255, 0, 0.4)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transform: 'scale(1.2)'
      }}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to Matrix mode'}
      title={darkMode ? 'Switch to light mode' : 'Switch to Matrix mode'}
    >
      {darkMode ? (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#33ff33">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <div className="relative">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#4f46e5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
            Matrix
          </span>
        </div>
      )}
    </button>
  );
}