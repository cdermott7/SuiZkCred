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
}

export default function CredentialCard({ id, nullifier, isRevoked, metadata }: CredentialCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Format a long string for display
  const formatId = (id: string) => {
    if (id.length <= 12) return id;
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
  
  return (
    <div className={`border rounded-lg shadow overflow-hidden ${isRevoked ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {metadata?.name || 'Credential'}
            </h3>
            <p className="text-sm text-gray-500">
              ID: {formatId(id)}
            </p>
          </div>
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isRevoked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {isRevoked ? 'Revoked' : 'Valid'}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-indigo-600 hover:text-indigo-500"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
        
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Nullifier</dt>
                <dd className="mt-1 text-sm text-gray-900 break-all">
                  {formatId(nullifier)}
                </dd>
              </div>
              
              {metadata?.issuer && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Issuer</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {metadata.issuer}
                  </dd>
                </div>
              )}
              
              {metadata?.expiration && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Expiration</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(metadata.expiration)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}