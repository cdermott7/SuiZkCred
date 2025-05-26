'use client';

import { useState, useEffect } from 'react';

interface DemoStep {
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export default function DemoModeButton() {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const demoSteps: DemoStep[] = [
    {
      title: "Welcome to SuiZkCred Demo",
      description: "This guided tour will walk you through the main features of SuiZkCred. We'll show you how to create verifiable credentials that protect your privacy. Click 'Next' to continue.",
      target: "body",
      position: "top"
    },
    {
      title: "Create a Credential",
      description: "Click this button to create a new verifiable credential. You can create email verifications, KYC credentials, and more. You'll also be able to upload identity documents during the process.",
      target: "[data-demo-target='create-credential']",
      position: "bottom"
    },
    {
      title: "View Your Credentials",
      description: "In this section, you can view all your credentials, inspect their details, and revoke them if needed. Your private data stays private - only the proof is stored on-chain.",
      target: "[data-demo-target='credentials-list']",
      position: "left"
    },
    {
      title: "Learn About Zero-Knowledge",
      description: "Click here to discover how zero-knowledge proofs work. These cryptographic techniques let you prove facts about your identity without revealing any private information.",
      target: "[data-demo-target='zk-explainer']",
      position: "bottom"
    }
  ];
  
  // Add an effect to handle the escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDemoActive) {
        endDemo();
      }
    };
    
    // Add the event listener when the demo is active
    if (isDemoActive) {
      window.addEventListener('keydown', handleEscapeKey);
    }
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDemoActive]);
  
  const startDemo = () => {
    setIsDemoActive(true);
    setCurrentStep(0);
    
    // Add a highlight class to the body to dim the background
    document.body.classList.add('demo-mode-active');
  };
  
  const endDemo = () => {
    setIsDemoActive(false);
    document.body.classList.remove('demo-mode-active');
  };
  
  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endDemo();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const positionTooltip = (position: string, rect?: DOMRect) => {
    if (!rect) return {};
    
    // Ensure tooltip is visible within viewport
    const safetyMargin = 20; // Pixels from viewport edge
    const tooltipWidth = 320; // Width of the tooltip
    const tooltipHeight = 150; // Approximate height of tooltip
    
    switch (position) {
      case 'top': {
        // Place above the element
        const bottom = window.innerHeight - rect.top + 10;
        // Check if tooltip would go above viewport
        if (rect.top < tooltipHeight + safetyMargin) {
          // Switch to bottom if not enough space on top
          return {
            top: `${rect.bottom + 10}px`,
            left: `${Math.min(Math.max(tooltipWidth/2, rect.left + rect.width/2), window.innerWidth - tooltipWidth/2)}px`,
            transform: 'translateX(-50%)'
          };
        }
        return {
          bottom: `${bottom}px`,
          left: `${Math.min(Math.max(tooltipWidth/2, rect.left + rect.width/2), window.innerWidth - tooltipWidth/2)}px`,
          transform: 'translateX(-50%)'
        };
      }
      case 'bottom': {
        // Place below the element
        const proposedTop = rect.bottom + 10;
        // Check if tooltip would go below viewport
        if (proposedTop + tooltipHeight > window.innerHeight - safetyMargin) {
          // Switch to top if not enough space at bottom
          return {
            bottom: `${window.innerHeight - rect.top + 10}px`,
            left: `${Math.min(Math.max(tooltipWidth/2, rect.left + rect.width/2), window.innerWidth - tooltipWidth/2)}px`,
            transform: 'translateX(-50%)'
          };
        }
        return {
          top: `${proposedTop}px`,
          left: `${Math.min(Math.max(tooltipWidth/2, rect.left + rect.width/2), window.innerWidth - tooltipWidth/2)}px`,
          transform: 'translateX(-50%)'
        };
      }
      case 'left': {
        // Place to the left of the element
        if (rect.left < tooltipWidth + safetyMargin) {
          // Switch to right if not enough space on left
          return {
            top: `${rect.top + rect.height/2}px`,
            left: `${rect.right + 10}px`,
            transform: 'translateY(-50%)'
          };
        }
        return {
          top: `${rect.top + rect.height/2}px`,
          right: `${window.innerWidth - rect.left + 10}px`,
          transform: 'translateY(-50%)'
        };
      }
      case 'right': {
        // Place to the right of the element
        if (rect.right + tooltipWidth + safetyMargin > window.innerWidth) {
          // Switch to left if not enough space on right
          return {
            top: `${rect.top + rect.height/2}px`,
            right: `${window.innerWidth - rect.left + 10}px`,
            transform: 'translateY(-50%)'
          };
        }
        return {
          top: `${rect.top + rect.height/2}px`,
          left: `${rect.right + 10}px`,
          transform: 'translateY(-50%)'
        };
      }
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };
  
  // Get the position of the current target element
  const getCurrentTargetRect = () => {
    if (!isDemoActive) return null;
    
    const currentTarget = demoSteps[currentStep].target;
    if (currentTarget === 'body') {
      return new DOMRect(
        window.innerWidth / 2 - 150,
        window.innerHeight / 2 - 100,
        300,
        200
      );
    }
    
    const element = document.querySelector(currentTarget);
    return element?.getBoundingClientRect();
  };
  
  const targetRect = getCurrentTargetRect();
  const tooltipStyle = targetRect 
    ? positionTooltip(demoSteps[currentStep].position, targetRect) 
    : {};
  
  // Only show the button in development mode  
  if (process.env.NODE_ENV !== 'development' && !isDemoActive) {
    return null;
  }
  
  return (
    <>
      {/* Demo Mode Button */}
      {!isDemoActive && (
        <button
          onClick={startDemo}
          className="fixed bottom-4 right-4 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-colors z-50"
          title="Start Demo Mode"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      )}
      
      {/* Demo Mode Overlay */}
      {isDemoActive && (
        <>
          {/* Overlay to dim the background and prevent clicks */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={(e) => e.stopPropagation()} // Prevent clicks from reaching elements behind the overlay
          ></div>
          
          {/* Tooltip */}
          <div 
            className="fixed bg-white rounded-lg shadow-xl p-5 z-50 w-80 max-w-[90vw]"
            style={{
              ...tooltipStyle,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(79, 70, 229, 0.3)'
            }}
          >
            <h3 className="text-lg font-bold text-indigo-800 mb-1">{demoSteps[currentStep].title}</h3>
            <p className="text-gray-600 mb-4">{demoSteps[currentStep].description}</p>
            
            <div className="mt-6 space-y-3">
              <div className="text-xs text-gray-500 text-center mb-1">
                Step {currentStep + 1} of {demoSteps.length}
              </div>
              
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-300 ease-out" 
                  style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between gap-2 pt-2">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors flex-1"
                >
                  {currentStep === 0 ? 'Exit' : 'Back'}
                </button>
                
                <button
                  onClick={nextStep}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex-1 flex justify-center items-center"
                >
                  {currentStep < demoSteps.length - 1 ? (
                    <>
                      Next
                      <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </>
                  ) : (
                    'Finish'
                  )}
                </button>
              </div>
              
              {currentStep === 0 && (
                <div className="text-xs text-center text-gray-500 pt-2">
                  Press ESC at any time to exit the tutorial
                </div>
              )}
            </div>
          </div>
          
          {/* Highlight for the target element */}
          {targetRect && demoSteps[currentStep].target !== 'body' && (
            <div
              className="fixed border-2 border-indigo-500 rounded-lg z-50 pointer-events-none"
              style={{
                top: `${targetRect.top - 4}px`,
                left: `${targetRect.left - 4}px`,
                width: `${targetRect.width + 8}px`,
                height: `${targetRect.height + 8}px`,
                // Remove the boxShadow that was causing a full-screen black overlay
                // Add a more visible highlight effect instead
                backgroundColor: 'rgba(79, 70, 229, 0.1)'
              }}
            ></div>
          )}
        </>
      )}
    </>
  );
}