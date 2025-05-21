'use client';

import { useState, useEffect } from 'react';

interface StorageInspectorProps {
  storageKey: string;
  onMetadataLoaded?: (metadata: any) => void;
}

export default function StorageInspector({ storageKey, onMetadataLoaded }: StorageInspectorProps) {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchMetadata() {
      if (!storageKey) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real app, this would call the Walrus API to fetch and decrypt metadata
        // For demo purposes, we'll mock the metadata
        const mockMetadata = {
          name: 'Demo Credential',
          issuer: 'SuiZkCred',
          expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          attributes: {
            verified: true,
            level: 'Standard',
          }
        };
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setMetadata(mockMetadata);
        if (onMetadataLoaded) {
          onMetadataLoaded(mockMetadata);
        }
      } catch (err) {
        console.error('Error fetching metadata:', err);
        setError('Failed to fetch credential metadata');
      } finally {
        setLoading(false);
      }
    }
    
    fetchMetadata();
  }, [storageKey, onMetadataLoaded]);
  
  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500">Loading metadata...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }
  
  if (!metadata) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-sm text-gray-500">No metadata available</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Credential Metadata</h3>
      
      <div className="space-y-2">
        {Object.entries(metadata).map(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="pt-2">
                <h4 className="text-xs font-medium text-gray-500">{key}</h4>
                <div className="ml-2">
                  {Object.entries(value as object).map(([subKey, subValue]) => (
                    <div key={subKey} className="flex justify-between text-xs">
                      <span className="text-gray-500">{subKey}:</span>
                      <span className="text-gray-900 font-medium">{String(subValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          
          return (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-gray-500">{key}:</span>
              <span className="text-gray-900 font-medium">{String(value)}</span>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Storage Key: {storageKey.substring(0, 10)}...
        </p>
      </div>
    </div>
  );
}