/**
 * Real CDN Integration
 * 
 * Actual CDN implementation for performance improvement
 * Agent 2 - Performance Optimization Team
 */

export interface CDNConfig {
  baseUrl: string;
  apiKey?: string;
  zoneId?: string;
  enableCompression: boolean;
  enableCaching: boolean;
  cacheDuration: number;
}

class RealCDN {
  private config: CDNConfig;
  private isProduction: boolean;
  private performanceMetrics: {
    cdnRequests: number;
    totalLoadTime: number;
    cacheHits: number;
    compressionRatio: number;
  };

  constructor(config: CDNConfig) {
    this.config = config;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.performanceMetrics = {
      cdnRequests: 0,
      totalLoadTime: 0,
      cacheHits: 0,
      compressionRatio: 0.75 // Default compression ratio
    };
  }

  /**
   * Get CDN-optimized asset URL
   */
  getAssetUrl(assetPath: string, options: {
    format?: 'webp' | 'avif' | 'original';
    quality?: number;
    width?: number;
    height?: number;
    compression?: 'gzip' | 'brotli';
  } = {}): string {
    if (!this.isProduction) {
      return assetPath; // Use local assets in development
    }

    const baseUrl = this.config.baseUrl;
    const params = new URLSearchParams();

    // Add image optimization parameters
    if (options.format && options.format !== 'original') {
      params.append('f', options.format);
    }

    if (options.quality) {
      params.append('q', options.quality.toString());
    }

    if (options.width) {
      params.append('w', options.width.toString());
    }

    if (options.height) {
      params.append('h', options.height.toString());
    }

    // Add compression parameters
    if (options.compression) {
      params.append('compression', options.compression);
    }

    // Add cache busting
    params.append('v', Date.now().toString());

    const queryString = params.toString();
    const separator = assetPath.includes('?') ? '&' : '?';

    return `${baseUrl}${assetPath}${queryString ? separator + queryString : ''}`;
  }

  /**
   * Preload critical assets
   */
  preloadAssets(assets: string[]): void {
    if (!this.isProduction) return;

    assets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = this.getAssetUrl(asset);
      link.as = this.getAssetType(asset);
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /**
   * Get asset type for preloading
   */
  private getAssetType(asset: string): string {
    if (asset.endsWith('.js')) return 'script';
    if (asset.endsWith('.css')) return 'style';
    if (asset.endsWith('.woff2') || asset.endsWith('.woff') || asset.endsWith('.ttf')) return 'font';
    if (asset.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) return 'image';
    return 'fetch';
  }

  /**
   * Initialize CDN performance monitoring
   */
  initializeMonitoring(): void {
    if (!this.isProduction) return;

    // Monitor resource loading performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes(this.config.baseUrl)) {
          this.trackCDNPerformance(entry);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Track CDN performance metrics
   */
  private trackCDNPerformance(entry: PerformanceEntry): void {
    this.performanceMetrics.cdnRequests++;
    this.performanceMetrics.totalLoadTime += entry.duration;

    // Estimate cache hits (transfer size = 0 indicates cache hit)
    if ('transferSize' in entry && (entry as any).transferSize === 0) {
      this.performanceMetrics.cacheHits++;
    }

    console.log(`CDN Asset: ${entry.name} loaded in ${entry.duration}ms`);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const averageLoadTime = this.performanceMetrics.cdnRequests > 0 
      ? this.performanceMetrics.totalLoadTime / this.performanceMetrics.cdnRequests 
      : 0;

    const cacheHitRate = this.performanceMetrics.cdnRequests > 0
      ? this.performanceMetrics.cacheHits / this.performanceMetrics.cdnRequests
      : 0;

    return {
      cdnEnabled: this.isProduction,
      totalRequests: this.performanceMetrics.cdnRequests,
      averageLoadTime,
      cacheHitRate,
      compressionRatio: this.performanceMetrics.compressionRatio
    };
  }

  /**
   * Purge CDN cache for specific assets
   */
  async purgeCache(assets: string[]): Promise<boolean> {
    if (!this.isProduction || !this.config.apiKey || !this.config.zoneId) {
      return false;
    }

    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: assets.map(asset => `${this.config.baseUrl}${asset}`)
        })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('CDN cache purge failed:', error);
      return false;
    }
  }
}

// Default CDN configuration
const defaultCDNConfig: CDNConfig = {
  baseUrl: process.env.REACT_APP_CDN_URL || 'https://cdn.example.com',
  apiKey: process.env.REACT_APP_CDN_API_KEY,
  zoneId: process.env.REACT_APP_CDN_ZONE_ID,
  enableCompression: true,
  enableCaching: true,
  cacheDuration: 31536000 // 1 year
};

// Create and export CDN instance
export const realCDN = new RealCDN(defaultCDNConfig);

/**
 * Initialize real CDN integration
 */
export function initializeRealCDN(config?: Partial<CDNConfig>): void {
  if (config) {
    Object.assign(defaultCDNConfig, config);
  }

  // Initialize performance monitoring
  realCDN.initializeMonitoring();

  // Preload critical assets
  realCDN.preloadAssets([
    '/assets/index.css',
    '/assets/index.js',
    '/assets/three-core.js'
  ]);

  console.log('Real CDN initialized:', defaultCDNConfig);
}

/**
 * Get CDN-optimized asset URL
 */
export function getCDNAssetUrl(assetPath: string, options?: any): string {
  return realCDN.getAssetUrl(assetPath, options);
}

/**
 * Get CDN performance metrics
 */
export function getCDNPerformanceMetrics() {
  return realCDN.getPerformanceMetrics();
}

/**
 * Purge CDN cache
 */
export function purgeCDNCache(assets: string[]): Promise<boolean> {
  return realCDN.purgeCache(assets);
}
