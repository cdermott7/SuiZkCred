'use client';

import { useState, useEffect, useCallback } from 'react';
import walrusClient, { StorageKey, CredentialMetadata } from '../utils/walrusStorage';

/**
 * Hook to fetch and manage credential metadata from Walrus storage
 * @param storageKey The storage key for the credential metadata
 */
export default function useCredentialMetadata(storageKey: StorageKey | null) {
  const [metadata, setMetadata] = useState<CredentialMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch metadata
  const fetchMetadata = useCallback(async () => {
    if (!storageKey) {
      setMetadata(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await walrusClient.retrieveMetadata(storageKey);
      setMetadata(data);
    } catch (err: any) {
      console.error('Failed to fetch credential metadata:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  // Function to update metadata
  const updateMetadata = useCallback(async (updatedMetadata: CredentialMetadata) => {
    if (!storageKey) {
      throw new Error('No storage key provided');
    }

    setLoading(true);
    setError(null);

    try {
      await walrusClient.storeMetadata(updatedMetadata, storageKey);
      setMetadata(updatedMetadata);
    } catch (err: any) {
      console.error('Failed to update credential metadata:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storageKey]);

  // Fetch metadata on initial load and when storageKey changes
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    metadata,
    loading,
    error,
    refreshMetadata: fetchMetadata,
    updateMetadata,
  };
}

/**
 * Hook to fetch and manage multiple credentials' metadata in bulk
 * @param storageKeys Array of storage keys for multiple credentials
 */
export function useBulkCredentialMetadata(storageKeys: StorageKey[]) {
  const [metadataMap, setMetadataMap] = useState<Record<string, CredentialMetadata>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch all metadata in bulk
  const fetchAllMetadata = useCallback(async () => {
    if (!storageKeys.length) {
      setMetadataMap({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        storageKeys.map(key => walrusClient.retrieveMetadata(key))
      );

      const newMetadataMap: Record<string, CredentialMetadata> = {};

      results.forEach((result, index) => {
        const key = storageKeys[index];
        if (result.status === 'fulfilled') {
          newMetadataMap[key.id] = result.value;
        } else {
          console.error(`Failed to fetch metadata for key ${key.id}:`, result.reason);
        }
      });

      setMetadataMap(newMetadataMap);
    } catch (err: any) {
      console.error('Failed to fetch credential metadata:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [storageKeys]);

  // Fetch metadata on initial load and when storageKeys change
  useEffect(() => {
    fetchAllMetadata();
  }, [fetchAllMetadata]);

  return {
    metadataMap,
    loading,
    error,
    refreshAllMetadata: fetchAllMetadata,
  };
}