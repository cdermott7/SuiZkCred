'use client';

/**
 * Converts various error types into a standardized format
 * with user-friendly messages
 */
export function handleError(error: any): { message: string; code?: string; details?: any } {
  console.error('Error caught by handler:', error);
  
  // Handle string errors
  if (typeof error === 'string') {
    return { message: error };
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return { 
      message: error.message || 'An unexpected error occurred',
      details: error.stack
    };
  }
  
  // Handle Sui wallet errors
  if (error && error.code && typeof error.message === 'string') {
    const userMessage = getUserMessageForWalletError(error.code, error.message);
    return {
      message: userMessage,
      code: error.code,
      details: error
    };
  }
  
  // Handle unknown error structures
  return { 
    message: error?.message || 'An unexpected error occurred',
    details: error
  };
}

/**
 * Maps wallet error codes to user-friendly messages
 */
function getUserMessageForWalletError(code: string, originalMessage: string): string {
  const errorMessages: Record<string, string> = {
    'user_rejected': 'You declined the transaction. Please approve it in your wallet to continue.',
    'wallet_not_connected': 'Your wallet is not connected. Please connect your wallet and try again.',
    'insufficient_funds': 'You don\'t have enough SUI to complete this transaction.',
    'transaction_rejected': 'The transaction was rejected by the blockchain.',
    'network_error': 'Network error. Please check your connection and try again.',
    'simulation_failure': 'Transaction simulation failed. This might be due to an issue with the transaction parameters.',
  };
  
  // Return a mapped message if available, otherwise a generic one with the original details
  return errorMessages[code] || `Transaction failed: ${originalMessage}`;
}

/**
 * Provides a toast/notification message based on the error
 */
export function getErrorNotification(error: any): { title: string; message: string; type: 'error' | 'warning' } {
  const processed = handleError(error);
  
  // Determine the notification type based on error
  let type: 'error' | 'warning' = 'error';
  if (processed.code === 'user_rejected') {
    type = 'warning'; // User actions aren't critical errors
  }
  
  // Create a short title
  let title = 'Error';
  if (processed.code === 'user_rejected') title = 'Transaction Declined';
  if (processed.code === 'wallet_not_connected') title = 'Wallet Not Connected';
  if (processed.code === 'insufficient_funds') title = 'Insufficient Funds';
  if (processed.code === 'network_error') title = 'Network Error';
  
  return {
    title,
    message: processed.message,
    type
  };
}