/**
 * Error Reporting & Analytics Integration
 * Integrates with external error tracking services like Sentry
 */

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  component: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  buildVersion?: string;
  environment: 'development' | 'production';
  breadcrumbs: Breadcrumb[];
  context: Record<string, any>;
  tags: Record<string, string>;
}

export interface Breadcrumb {
  timestamp: number;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface ErrorReportingConfig {
  dsn?: string; // Sentry DSN or similar
  environment: 'development' | 'production';
  release?: string;
  maxBreadcrumbs: number;
  maxReportsPerSession: number;
  enableUserFeedback: boolean;
  enableAutoSessionTracking: boolean;
  enablePerformanceMonitoring: boolean;
  sampleRate: number; // 0.0 to 1.0
}

class ErrorReportingService {
  private config: ErrorReportingConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private sessionId: string;
  private reportCount: number = 0;
  private isInitialized: boolean = false;
  private listeners: Array<(report: ErrorReport) => void> = [];

  constructor(config?: Partial<ErrorReportingConfig>) {
    this.config = {
      environment: process.env.NODE_ENV as 'development' | 'production' || 'development',
      maxBreadcrumbs: 100,
      maxReportsPerSession: 50,
      enableUserFeedback: true,
      enableAutoSessionTracking: true,
      enablePerformanceMonitoring: true,
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize error reporting service
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Setup global error handlers
    this.setupGlobalErrorHandlers();

    // Setup unhandled promise rejection handler
    this.setupUnhandledRejectionHandler();

    // Initialize Sentry if DSN is provided
    this.initializeSentry();

    // Start session tracking
    if (this.config.enableAutoSessionTracking) {
      this.startSession();
    }

    // Add initial breadcrumb
    this.addBreadcrumb({
      category: 'system',
      message: 'Error reporting initialized',
      level: 'info',
      data: {
        environment: this.config.environment,
        sessionId: this.sessionId
      }
    });

    this.isInitialized = true;
    console.log('📊 Error reporting service initialized');
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        component: 'GlobalErrorHandler',
        category: 'javascript',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'GlobalPromiseHandler',
          category: 'promise',
          context: {
            reason: event.reason
          }
        }
      );
    });
  }

  /**
   * Setup unhandled promise rejection handler
   */
  private setupUnhandledRejectionHandler(): void {
    // Additional handling for promise rejections
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this looks like an unhandled promise rejection
      const message = args.join(' ');
      if (message.includes('Uncaught') || message.includes('Promise')) {
        this.addBreadcrumb({
          category: 'console',
          message: `Console error: ${message}`,
          level: 'error'
        });
      }
      originalConsoleError.apply(console, args);
    };
  }

  /**
   * Initialize Sentry SDK if configured
   */
  private initializeSentry(): void {
    if (!this.config.dsn) {
      console.log('📊 No Sentry DSN provided, using local error reporting only');
      return;
    }

    try {
      // This would be replaced with actual Sentry integration
      // import * as Sentry from '@sentry/browser';
      
      // Sentry.init({
      //   dsn: this.config.dsn,
      //   environment: this.config.environment,
      //   release: this.config.release,
      //   maxBreadcrumbs: this.config.maxBreadcrumbs,
      //   sampleRate: this.config.sampleRate,
      //   beforeSend: (event) => this.beforeSendHandler(event)
      // });

      console.log('📊 Sentry integration would be initialized here');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Start session tracking
   */
  private startSession(): void {
    this.addBreadcrumb({
      category: 'session',
      message: 'Session started',
      level: 'info',
      data: {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.addBreadcrumb({
        category: 'navigation',
        message: `Page ${document.hidden ? 'hidden' : 'visible'}`,
        level: 'info'
      });
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  /**
   * End session tracking
   */
  private endSession(): void {
    this.addBreadcrumb({
      category: 'session',
      message: 'Session ended',
      level: 'info',
      data: {
        sessionId: this.sessionId,
        duration: Date.now() - parseInt(this.sessionId, 36),
        reportCount: this.reportCount
      }
    });
  }

  /**
   * Capture exception with context
   */
  captureException(error: Error, options?: {
    component?: string;
    category?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, any>;
    tags?: Record<string, string>;
    user?: { id?: string; email?: string; username?: string };
  }): string {
    // Check if we should sample this error
    if (Math.random() > this.config.sampleRate) {
      return '';
    }

    // Check report limits
    if (this.reportCount >= this.config.maxReportsPerSession) {
      console.warn('Maximum error reports per session reached');
      return '';
    }

    const errorId = this.generateErrorId();
    const report: ErrorReport = {
      id: errorId,
      message: error.message,
      stack: this.config.environment === 'development' ? error.stack : undefined,
      component: options?.component || 'Unknown',
      category: options?.category || 'error',
      severity: options?.severity || 'medium',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      buildVersion: process.env.REACT_APP_VERSION,
      environment: this.config.environment,
      breadcrumbs: [...this.breadcrumbs],
      context: {
        ...this.getSystemContext(),
        ...options?.context
      },
      tags: {
        component: options?.component || 'Unknown',
        category: options?.category || 'error',
        ...options?.tags
      }
    };

    // Add error breadcrumb
    this.addBreadcrumb({
      category: 'error',
      message: `Error captured: ${error.message}`,
      level: 'error',
      data: {
        errorId,
        component: report.component,
        severity: report.severity
      }
    });

    // Send to external services
    this.sendToExternalServices(report);

    // Store locally for support
    this.storeLocalReport(report);

    // Notify listeners
    this.notifyListeners(report);

    this.reportCount++;

    return errorId;
  }

  /**
   * Add breadcrumb for context tracking
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      ...breadcrumb
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Maintain max breadcrumbs limit
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  /**
   * Capture user feedback
   */
  captureUserFeedback(errorId: string, feedback: {
    name?: string;
    email?: string;
    comments: string;
  }): void {
    if (!this.config.enableUserFeedback) return;

    const feedbackReport = {
      errorId,
      feedback,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    // Store feedback locally
    try {
      localStorage.setItem(`feedback_${errorId}`, JSON.stringify(feedbackReport));
    } catch (e) {
      console.warn('Failed to store user feedback locally');
    }

    // Send to external service
    this.sendFeedbackToExternalServices(feedbackReport);

    this.addBreadcrumb({
      category: 'user',
      message: 'User feedback provided',
      level: 'info',
      data: { errorId }
    });
  }

  /**
   * Set user context
   */
  setUser(user: { id?: string; email?: string; username?: string }): void {
    this.addBreadcrumb({
      category: 'user',
      message: 'User context updated',
      level: 'info',
      data: { userId: user.id }
    });

    // Update Sentry user context if available
    if ((window as any).Sentry) {
      (window as any).Sentry.setUser(user);
    }
  }

  /**
   * Set custom tags
   */
  setTag(key: string, value: string): void {
    if ((window as any).Sentry) {
      (window as any).Sentry.setTag(key, value);
    }
  }

  /**
   * Set custom context
   */
  setContext(key: string, context: Record<string, any>): void {
    if ((window as any).Sentry) {
      (window as any).Sentry.setContext(key, context);
    }
  }

  /**
   * Get system context information
   */
  private getSystemContext(): Record<string, any> {
    const canvas = document.querySelector('canvas');
    const gl = canvas?.getContext('webgl') || canvas?.getContext('experimental-webgl') as WebGLRenderingContext;

    return {
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        devicePixelRatio: window.devicePixelRatio
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      webgl: gl ? {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        contextLost: gl.isContextLost?.()
      } : null,
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null,
      timing: {
        navigationStart: performance.timing?.navigationStart,
        loadEventEnd: performance.timing?.loadEventEnd,
        domContentLoadedEventEnd: performance.timing?.domContentLoadedEventEnd
      }
    };
  }

  /**
   * Send report to external services
   */
  private sendToExternalServices(report: ErrorReport): void {
    // Send to Sentry
    if ((window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(report.message), {
        tags: report.tags,
        extra: report.context,
        user: { sessionId: report.sessionId },
        level: this.mapSeverityToSentryLevel(report.severity)
      });
    }

    // Send to custom analytics endpoint
    if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
      fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      }).catch(error => {
        console.warn('Failed to send error report to analytics:', error);
      });
    }
  }

  /**
   * Send feedback to external services
   */
  private sendFeedbackToExternalServices(feedback: any): void {
    if ((window as any).Sentry) {
      (window as any).Sentry.captureUserFeedback({
        event_id: feedback.errorId,
        name: feedback.feedback.name,
        email: feedback.feedback.email,
        comments: feedback.feedback.comments
      });
    }
  }

  /**
   * Store report locally for support
   */
  private storeLocalReport(report: ErrorReport): void {
    try {
      const localReports = this.getLocalReports();
      localReports.push({
        id: report.id,
        timestamp: report.timestamp,
        message: report.message,
        component: report.component,
        severity: report.severity
      });

      // Keep only last 20 reports
      const recentReports = localReports.slice(-20);
      localStorage.setItem('error_reports', JSON.stringify(recentReports));
    } catch (e) {
      console.warn('Failed to store error report locally');
    }
  }

  /**
   * Get local error reports
   */
  getLocalReports(): any[] {
    try {
      const stored = localStorage.getItem('error_reports');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Map severity to Sentry level
   */
  private mapSeverityToSentryLevel(severity: string): string {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'fatal';
      default: return 'error';
    }
  }

  // Note: beforeSendHandler method would be used here for Sentry integration
  // when Sentry SDK is properly configured

  /**
   * Add listener for error reports
   */
  addListener(callback: (report: ErrorReport) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(report: ErrorReport): void {
    this.listeners.forEach(listener => {
      try {
        listener(report);
      } catch (error) {
        console.error('Error report listener failed:', error);
      }
    });
  }

  /**
   * Get reporting statistics
   */
  getStats(): {
    reportCount: number;
    sessionId: string;
    breadcrumbCount: number;
    isInitialized: boolean;
  } {
    return {
      reportCount: this.reportCount,
      sessionId: this.sessionId,
      breadcrumbCount: this.breadcrumbs.length,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Export all data for debugging
   */
  exportData(): string {
    return JSON.stringify({
      config: this.config,
      stats: this.getStats(),
      breadcrumbs: this.breadcrumbs,
      localReports: this.getLocalReports()
    }, null, 2);
  }
}

// Global error reporting instance
let errorReportingService: ErrorReportingService | null = null;

/**
 * Initialize error reporting
 */
export function initializeErrorReporting(config?: Partial<ErrorReportingConfig>): ErrorReportingService {
  if (errorReportingService) {
    return errorReportingService;
  }

  errorReportingService = new ErrorReportingService(config);
  
  // Setup global reference
  (window as any).__ERROR_REPORTING__ = errorReportingService;

  return errorReportingService;
}

/**
 * Get error reporting service instance
 */
export function getErrorReporting(): ErrorReportingService | null {
  return errorReportingService;
}

/**
 * Capture exception shorthand
 */
export function captureException(error: Error, context?: any): string {
  if (!errorReportingService) {
    console.error('Error reporting not initialized:', error);
    return '';
  }
  return errorReportingService.captureException(error, context);
}

/**
 * Add breadcrumb shorthand
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  if (errorReportingService) {
    errorReportingService.addBreadcrumb(breadcrumb);
  }
}

export default ErrorReportingService;
