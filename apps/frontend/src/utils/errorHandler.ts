'use client';

export interface ProcessedError {
  message: string;
  code?: string;
  type: 'validation' | 'network' | 'contract' | 'ai' | 'zk' | 'wallet' | 'unknown';
  userMessage: string;
  technicalDetails?: string;
  suggestedActions?: string[];
}

/**
 * Enhanced error handler with categorization and user-friendly messages
 */
export function handleError(error: any): ProcessedError {
  console.error('Error caught by handler:', error);

  // Default error structure
  let processedError: ProcessedError = {
    message: 'An unexpected error occurred',
    type: 'unknown',
    userMessage: 'Something went wrong. Please try again.',
    suggestedActions: ['Refresh the page', 'Try again later']
  };

  // Handle different error types
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // AI/Document analysis errors
    if (message.includes('ai analysis') || message.includes('document analysis')) {
      processedError = {
        message: error.message,
        type: 'ai',
        userMessage: 'Document analysis failed',
        technicalDetails: error.message,
        suggestedActions: [
          'Try uploading a different document',
          'Ensure the document is clear and readable'
        ]
      };
    }
    
    // ZK proof errors
    else if (message.includes('zk') || message.includes('proof') || message.includes('nullifier')) {
      processedError = {
        message: error.message,
        type: 'zk',
        userMessage: 'Zero-knowledge proof generation failed',
        technicalDetails: error.message,
        suggestedActions: [
          'Check that all required fields are filled',
          'Try generating the proof again'
        ]
      };
    }
    
    // Wallet connection errors
    else if (message.includes('wallet') || message.includes('connect') || message.includes('sign')) {
      processedError = {
        message: error.message,
        type: 'wallet',
        userMessage: 'Wallet connection or signing failed',
        technicalDetails: error.message,
        suggestedActions: [
          'Check that your wallet is connected',
          'Try refreshing the wallet connection'
        ]
      };
    }
    
    // Smart contract errors
    else if (message.includes('contract') || message.includes('transaction') || message.includes('sui')) {
      processedError = {
        message: error.message,
        type: 'contract',
        userMessage: 'Blockchain transaction failed',
        technicalDetails: error.message,
        suggestedActions: [
          'Check your wallet balance',
          'Verify network connectivity'
        ]
      };
    }
    
    // Generic error with message
    else {
      processedError.message = error.message;
      processedError.userMessage = error.message;
      processedError.technicalDetails = error.message;
    }
  }

  // Handle specific error codes
  if (error?.code) {
    processedError.code = error.code;
    const userMessage = getUserMessageForWalletError(error.code, error.message);
    processedError.userMessage = userMessage;
  }

  return processedError;
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