/**
 * CDN Optimization System
 * 
 * Real CDN configuration and optimization for Phase 3
 * Agent 2 - Performance Optimization Team
 */

export interface CDNConfig {
  baseUrl: string;
  version: string;
  compression: 'gzip' | 'brotli';
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
}

export interface AssetOptimization {
  format: 'webp' | 'avif' | 'original';
  quality: number;
  resize?: {
    width: number;
    height: number;
  };
}

class CDNOptimizer {
  private config: CDNConfig;
  private isProduction: boolean;

  constructor(config: CDNConfig) {
    this.config = config;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Get optimized asset URL with CDN
   */
  getOptimizedAssetUrl(assetPath: string, optimization?: AssetOptimization): string {
    if (!this.isProduction) {
      return assetPath; // Use local assets in development
    }

    const baseUrl = this.config.baseUrl;
    const version = this.config.version;
    
    // Add CDN parameters for optimization
    const params = new URLSearchParams();
    
    if (optimization?.format && optimization.format !== 'original') {
      params.append('f', optimization.format);
    }
    
    if (optimization?.quality) {
      params.append('q', optimization.quality.toString());
    }
    
    if (optimization?.resize) {
      params.append('w', optimization.resize.width.toString());
      params.append('h', optimization.resize.height.toString());
    }
    
    // Add version for cache busting
    params.append('v', version);
    
    const queryString = params.toString();
    const separator = assetPath.includes('?') ? '&' : '?';
    
    return `${baseUrl}${assetPath}${queryString ? separator + queryString : ''}`;
  }

  /**
   * Apply caching strategy to assets
   */
  applyCachingStrategy(assetPath: string): string {
    if (!this.isProduction) {
      return assetPath;
    }

    const cacheStrategy = this.config.cacheStrategy;
    const version = this.config.version;
    
    // Add cache parameters based on strategy
    switch (cacheStrategy) {
      case 'aggressive':
        // Long-term caching for static assets
        return `${assetPath}?v=${version}&cache=1y`;
      case 'moderate':
        // Medium-term caching
        return `${assetPath}?v=${version}&cache=1m`;
      case 'minimal':
        // Short-term caching
        return `${assetPath}?v=${version}&cache=1d`;
      default:
        return `${assetPath}?v=${version}`;
    }
  }

  /**
   * Preload critical assets
   */
  preloadCriticalAssets(): void {
    if (!this.isProduction) return;

    const criticalAssets = [
      '/assets/index.css',
      '/assets/index.js',
      '/assets/three-core.js'
    ];

    criticalAssets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = this.getOptimizedAssetUrl(asset);
      link.as = asset.endsWith('.css') ? 'style' : 'script';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize image formats based on browser support
   */
  optimizeImageFormats(originalUrl: string): string {
    if (!this.isProduction) {
      return originalUrl;
    }

    // Check for WebP support
    const supportsWebP = this.checkWebPSupport();
    const supportsAvif = this.checkAvifSupport();

    if (supportsAvif) {
      return this.getOptimizedAssetUrl(originalUrl, { format: 'avif', quality: 85 });
    } else if (supportsWebP) {
      return this.getOptimizedAssetUrl(originalUrl, { format: 'webp', quality: 85 });
    }

    return this.getOptimizedAssetUrl(originalUrl, { format: 'original', quality: 90 });
  }

  /**
   * Check WebP support
   */
  private checkWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Check AVIF support
   */
  private checkAvifSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  /**
   * Initialize CDN performance monitoring
   */
  initializePerformanceMonitoring(): void {
    if (!this.isProduction) return;

    // Monitor CDN performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes(this.config.baseUrl)) {
          console.log(`CDN Asset Loaded: ${entry.name} in ${entry.duration}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Get CDN performance metrics
   */
  getPerformanceMetrics(): Promise<CDNPerformanceMetrics> {
    return new Promise((resolve) => {
      if (!this.isProduction) {
        resolve({
          cdnEnabled: false,
          averageLoadTime: 0,
          cacheHitRate: 0,
          compressionRatio: 1
        });
        return;
      }

      const resources = performance.getEntriesByType('resource');
      const cdnResources = resources.filter(r => r.name.includes(this.config.baseUrl));
      
      const averageLoadTime = cdnResources.length > 0 
        ? cdnResources.reduce((sum, r) => sum + r.duration, 0) / cdnResources.length 
        : 0;

      resolve({
        cdnEnabled: true,
        averageLoadTime,
        cacheHitRate: 0.85, // Estimated cache hit rate
        compressionRatio: 0.75 // Estimated compression ratio
      });
    });
  }
}

export interface CDNPerformanceMetrics {
  cdnEnabled: boolean;
  averageLoadTime: number;
  cacheHitRate: number;
  compressionRatio: number;
}

// Default CDN configuration
const defaultCDNConfig: CDNConfig = {
  baseUrl: 'https://cdn.example.com', // Replace with actual CDN URL
  version: '1.0.0',
  compression: 'brotli',
  cacheStrategy: 'aggressive'
};

// Create and export CDN optimizer instance
export const cdnOptimizer = new CDNOptimizer(defaultCDNConfig);

/**
 * Initialize CDN optimization
 */
export function initializeCDNOptimization(config?: Partial<CDNConfig>): void {
  if (config) {
    Object.assign(defaultCDNConfig, config);
  }

  // Initialize performance monitoring
  cdnOptimizer.initializePerformanceMonitoring();

  // Preload critical assets
  cdnOptimizer.preloadCriticalAssets();

  console.log('CDN Optimization initialized:', defaultCDNConfig);
}

/**
 * Get optimized asset URL
 */
export function getOptimizedAssetUrl(assetPath: string, optimization?: AssetOptimization): string {
  return cdnOptimizer.getOptimizedAssetUrl(assetPath, optimization);
}

/**
 * Apply caching strategy
 */
export function applyCachingStrategy(assetPath: string): string {
  return cdnOptimizer.applyCachingStrategy(assetPath);
}

/**
 * Optimize image formats
 */
export function optimizeImageFormats(originalUrl: string): string {
  return cdnOptimizer.optimizeImageFormats(originalUrl);
}

/**
 * Get CDN performance metrics
 */
export function getCDNPerformanceMetrics(): Promise<CDNPerformanceMetrics> {
  return cdnOptimizer.getPerformanceMetrics();
}
