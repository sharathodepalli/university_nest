interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  additionalData?: any;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: ErrorLog[] = [];
  private maxErrors = 100;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  logError(error: Error | string, level: 'error' | 'warning' | 'info' = 'error', additionalData?: any): void {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      additionalData
    };

    // Add to local storage for persistence
    this.errors.unshift(errorLog);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Store in localStorage
    try {
      localStorage.setItem('uninest_error_logs', JSON.stringify(this.errors.slice(0, 10)));
    } catch (e) {
      console.warn('Failed to store error logs in localStorage');
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    }

    // In production, you would send this to your error tracking service
    // this.sendToErrorService(errorLog);
  }

  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
    localStorage.removeItem('uninest_error_logs');
  }

  // Mock function for sending errors to external service
  private async sendToErrorService(errorLog: ErrorLog): Promise<void> {
    // In production, implement actual error reporting service
    // e.g., Sentry, LogRocket, etc.
    try {
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog)
      // });
    } catch (e) {
      console.warn('Failed to send error to service:', e);
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();

// Global error handler
export const setupGlobalErrorHandling = (): void => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.logError(
      new Error(`Unhandled promise rejection: ${event.reason}`),
      'error',
      { type: 'unhandledrejection', reason: event.reason }
    );
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    errorHandler.logError(
      new Error(`Global error: ${event.message}`),
      'error',
      {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    );
  });
};

// React error boundary helper
export const handleReactError = (error: Error, errorInfo: any): void => {
  errorHandler.logError(error, 'error', {
    type: 'react',
    componentStack: errorInfo.componentStack
  });
};