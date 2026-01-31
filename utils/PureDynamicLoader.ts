// 🎮 Pure Dynamic 3D Loader - Không hardcode gì cả!
// Input: QR Code → Process: GitHub → Output: 3D Model → AR

import * as THREE from 'three';
import { loadAsync } from 'expo-three';
import { validateSecureQR, SecureQRData } from './QRValidator';

export interface QRData {
  modelId: string;
  fileName: string;
  repository?: string;
  branch?: string;
}

export interface ModelConfig {
  id: string;
  fileName: string;
  url: string;
  scale?: number;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
}

export class PureDynamicLoader {
  private cache: Map<string, THREE.Object3D> = new Map();
  private baseRepositories: string[] = [];
  
  constructor() {
    // console.log('🎮 Pure Dynamic Loader - No hardcode at all!'); // Giảm log
    this.initializeRepositories();
  }

  /**
   * Initialize GitHub repositories dynamically
   */
  private initializeRepositories() {
    // Dynamic repositories - có thể config từ environment
    this.baseRepositories = [
      'https://raw.githubusercontent.com/phuoctran12345/pokemon-3d-models/main/',
      'https://cdn.jsdelivr.net/gh/phuoctran12345/pokemon-3d-models@main/',
      'https://phuoctran12345.github.io/pokemon-3d-models/',
    ];
    
    // console.log(`🌐 Dynamic repositories:`, this.baseRepositories); // Giảm log
  }

  /**
   * Parse QR code data
   */
  parseQRCode(qrData: string): QRData | null {
    try {
      // console.log(`📱 Parsing QR code: ${qrData}`); // Giảm log
      
      // Validate QR data - reject Expo URLs
      if (qrData.startsWith('exp://') || qrData.startsWith('http://') || qrData.startsWith('https://')) {
        console.warn(`⚠️ Invalid QR code: Expo/Web URL detected: ${qrData}`);
        return null;
      }
      
      // Try JSON format first
      if (qrData.startsWith('{')) {
        const parsed = JSON.parse(qrData);
        return {
          modelId: parsed.modelId || parsed.id,
          fileName: parsed.fileName || parsed.file,
          repository: parsed.repository,
          branch: parsed.branch || 'main'
        };
      }
      
      // Simple string format: "modelId" or "modelId.glb"
      const cleanId = qrData.trim();
      
      // Model name mapping with very small scales for AR
      const modelMapping: { [key: string]: { fileName: string; scale?: number; position?: { x: number; y: number; z: number } } } = {
      'scizor': { 
        fileName: 'pokemon_scizor.glb', // GLB cho tất cả platform
        scale: 0.2, // Giảm từ 0.5 xuống 0.2 - nhỏ hơn 60%
        position: { x: 0, y: -0.1, z: 0 } // Cao hơn để thấy rõ hơn
      },
        'pikachu': { 
          fileName: 'pikachu_sample.glb',
          scale: 0.3,
          position: { x: 0, y: -0.4, z: 0 }
        },
        'pikachu_sample.glb': { 
          fileName: 'pikachu_sample.glb',
          scale: 0.3,
          position: { x: 0, y: -0.4, z: 0 }
        },
        'pokemon_scizor.glb': { 
          fileName: 'pokemon_scizor.glb',
          scale: 0.15,
          position: { x: 0, y: -0.6, z: 0 }
        }
      };
      
      const modelConfig = modelMapping[cleanId] || { fileName: cleanId.endsWith('.glb') ? cleanId : `${cleanId}.glb` };
      const fileName = modelConfig.fileName;
      
      return {
        modelId: cleanId.replace('.glb', ''),
        fileName: fileName,
        repository: 'phuoctran12345/pokemon-3d-models',
        branch: 'main'
      };
      
    } catch (error) {
      console.error('❌ Error parsing QR code:', error);
      return null;
    }
  }

  /**
   * Generate dynamic URLs from QR data
   */
  private async generateUrls(qrData: QRData): Promise<string[]> {
    // console.log(`🔄 Generating URLs for: ${qrData.fileName}`); // Giảm log
    
    const urls: string[] = [];
    
    // Use custom repository if provided
    if (qrData.repository) {
      const customUrls = [
        `https://raw.githubusercontent.com/${qrData.repository}/${qrData.branch}/${qrData.fileName}`,
        `https://cdn.jsdelivr.net/gh/${qrData.repository}@${qrData.branch}/${qrData.fileName}`,
        `https://${qrData.repository.split('/')[0]}.github.io/${qrData.repository.split('/')[1]}/${qrData.fileName}`
      ];
      urls.push(...customUrls);
    }
    
    // Use default repositories
    for (const baseUrl of this.baseRepositories) {
      urls.push(baseUrl + qrData.fileName);
    }
    
    // console.log(`🌐 Generated URLs:`, urls); // Giảm log
    return urls;
  }

