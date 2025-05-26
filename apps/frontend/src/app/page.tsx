'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isLoading, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      <div className="relative z-10 max-w-2xl text-center px-6">
        <div className="mb-8 inline-flex items-center p-2 rounded-full bg-indigo-100 text-indigo-800 shadow-sm">
          <Logo width={24} height={24} className="mr-2" showText={false} />
          <span className="text-sm font-medium">Built on Sui Blockchain</span>
        </div>
        
        <div className="relative">
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-4000"></div>
          
          <div className="flex items-center justify-center mb-4">
            <Logo width={120} height={80} className="mr-4" showText={true} />
            <h1 className="text-5xl font-bold text-gray-900 relative z-10">SuiZkCred</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 relative z-10">Private, Verifiable Credentials on Sui</p>
        </div>
        
        <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-800">Loading your experience...</p>
          <p className="mt-2 text-gray-500">Redirecting to the appropriate page</p>
        </div>
      </div>
      
      {/* Background decorations */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid-pattern)" />
          <defs>
            <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
        </svg>
      </div>
    </div>
  );
}