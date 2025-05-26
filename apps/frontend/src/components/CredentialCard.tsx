'use client';

import { useState } from 'react';

interface CredentialCardProps {
  id: string;
  nullifier: string;
  isRevoked: boolean;
  metadata?: {
    name: string;
    issuer: string;
    expiration: string;
  };
  onInspect?: () => void;
  onRevoke?: () => void;
}

export default function CredentialCard({ 
  id, 
  nullifier, 
  isRevoked, 
  metadata,
  onInspect,
  onRevoke 
}: CredentialCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  
  // Format a long string for display
  const formatId = (id: string) => {
    if (!id || id.length <= 12) return id || '';
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Handle revocation with confirmation
  const handleRevoke = async () => {
    if (isRevoked || isRevoking || !onRevoke) return;
    
    // Ask for confirmation
    const confirmed = window.confirm(
      'Are you sure you want to revoke this credential? This action cannot be undone.'
    );
    
    if (!confirmed) return;
    
    try {
      setIsRevoking(true);
      await onRevoke();
    } finally {
      setIsRevoking(false);
    }
  };
  
  return (
    <div className={`rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${isRevoked ? 'border border-red-200 bg-red-50' : 'border border-indigo-100 bg-white'}`}>
      <div className={`p-1 ${isRevoked ? 'bg-red-100' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}></div>
      <div className="p-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {metadata?.name || 'Credential'}
            </h3>
            <p className="text-sm text-gray-500 flex items-center">
              <svg className="h-3 w-3 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              {formatId(id)}
            </p>
          </div>
          <div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              isRevoked 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'bg-green-100 text-green-800 border border-green-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isRevoked ? 'bg-red-500' : 'bg-green-500'}`}></span>
              {isRevoked ? 'Revoked' : 'Valid'}
            </span>
          </div>
        </div>
        
        <div className="mt-4 bg-gray-50 p-3 rounded-md border border-gray-100">
          <div className="flex items-center text-sm">
            <svg className="h-4 w-4 text-indigo-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-600">
              Expires: <span className="font-medium text-gray-900">{formatDate(metadata?.expiration || '')}</span>
            </span>
          </div>
          
          {metadata?.issuer && (
            <div className="flex items-center text-sm mt-2">
              <svg className="h-4 w-4 text-indigo-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-gray-600">
                Issuer: <span className="font-medium text-gray-900">{metadata.issuer}</span>
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-sm px-3 py-1.5 border border-gray-200 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg className={`h-4 w-4 mr-1.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? 'Hide details' : 'Show details'}
          </button>
          
          {onInspect && (
            <button
              onClick={onInspect}
              className="flex items-center text-sm px-3 py-1.5 border border-indigo-200 rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Inspect
            </button>
          )}
          
          {onRevoke && !isRevoked && (
            <button
              onClick={handleRevoke}
              disabled={isRevoking}
              className="flex items-center text-sm px-3 py-1.5 border border-red-200 rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRevoking ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-1.5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Revoking...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Revoke
                </>
              )}
            </button>
          )}
        </div>
        
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <svg className="h-4 w-4 text-indigo-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Technical Details
              </h4>
              <dl className="grid grid-cols-1 gap-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-3.5 w-3.5 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Nullifier (unique identifier)
                  </dt>
                  <dd className="mt-1 text-sm font-mono bg-gray-50 p-1.5 rounded border border-gray-200 text-gray-700 break-all">
                    {formatId(nullifier)}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <svg className="h-3.5 w-3.5 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Record ID
                  </dt>
                  <dd className="mt-1 text-sm font-mono bg-gray-50 p-1.5 rounded border border-gray-200 text-gray-700 break-all">
                    {id}
                  </dd>
                </div>
              </dl>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  This credential is stored on the Sui blockchain and can be verified by third parties without revealing your private data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}