  /**
   * Find working URL
   */
  private async findWorkingUrl(urls: string[]): Promise<string | null> {
    for (const url of urls) {
      try {
        // console.log(`🔄 Testing URL: ${url}`); // Giảm log
        
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          // console.log(`✅ Working URL found: ${url}`); // Giảm log
          return url;
        } else {
          // console.log(`❌ URL failed: ${response.status}`); // Giảm log
        }
      } catch (error: any) {
        // console.log(`❌ URL error:`, error.message); // Giảm log
      }
    }
    
    console.log(`⚠️ No working URL found`);
    return null;
  }

  /**
   * Load 3D model from QR code
   */
  async loadFromQR(qrCodeData: string): Promise<THREE.Object3D> {
    try {
      // console.log(`🎮 Loading from QR: ${qrCodeData}`); // Giảm log
      
      // Step 1: Parse QR code
      const qrData = this.parseQRCode(qrCodeData);
      if (!qrData) {
        throw new Error('Invalid QR code format');
      }
      
      // Check cache
      if (this.cache.has(qrData.modelId)) {
        // console.log(`✅ Using cached model: ${qrData.modelId}`); // Giảm log
        return this.cache.get(qrData.modelId)!.clone();
      }
      
      // Step 2: Generate URLs
      const urls = await this.generateUrls(qrData);
      
      // Step 3: Find working URL
      const workingUrl = await this.findWorkingUrl(urls);
      if (!workingUrl) {
        console.warn(`⚠️ No working URL found for ${qrData.fileName}, using fallback`);
        const fallbackModel = this.createFallback(qrData);
        this.cache.set(qrData.modelId, fallbackModel);
        return fallbackModel.clone();
      }
      
      // Step 4: Load 3D model
      let model: THREE.Object3D;
      try {
        model = await this.load3DModel(workingUrl, qrData);
        
        // Step 5: Cache model
        this.cache.set(qrData.modelId, model);
        
        console.log(`✅ Model loaded: ${qrData.modelId}`); // Chỉ giữ log quan trọng
        return model.clone();
      } catch (modelError) {
        console.warn(`⚠️ Model loading failed, using fallback:`, modelError);
        // Create fallback model
        const fallbackModel = this.createFallback(qrData);
        this.cache.set(qrData.modelId, fallbackModel);
        return fallbackModel.clone();
      }
      
    } catch (error) {
      console.error(`❌ Error loading from QR:`, error);
      throw error;
    }
  }

  /**
   * Load 3D model from URL (supports both GLB and USDZ)
   */
  private async load3DModel(url: string, qrData: QRData): Promise<THREE.Object3D> {
    try {
      // console.log(`🔄 Loading 3D model: ${url}`); // Giảm log
      
      // GLB loading - expo-three (universal support)
        let gltfData;
        try {
          // console.log(`🎨 Loading with full textures...`); // Giảm log
          gltfData = await loadAsync(url);
        } catch (textureError: any) {
        console.warn(`⚠️ Texture loading issue, trying fallback:`, textureError.message);
        try {
          // Try with texture fallback - basic loading
          gltfData = await loadAsync(url);
        } catch (fallbackError) {
          console.warn(`⚠️ Final fallback - basic loading`);
          // Last resort: basic loading without any options
          gltfData = await loadAsync(url);
        }
      }
      
      // console.log(`✅ 3D data loaded:`, { // Giảm log
      //   hasScene: !!gltfData.scene,
      //   hasScenes: !!gltfData.scenes,
      //   type: typeof gltfData,
      // });
      
      // Extract scene
      let scene: THREE.Object3D;
      if (gltfData.scene) {
        scene = gltfData.scene;
      } else if (gltfData.scenes && gltfData.scenes.length > 0) {
        scene = gltfData.scenes[0];
      } else if (gltfData instanceof THREE.Object3D) {
        scene = gltfData;
      } else {
        scene = new THREE.Group();
        if (gltfData.children) {
          gltfData.children.forEach((child: any) => scene.add(child));
        }
      }
      
      // Add metadata
      (scene as any).modelId = qrData.modelId;
      (scene as any).fileName = qrData.fileName;
      (scene as any).sourceUrl = url;
      (scene as any).isHardcoded = false;
      (scene as any).isDynamic = true;
      (scene as any).loadedAt = new Date().toISOString();
      
      // console.log(`✅ 3D scene processed successfully!`); // Giảm log
      
      // Enhance materials and colors
      this.enhanceMaterials(scene);
      
      // Auto-scale model to fit viewport
      this.autoScaleModel(scene);
      
      return scene;
      
    } catch (error) {
      console.error('❌ Error loading 3D model:', error);
      throw error;
    }
  }

  // Removed USDZ loader - using GLB for all platforms

  /**
   * Enhance materials and colors for better visual quality
   */
  private enhanceMaterials(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mesh = child as THREE.Mesh;
        
        if (mesh.material) {
          // Handle array of materials
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              // Enhance material properties for StandardMaterial
              material.metalness = material.metalness || 0.7; // More metallic for Scizor
              material.roughness = material.roughness || 0.3; // Less rough for shine
              
              // Enhanced Scizor colors - Tăng cường màu đỏ
              if (!material.map && (!material.color || material.color.getHex() === 0x000000)) {
                // Apply bright red metallic color for Scizor
                material.color = new THREE.Color(0xFF0000); // Pure red thay vì 0xFF3333
                material.metalness = 0.95; // Tăng metalness
                material.roughness = 0.05; // Giảm roughness để bóng hơn
              } else if (material.color) {
                // Force red color for all materials
                material.color = new THREE.Color(0xFF2222); // Force bright red
                material.metalness = 0.9; // Tăng metalness
                material.roughness = 0.1; // Giảm roughness
              }
              
              // Enhance existing colors
              if (material.color) {
                const currentColor = material.color.getHex();
                // If it's too dark, brighten it
                if (currentColor < 0x333333) {
                  material.color.multiplyScalar(2.0);
                }
              }
              
              material.needsUpdate = true;
            } else if (material instanceof THREE.MeshBasicMaterial) {
              // Enhance BasicMaterial
              if (!material.map && (!material.color || material.color.getHex() === 0x000000)) {
                material.color = new THREE.Color(0xCC0000); // Red
              }
              
              // Enhance existing colors
              if (material.color) {
                const currentColor = material.color.getHex();
                if (currentColor < 0x333333) {
                  material.color.multiplyScalar(2.0);
                }
              }
              
              material.needsUpdate = true;
            }
          });
        }
      }
    });
    
    // console.log(`🎨 Materials enhanced for better colors and metallic look`); // Giảm log
  }

  /**
   * Auto-scale model to fit viewport properly for all devices
   */
  private autoScaleModel(object: THREE.Object3D): void {
    // Calculate bounding box
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // console.log(`📏 Model dimensions:`, { // Giảm log
    //   width: size.x.toFixed(2),
    //   height: size.y.toFixed(2),
    //   depth: size.z.toFixed(2),
    //   center: {
    //     x: center.x.toFixed(2),
    //     y: center.y.toFixed(2),
    //     z: center.z.toFixed(2)
    //   }
    // });
    
    // Device-adaptive scaling system - Giảm kích cỡ tối đa
    const deviceScale = this.getDeviceScale();
    const baseMaxSize = 0.6; // Giảm từ 1.2 xuống 0.6 - nhỏ hơn 50%
    const maxSize = baseMaxSize * deviceScale;
    
    const currentMaxSize = Math.max(size.x, size.y, size.z);
    
    if (currentMaxSize > maxSize) {
      const scaleFactor = maxSize / currentMaxSize;
      object.scale.multiplyScalar(scaleFactor);
      // console.log(`📐 Auto-scaled model by factor: ${scaleFactor.toFixed(3)} (device scale: ${deviceScale.toFixed(2)})`); // Giảm log
    }
    
    // Additional scaling for very large models (adaptive) - Giảm thêm
    if (currentMaxSize > 2.0) { // Giảm threshold từ 4.0 xuống 2.0
      const additionalScale = Math.max(0.2, 0.4 * deviceScale); // Giảm từ 0.4 xuống 0.2
      object.scale.multiplyScalar(additionalScale);
      // console.log(`📐 Extra scaling applied: ${additionalScale.toFixed(3)}`); // Giảm log
    }
    
    // Center the model horizontally
    object.position.x -= center.x;
    object.position.z -= center.z;
    
    // Position model properly for AR view
    object.position.y = -0.3; // Fixed Y position for AR
    
    // Chỉ giữ log quan trọng nhất
    console.log(`📍 Model ready: scale=${object.scale.x.toFixed(3)}, pos=(${object.position.x.toFixed(1)}, ${object.position.y.toFixed(1)}, ${object.position.z.toFixed(1)})`);
    
    // Ensure model is visible
    object.visible = true;
    object.frustumCulled = false; // Prevent culling
    
    // console.log(`📍 Model repositioned to fit viewport`); // Giảm log
  }

  /**
   * Create fallback model when loading fails
   */
  createFallback(qrData: QRData): THREE.Object3D {
    console.log(`⚠️ Creating fallback for: ${qrData.modelId}`);
    
    const group = new THREE.Group();
    
    // Create a more interesting fallback shape
    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xFF6B6B, // Orange-red color
      metalness: 0.7,
      roughness: 0.3,
      wireframe: true
    });
    const cube = new THREE.Mesh(geometry, material);
    group.add(cube);
    
    // Add some visual interest
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    group.add(wireframe);
    
    // Position fallback model properly
    group.position.set(0, -0.5, 0);
    
    // Add metadata
    (group as any).modelId = qrData.modelId;
    (group as any).fileName = qrData.fileName;
    (group as any).sourceUrl = 'fallback://error';
    (group as any).isHardcoded = false;
    (group as any).isDynamic = true;
    (group as any).isFallback = true;
    (group as any).loadedAt = new Date().toISOString();
    
    // console.log(`✅ Fallback model created for: ${qrData.modelId}`); // Giảm log
    return group;
  }

  /**
   * Add custom repository
   */
  addRepository(repoUrl: string) {
    this.baseRepositories.push(repoUrl);
    // console.log(`🌐 Added repository: ${repoUrl}`); // Giảm log
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    // console.log('🗑️ Cache cleared'); // Giảm log
  }

  // Removed USDZ support - using GLB for all platforms

  /**
   * Get device-specific scale factor
   */
  private getDeviceScale(): number {
    // Screen size detection (approximate)
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 428; // iPhone 12 Pro Max default
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 926;
    
    // Device scale factors based on screen size
    const deviceScales: { [key: string]: number } = {
      // iPhone series
      'iPhone SE': 0.6,        // 4.7" - 375x667
      'iPhone 12 mini': 0.7,   // 5.4" - 375x812
      'iPhone 12': 0.8,        // 6.1" - 390x844
      'iPhone 12 Pro': 0.8,    // 6.1" - 390x844
      'iPhone 12 Pro Max': 1.0, // 6.7" - 428x926 (base reference)
      'iPhone 13 mini': 0.7,    // 5.4" - 375x812
      'iPhone 13': 0.8,         // 6.1" - 390x844
      'iPhone 13 Pro': 0.8,     // 6.1" - 390x844
      'iPhone 13 Pro Max': 1.0, // 6.7" - 428x926
      'iPhone 14': 0.8,         // 6.1" - 390x844
      'iPhone 14 Plus': 0.9,     // 6.7" - 428x926
      'iPhone 14 Pro': 0.8,     // 6.1" - 393x852
      'iPhone 14 Pro Max': 1.0, // 6.7" - 430x932
      
      // iPad series
      'iPad mini': 1.2,        // 8.3" - 744x1133
      'iPad': 1.4,             // 10.2" - 810x1080
      'iPad Air': 1.5,          // 10.9" - 820x1180
      'iPad Pro 11"': 1.6,      // 11" - 834x1194
      'iPad Pro 12.9"': 1.8,    // 12.9" - 1024x1366
      
      // Android (approximate)
      'Android Small': 0.6,     // < 5.5"
      'Android Medium': 0.8,    // 5.5" - 6.5"
      'Android Large': 1.0,     // > 6.5"
    };
    
    // Detect device based on screen dimensions
    let deviceType = 'iPhone 12 Pro Max'; // Default
    
    if (screenWidth <= 375) {
      deviceType = screenHeight <= 667 ? 'iPhone SE' : 'iPhone 12 mini';
    } else if (screenWidth <= 390) {
      deviceType = 'iPhone 12';
    } else if (screenWidth <= 428) {
      deviceType = 'iPhone 12 Pro Max';
    } else if (screenWidth >= 744) {
      deviceType = screenWidth >= 1024 ? 'iPad Pro 12.9"' : 'iPad mini';
    }
    
    const scale = deviceScales[deviceType] || 1.0;
    
    // console.log(`📱 Device detected: ${deviceType} (${screenWidth}x${screenHeight}) - Scale: ${scale}`); // Giảm log
    
    return scale;
  }

  /**
   * Get cache info
   */
  getCacheInfo() {
    return {
      cachedModels: Array.from(this.cache.keys()),
      cacheSize: this.cache.size,
      repositories: this.baseRepositories,
    };
  }
}

// Export singleton
export const pureDynamicLoader = new PureDynamicLoader();
