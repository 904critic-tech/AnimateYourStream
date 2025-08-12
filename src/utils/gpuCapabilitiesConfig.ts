/**
 * GPU Capabilities Configuration for Verold Compatibility
 * Agent 2 - Performance Team
 * 
 * Target Verold GPU Capabilities:
 * - MAX_COMBINED_TEXTURE_IMAGE_UNITS: 64
 * - MAX_CUBE_MAP_TEXTURE_SIZE: 16384
 * - MAX_FRAGMENT_UNIFORM_VECTORS: 4096
 * - MAX_RENDERBUFFER_SIZE: 8192
 * - MAX_TEXTURE_IMAGE_UNITS: 32
 * - MAX_TEXTURE_SIZE: 8192
 * - MAX_VARYING_VECTORS: 31
 * - MAX_VERTEX_ATTRIBS: 16
 * - MAX_VERTEX_TEXTURE_IMAGE_UNITS: 32
 * - MAX_VERTEX_UNIFORM_VECTORS: 4096
 * - MAX_VIEWPORT_DIMS: 8192,8192
 * - ALIASED_POINT_SIZE_RANGE: 1,1023
 * - ALIASED_LINE_WIDTH_RANGE: 1,1
 * - SAMPLE_BUFFERS: 1
 * - RED_BITS: 8, GREEN_BITS: 8, BLUE_BITS: 8, ALPHA_BITS: 8
 * - DEPTH_BITS: 24
 * - maxAnisotropy: 16
 * - supportsVertexTextures: true
 * - supportsBoneTextures: true
 */

export interface VeroldGPUCapabilities {
  // Texture Units
  MAX_COMBINED_TEXTURE_IMAGE_UNITS: number;
  MAX_TEXTURE_IMAGE_UNITS: number;
  MAX_VERTEX_TEXTURE_IMAGE_UNITS: number;
  
  // Texture Sizes
  MAX_TEXTURE_SIZE: number;
  MAX_CUBE_MAP_TEXTURE_SIZE: number;
  
  // Uniform Vectors
  MAX_VERTEX_UNIFORM_VECTORS: number;
  MAX_FRAGMENT_UNIFORM_VECTORS: number;
  MAX_VARYING_VECTORS: number;
  
  // Vertex Attributes
  MAX_VERTEX_ATTRIBS: number;
  
  // Render Buffer
  MAX_RENDERBUFFER_SIZE: number;
  
  // Viewport
  MAX_VIEWPORT_DIMS: [number, number];
  
  // Aliasing
  ALIASED_POINT_SIZE_RANGE: [number, number];
  ALIASED_LINE_WIDTH_RANGE: [number, number];
  
  // Sample Buffers
  SAMPLE_BUFFERS: number;
  
  // Color Bits
  RED_BITS: number;
  GREEN_BITS: number;
  BLUE_BITS: number;
  ALPHA_BITS: number;
  DEPTH_BITS: number;
  
  // Extensions
  EXTENSIONS: string[];
  
  // Custom Properties
  maxAnisotropy: number;
  supportsVertexTextures: boolean;
  supportsBoneTextures: boolean;
  compressedTextureFormats: string[];
  
  // ReadPixels Support
  supportsReadPixels: boolean;
  readPixelsFormats: string[];
  readPixelsTypes: string[];
}

