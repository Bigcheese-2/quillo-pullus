import { isDevelopment } from '@/lib/config/env';


export function getErrorMessage(error: unknown, defaultMessage = 'Unknown error'): string {
  return error instanceof Error ? error.message : defaultMessage;
}

export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  INDEXEDDB = 'INDEXEDDB',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  statusCode?: number;
  recoverable: boolean;
}

export function detectErrorType(error: unknown): ErrorType {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return ErrorType.NETWORK;
  }

  if (error instanceof Error) {
    if ('status' in error) {
      return ErrorType.API;
    }
    
    if (error.message.includes('IndexedDB') || 
        error.message.includes('Database') ||
        error.message.includes('quota') ||
        error.name === 'QuotaExceededError') {
      return ErrorType.INDEXEDDB;
    }
    
    if (error.message.includes('Invalid') || 
        error.message.includes('validation') ||
        error.message.includes('must be')) {
      return ErrorType.VALIDATION;
    }
  }

  return ErrorType.UNKNOWN;
}


export function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
}

export function isRecoverableError(errorType: ErrorType, statusCode?: number): boolean {
  switch (errorType) {
    case ErrorType.NETWORK:
      return true;
    case ErrorType.API:
      return statusCode !== undefined && statusCode >= 500;
    case ErrorType.INDEXEDDB:
      return errorType === ErrorType.INDEXEDDB;
    case ErrorType.VALIDATION:
      return false;
    default:
      return false;
  }
}

export function createAppError(error: unknown, defaultMessage = 'An unknown error occurred'): AppError {
  const errorType = detectErrorType(error);
  const statusCode = getErrorStatus(error);
  const message = error instanceof Error ? error.message : defaultMessage;
  const originalError = error instanceof Error ? error : undefined;
  const recoverable = isRecoverableError(errorType, statusCode);

  return {
    type: errorType,
    message,
    originalError,
    statusCode,
    recoverable,
  };
}

export function getUserFriendlyMessage(error: AppError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Network error: Unable to connect to the server. Please check your internet connection.';
    
    case ErrorType.API:
      if (error.statusCode === 400) {
        return 'Invalid request. Please check your input and try again.';
      }
      if (error.statusCode === 401) {
        return 'Authentication failed. Please refresh the page.';
      }
      if (error.statusCode === 404) {
        return 'Resource not found. It may have been deleted.';
      }
      if (error.statusCode === 500) {
        return 'Server error. Please try again later.';
      }
      return `Server error (${error.statusCode}). Please try again.`;
    
    case ErrorType.INDEXEDDB:
      if (error.message.includes('quota')) {
        return 'Storage quota exceeded. Please free up space in your browser.';
      }
      if (error.message.includes('blocked')) {
        return 'Database access blocked. Please check your browser permissions.';
      }
      return 'Local storage error. Your data may not be saved.';
    
    case ErrorType.VALIDATION:
      return error.message;
    
    default:
      return error.message || 'An unexpected error occurred.';
  }
}


export function logError(error: AppError, context?: string): void {
  if (!isDevelopment()) {
    return;
  }
}

