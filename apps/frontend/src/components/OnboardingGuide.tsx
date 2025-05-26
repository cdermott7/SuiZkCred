'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Step {
  title: string;
  description: string;
  icon: string;
}

export default function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  // Check if user has seen the guide before
  useEffect(() => {
    const guideSeen = localStorage.getItem('suiZkCred_guideSeen');
    if (!guideSeen) {
      // Show guide automatically on first visit
      setIsOpen(true);
    } else {
      setHasSeenGuide(true);
    }
  }, []);

  // Mark guide as seen when closed
  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('suiZkCred_guideSeen', 'true');
    setHasSeenGuide(true);
  };

  const steps: Step[] = [
    {
      title: "Welcome to SuiZkCred",
      description: "SuiZkCred lets you create and manage zero-knowledge credentials on the Sui blockchain. These credentials prove facts about you without revealing sensitive information.",
      icon: "👋"
    },
    {
      title: "Connect Your Wallet",
      description: "First, connect your Sui wallet to interact with the blockchain. We support Sui Wallet, Ethos Wallet, and others that are compatible with Sui.",
      icon: "🔗"
    },
    {
      title: "Create a Credential",
      description: "Generate a verifiable credential like email verification, KYC status, or membership. The credential is stored on-chain but keeps your personal data private.",
      icon: "🔐"
    },
    {
      title: "Use Your Credentials",
      description: "Your credentials can be verified by third parties without revealing your personal data. Perfect for compliant DeFi, DAOs, and other applications that need verification.",
      icon: "✨"
    },
    {
      title: "Privacy Through Zero-Knowledge",
      description: "SuiZkCred uses zero-knowledge proofs to keep your data private while still enabling verifiable claims. Your personal information never leaves your device.",
      icon: "🛡️"
    }
  ];

  if (!isOpen && hasSeenGuide) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50"
        aria-label="Show Guide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-indigo-50">
          <h2 className="text-xl font-bold text-indigo-900">Getting Started</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 flex items-center justify-center bg-indigo-100 text-5xl rounded-full">
                {steps[currentStep].icon}
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-center mb-4 text-gray-900">
              {steps[currentStep].title}
            </h3>
            
            <p className="text-gray-600 text-center mb-8 px-4">
              {steps[currentStep].description}
            </p>
            
            {/* Step indicators */}
            <div className="flex justify-center mb-6">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`mx-1 w-3 h-3 rounded-full ${
                    currentStep === index ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
          >
            Previous
          </button>
          
          <button
            onClick={() => {
              if (currentStep < steps.length - 1) {
                setCurrentStep(currentStep + 1);
              } else {
                handleClose();
              }
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
          >
            {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}