export const TARGET_VEROLD_CAPABILITIES: VeroldGPUCapabilities = {
  // Texture Units
  MAX_COMBINED_TEXTURE_IMAGE_UNITS: 64,
  MAX_TEXTURE_IMAGE_UNITS: 32,
  MAX_VERTEX_TEXTURE_IMAGE_UNITS: 32,
  
  // Texture Sizes
  MAX_TEXTURE_SIZE: 8192,
  MAX_CUBE_MAP_TEXTURE_SIZE: 16384,
  
  // Uniform Vectors
  MAX_VERTEX_UNIFORM_VECTORS: 4096,
  MAX_FRAGMENT_UNIFORM_VECTORS: 4096,
  MAX_VARYING_VECTORS: 31,
  
  // Vertex Attributes
  MAX_VERTEX_ATTRIBS: 16,
  
  // Render Buffer
  MAX_RENDERBUFFER_SIZE: 8192,
  
  // Viewport
  MAX_VIEWPORT_DIMS: [8192, 8192],
  
  // Aliasing
  ALIASED_POINT_SIZE_RANGE: [1, 1023],
  ALIASED_LINE_WIDTH_RANGE: [1, 1],
  
  // Sample Buffers
  SAMPLE_BUFFERS: 1,
  
  // Color Bits
  RED_BITS: 8,
  GREEN_BITS: 8,
  BLUE_BITS: 8,
  ALPHA_BITS: 8,
  DEPTH_BITS: 24,
  
  // Extensions
  EXTENSIONS: [
    'ANGLE_instanced_arrays',
    'EXT_blend_minmax',
    'EXT_clip_control',
    'EXT_color_buffer_half_float',
    'EXT_depth_clamp',
    'EXT_float_blend',
    'EXT_frag_depth',
    'EXT_polygon_offset_clamp',
    'EXT_shader_texture_lod',
    'EXT_texture_compression_bptc',
    'EXT_texture_compression_rgtc',
    'EXT_texture_filter_anisotropic',
    'EXT_texture_mirror_clamp_to_edge',
    'EXT_sRGB',
    'OES_element_index_uint',
    'OES_fbo_render_mipmap',
    'OES_standard_derivatives',
    'OES_texture_float',
    'OES_texture_float_linear',
    'OES_texture_half_float',
    'OES_texture_half_float_linear',
    'OES_vertex_array_object',
    'WEBGL_color_buffer_float',
    'WEBGL_compressed_texture_astc',
    'WEBGL_compressed_texture_etc',
    'WEBGL_compressed_texture_etc1',
    'WEBGL_compressed_texture_s3tc',
    'WEBGL_compressed_texture_s3tc_srgb',
    'WEBGL_debug_renderer_info',
    'WEBGL_debug_shaders',
    'WEBGL_depth_texture',
    'WEBGL_draw_buffers',
    'WEBGL_lose_context',
    'WEBGL_multi_draw',
    'WEBGL_polygon_mode'
  ],
  
  // Custom Properties
  maxAnisotropy: 16,
  supportsVertexTextures: true,
  supportsBoneTextures: true,
  compressedTextureFormats: [],
  
  // ReadPixels Support
  supportsReadPixels: false,
  readPixelsFormats: [],
  readPixelsTypes: []
};

export class GPUCapabilitiesManager {
  private gl: WebGLRenderingContext | WebGL2RenderingContext;
  private currentCapabilities: VeroldGPUCapabilities;
  private targetCapabilities: VeroldGPUCapabilities;

  constructor(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.gl = gl;
    this.targetCapabilities = TARGET_VEROLD_CAPABILITIES;
    this.currentCapabilities = this.detectCurrentCapabilities();
  }

  /**
   * Detect current GPU capabilities
   */
  private detectCurrentCapabilities(): VeroldGPUCapabilities {
    const gl = this.gl;
    
    return {
      // Texture Units
      MAX_COMBINED_TEXTURE_IMAGE_UNITS: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      MAX_TEXTURE_IMAGE_UNITS: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      MAX_VERTEX_TEXTURE_IMAGE_UNITS: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      
      // Texture Sizes
      MAX_TEXTURE_SIZE: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      MAX_CUBE_MAP_TEXTURE_SIZE: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      
      // Uniform Vectors
      MAX_VERTEX_UNIFORM_VECTORS: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      MAX_FRAGMENT_UNIFORM_VECTORS: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      MAX_VARYING_VECTORS: gl.getParameter(gl.MAX_VARYING_VECTORS),
      
      // Vertex Attributes
      MAX_VERTEX_ATTRIBS: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      
      // Render Buffer
      MAX_RENDERBUFFER_SIZE: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      
      // Viewport
      MAX_VIEWPORT_DIMS: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      
      // Aliasing
      ALIASED_POINT_SIZE_RANGE: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
      ALIASED_LINE_WIDTH_RANGE: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
      
      // Sample Buffers
      SAMPLE_BUFFERS: gl.getParameter(gl.SAMPLE_BUFFERS),
      
      // Color Bits
      RED_BITS: gl.getParameter(gl.RED_BITS),
      GREEN_BITS: gl.getParameter(gl.GREEN_BITS),
      BLUE_BITS: gl.getParameter(gl.BLUE_BITS),
      ALPHA_BITS: gl.getParameter(gl.ALPHA_BITS),
      DEPTH_BITS: gl.getParameter(gl.DEPTH_BITS),
      
      // Extensions
      EXTENSIONS: gl.getSupportedExtensions() || [],
      
      // Custom Properties
      maxAnisotropy: this.getMaxAnisotropy(),
      supportsVertexTextures: this.supportsVertexTextures(),
      supportsBoneTextures: this.supportsBoneTextures(),
      compressedTextureFormats: this.getCompressedTextureFormats(),
      
      // ReadPixels Support
      supportsReadPixels: this.supportsReadPixels(),
      readPixelsFormats: this.getReadPixelsFormats(),
      readPixelsTypes: this.getReadPixelsTypes()
    };
  }

  /**
   * Get maximum anisotropy level
   */
  private getMaxAnisotropy(): number {
    const ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
    if (ext) {
      return this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    }
    return 1;
  }

  /**
   * Check if vertex textures are supported
   */
  private supportsVertexTextures(): boolean {
    return this.gl.getParameter(this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0;
  }

  /**
   * Check if bone textures are supported
   */
  private supportsBoneTextures(): boolean {
    const ext = this.gl.getExtension('OES_texture_float');
    return ext !== null;
  }

  /**
   * Check if ReadPixels is supported
   */
  private supportsReadPixels(): boolean {
    return this.gl.getExtension('EXT_read_format') !== null;
  }

  /**
   * Get supported compressed texture formats
   */
  private getCompressedTextureFormats(): string[] {
    const formats: string[] = [];
    
    // Check for various compressed texture extensions
    const extensions = [
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_compressed_texture_etc',
      'WEBGL_compressed_texture_astc',
      'WEBGL_compressed_texture_pvrtc'
    ];
    
    extensions.forEach(extName => {
      const ext = this.gl.getExtension(extName);
      if (ext) {
        formats.push(extName);
      }
    });
    
    return formats;
  }

  /**
   * Get supported ReadPixels formats
   */
  private getReadPixelsFormats(): string[] {
    const formats: string[] = [];
    const ext = this.gl.getExtension('EXT_read_format');
    if (ext) {
      formats.push('EXT_read_format');
    }
    return formats;
  }

  /**
   * Get supported ReadPixels types
   */
  private getReadPixelsTypes(): string[] {
    const types: string[] = [];
    const ext = this.gl.getExtension('EXT_read_format');
    if (ext) {
      types.push('EXT_read_format');
    }
    return types;
  }

  /**
   * Compare current capabilities with target Verold capabilities
   */
  public compareCapabilities(): {
    matches: boolean;
    differences: Array<{parameter: string, current: any, target: any}>;
    score: number;
  } {
    const differences: Array<{parameter: string, current: any, target: any}> = [];
    let matchCount = 0;
    let totalCount = 0;

    Object.keys(this.targetCapabilities).forEach(key => {
      const targetValue = (this.targetCapabilities as any)[key];
      const currentValue = (this.currentCapabilities as any)[key];
      totalCount++;

      if (Array.isArray(targetValue)) {
        if (!Array.isArray(currentValue) || 
            targetValue.length !== currentValue.length ||
            !targetValue.every((v, i) => v === currentValue[i])) {
          differences.push({parameter: key, current: currentValue, target: targetValue});
        } else {
          matchCount++;
        }
      } else if (targetValue !== currentValue) {
        differences.push({parameter: key, current: currentValue, target: targetValue});
      } else {
        matchCount++;
      }
    });

    return {
      matches: differences.length === 0,
      differences,
      score: totalCount > 0 ? (matchCount / totalCount) * 100 : 0
    };
  }

  /**
   * Apply Verold-compatible settings to the WebGL context
   */
  public applyVeroldCompatibleSettings(): {
    success: boolean;
    appliedSettings: string[];
    warnings: string[];
  } {
    const appliedSettings: string[] = [];
    const warnings: string[] = [];
    const gl = this.gl;

    try {
      // Apply texture unit limits
      if (this.currentCapabilities.MAX_COMBINED_TEXTURE_IMAGE_UNITS < this.targetCapabilities.MAX_COMBINED_TEXTURE_IMAGE_UNITS) {
        warnings.push(`Limited combined texture units: ${this.currentCapabilities.MAX_COMBINED_TEXTURE_IMAGE_UNITS} < ${this.targetCapabilities.MAX_COMBINED_TEXTURE_IMAGE_UNITS}`);
      }

      // Apply texture size limits
      if (this.currentCapabilities.MAX_TEXTURE_SIZE < this.targetCapabilities.MAX_TEXTURE_SIZE) {
        warnings.push(`Limited texture size: ${this.currentCapabilities.MAX_TEXTURE_SIZE} < ${this.targetCapabilities.MAX_TEXTURE_SIZE}`);
      }

      // Apply viewport limits
      if (this.currentCapabilities.MAX_VIEWPORT_DIMS[0] < this.targetCapabilities.MAX_VIEWPORT_DIMS[0]) {
        warnings.push(`Limited viewport width: ${this.currentCapabilities.MAX_VIEWPORT_DIMS[0]} < ${this.targetCapabilities.MAX_VIEWPORT_DIMS[0]}`);
      }

      // Enable required extensions
      this.targetCapabilities.EXTENSIONS.forEach(extName => {
        const ext = gl.getExtension(extName);
        if (ext) {
          appliedSettings.push(`Enabled extension: ${extName}`);
        } else {
          warnings.push(`Extension not available: ${extName}`);
        }
      });

      // Apply anisotropic filtering if available
      if (this.currentCapabilities.maxAnisotropy >= 16) {
        appliedSettings.push('Anisotropic filtering: 16x');
      } else if (this.currentCapabilities.maxAnisotropy > 1) {
        appliedSettings.push(`Anisotropic filtering: ${this.currentCapabilities.maxAnisotropy}x (limited)`);
        warnings.push(`Limited anisotropic filtering: ${this.currentCapabilities.maxAnisotropy}x < 16x`);
      }

      // Apply vertex texture support
      if (this.currentCapabilities.supportsVertexTextures) {
        appliedSettings.push('Vertex textures: enabled');
      } else {
        warnings.push('Vertex textures not supported');
      }

      // Apply bone texture support
      if (this.currentCapabilities.supportsBoneTextures) {
        appliedSettings.push('Bone textures: enabled');
      } else {
        warnings.push('Bone textures not supported');
      }

      // Apply ReadPixels support
      if (this.currentCapabilities.supportsReadPixels) {
        appliedSettings.push('ReadPixels: enabled');
      } else {
        warnings.push('ReadPixels not supported');
      }

      return {
        success: true,
        appliedSettings,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        appliedSettings: [],
        warnings: [`Failed to apply Verold settings: ${error}`]
      };
    }
  }

  /**
   * Get current capabilities
   */
  public getCurrentCapabilities(): VeroldGPUCapabilities {
    return this.currentCapabilities;
  }

  /**
   * Get target capabilities
   */
  public getTargetCapabilities(): VeroldGPUCapabilities {
    return this.targetCapabilities;
  }

  /**
   * Log capabilities comparison
   */
  public logCapabilitiesComparison(): void {
    const comparison = this.compareCapabilities();
    const settings = this.applyVeroldCompatibleSettings();

    console.log('🔧 GPU Capabilities Analysis:');
    console.log(`Compatibility Score: ${comparison.score.toFixed(1)}%`);
    console.log(`Matches Target: ${comparison.matches ? '✅ Yes' : '❌ No'}`);

    if (comparison.differences.length > 0) {
      console.log('\n⚠️ Capability Differences:');
      comparison.differences.forEach(diff => {
        console.log(`  ${diff.parameter}: ${diff.current} (current) vs ${diff.target} (target)`);
      });
    }

    if (settings.appliedSettings.length > 0) {
      console.log('\n✅ Applied Settings:');
      settings.appliedSettings.forEach(setting => {
        console.log(`  ${setting}`);
      });
    }

    if (settings.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      settings.warnings.forEach(warning => {
        console.log(`  ${warning}`);
      });
    }
  }
}

/**
 * Initialize GPU capabilities manager for Three.js renderer
 */
export function initializeVeroldGPUCompatibility(renderer: THREE.WebGLRenderer): GPUCapabilitiesManager {
  const gl = renderer.getContext();
  const manager = new GPUCapabilitiesManager(gl);
  
  console.log('🔧 Agent 2: Initializing Verold GPU compatibility...');
  manager.logCapabilitiesComparison();
  
  return manager;
}

/**
 * Apply Verold-compatible renderer settings
 */
export function applyVeroldRendererSettings(renderer: THREE.WebGLRenderer): void {
  const gl = renderer.getContext();
  
  // Apply Verold-compatible settings
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  
  // Set pixel ratio based on capabilities
  const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  const maxPixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(maxPixelRatio);
  
  // Enable antialiasing if supported
  if (gl.getParameter(gl.SAMPLE_BUFFERS) > 0) {
    // Note: antialias is set in Canvas component props, not on renderer
    console.log('🔧 Agent 2: Antialiasing supported by GPU');
  }
  
  console.log('🔧 Agent 2: Applied Verold-compatible renderer settings');
}
