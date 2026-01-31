import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert, Dimensions, Platform, PanResponder } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer, loadAsync } from 'expo-three';
import * as THREE from 'three';
import { Asset } from 'expo-asset';
// ✅ ORBITCONTROLS KHÔNG TƯƠNG THÍCH VỚI REACT NATIVE
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { getGLBModelFromQRData, getGLBModelConfig } from '../utils/modelData';

const DEBUG = false;

interface PokemonARViewerProps {
  onClose: () => void;
}

const PokemonARViewer: React.FC<PokemonARViewerProps> = ({ onClose }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [modelInfo, setModelInfo] = useState<string>('');
  const [showDebugControls, setShowDebugControls] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef(new THREE.Clock());
  // ✅ ORBITCONTROLS KHÔNG TƯƠNG THÍCH VỚI REACT NATIVE
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  const [animationFeedback, setAnimationFeedback] = useState<string>('');
  const [showGestureHint, setShowGestureHint] = useState<boolean>(true);

  // ✅ PANRESPONDER CHO XOAY 360 ĐỘ VÀ ZOOM - CHUYÊN NGHIỆP!
  const [previousRotationX, setPreviousRotationX] = useState(0);
  const [previousRotationY, setPreviousRotationY] = useState(0);
  const [previousScale, setPreviousScale] = useState(1);
  const [isRotating, setIsRotating] = useState(false);
  const [isZooming, setIsZooming] = useState(false);

  // ✅ PANRESPONDER CHO 3D INTERACTION - XỬ LÝ CỬ CHỈ LIÊN TỤC!
  if (DEBUG) console.log('🎮 Using PanResponder for continuous gestures...');

  // ✅ PANRESPONDER CHO 3D INTERACTION - CHUYÊN NGHIỆP!
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => {
      if (DEBUG) console.log('🎮 PanResponder: onStartShouldSetPanResponder called');
      return true;
    },
    onMoveShouldSetPanResponder: () => {
      if (DEBUG) console.log('🎮 PanResponder: onMoveShouldSetPanResponder called');
      return true;
    },
    
    onPanResponderGrant: (evt) => {
      if (DEBUG) {
        console.log('🎮 PanResponder: Interaction started');
        console.log('🎮 PanResponder: Touch event details:', {
          touches: evt.nativeEvent.touches?.length || 0,
          timestamp: evt.nativeEvent.timestamp,
          target: evt.target
        });
      }
      
      // ✅ ẨN GESTURE HINT SAU KHI USER TƯƠNG TÁC
      if (showGestureHint) {
        if (DEBUG) console.log(`🎯 Hiding gesture hint after user interaction`);
        setShowGestureHint(false);
      }
      
      // ✅ SETUP INITIAL STATE
      setIsRotating(true);
      setIsZooming(false);
      if (DEBUG) console.log('🔄 PanResponder ready for interaction');
    },
    
    onPanResponderMove: (evt, gestureState) => {
      if (!modelRef.current) {
        if (DEBUG) console.log('❌ PanResponder: modelRef.current is null');
        return;
      }
      
      const touches = evt.nativeEvent.touches;
      if (DEBUG) console.log(`🎮 PanResponder move: ${touches.length} fingers, dx: ${gestureState.dx.toFixed(2)}, dy: ${gestureState.dy.toFixed(2)}`);
      
      if (touches.length === 1) {
        // ✅ THUẬT TOÁN XOAY 360 ĐỘ - SINGLE TOUCH
        if (DEBUG) console.log('🔄 Single touch detected - applying rotation');
        const ROTATION_SENSITIVITY = 0.01;
        const deltaX = gestureState.dx * ROTATION_SENSITIVITY;
        const deltaY = gestureState.dy * ROTATION_SENSITIVITY;
        
        const currentRotationY = previousRotationY + deltaX;
        const currentRotationX = previousRotationX + deltaY;
        
        // ✅ GIỚI HẠN GÓC XOAY DỌC
        const clampedRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, currentRotationX));
        
        // ✅ CẬP NHẬT MODEL
        modelRef.current.rotation.y = currentRotationY;
        modelRef.current.rotation.x = clampedRotationX;
        
        if (DEBUG) console.log(`🔄 Rotation applied: X=${clampedRotationX.toFixed(3)}, Y=${currentRotationY.toFixed(3)}`);
        
      } else if (touches.length === 2) {
        // ✅ THUẬT TOÁN ZOOM IN/OUT - MULTI TOUCH
        if (DEBUG) console.log('🔍 Multi touch detected - applying zoom');
        const currentDistance = Math.sqrt(
          Math.pow(touches[0].pageX - touches[1].pageX, 2) + 
          Math.pow(touches[0].pageY - touches[1].pageY, 2)
        );
        
        // Tính scale dựa trên distance (simplified)
        const scale = Math.max(0.5, Math.min(3.0, currentDistance / 200));
        const originalScale = (modelRef.current as any).originalScale || 0.0129265882742369;
        const targetScale = originalScale * scale;
        
        // ✅ CẬP NHẬT MODEL
        modelRef.current.scale.setScalar(targetScale);
        
        if (DEBUG) console.log(`🔍 Zoom applied: ${scale.toFixed(2)}x, Scale: ${targetScale.toFixed(3)}`);
      }
    },
    
    onPanResponderRelease: (evt) => {
      if (DEBUG) console.log('🎮 PanResponder: Interaction ended');
      
      // ✅ LƯU TRẠNG THÁI TRƯỚC ĐÓ KHI GESTURE KẾT THÚC
      if (modelRef.current) {
        setPreviousRotationX(modelRef.current.rotation.x);
        setPreviousRotationY(modelRef.current.rotation.y);
        setPreviousScale(modelRef.current.scale.x);
        if (DEBUG) console.log(`💾 Saved state: rotationX=${modelRef.current.rotation.x.toFixed(3)}, rotationY=${modelRef.current.rotation.y.toFixed(3)}, scale=${modelRef.current.scale.x.toFixed(3)}`);
      }
      
      setIsRotating(false);
      setIsZooming(false);
    }
  });

  // ✅ TC6.2: SCREEN COMPATIBILITY
  const screenData = Dimensions.get('window');
  const isIOS = Platform.OS === 'ios';
  const hasNotch = screenData.height > 800; // Approximate notch detection

  // ✅ HELPER FUNCTION ĐỂ TÍNH KHOẢNG CÁCH GIỮA 2 TOUCH
  const getDistance = (touch1: any, touch2: any) => {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // ✅ DEBUG TEXTURE LOADING
  const debugTextureLoading = (model: THREE.Object3D) => {
    console.log('🔍 Debugging texture loading...');
    let textureCount = 0;
    let meshCount = 0;
    
    model.traverse((child: any) => {
      if (child.isMesh) {
        meshCount++;
        console.log(`📦 Mesh: ${child.name || 'unnamed'}`, {
          material: child.material?.type || 'no material',
          hasMap: !!child.material?.map,
          hasNormalMap: !!child.material?.normalMap,
          hasRoughnessMap: !!child.material?.roughnessMap,
          hasMetalnessMap: !!child.material?.metalnessMap,
          mapSize: child.material?.map ? `${child.material.map.image?.width}x${child.material.map.image?.height}` : 'no map',
          mapFormat: child.material?.map?.format || 'no format'
        });
        
        if (child.material?.map) {
          textureCount++;
          console.log('🖼️ Texture details:', {
            width: child.material.map.image?.width,
            height: child.material.map.image?.height,
            format: child.material.map.format,
            type: child.material.map.type,
            needsUpdate: child.material.map.needsUpdate
          });
        }
      }
    });
    
    console.log(`📊 Texture Debug Summary: ${textureCount} textures found in ${meshCount} meshes`);
    return { textureCount, meshCount };
  };

  // ✅ FORCE TEXTURE LOADING FROM GLTF DATA
  const forceTextureLoading = (gltf: any, model: THREE.Object3D) => {
    console.log('🔄 Force loading textures from GLTF data...');
    
    if (!gltf.textures || !gltf.images) {
      console.log('❌ No textures or images found in GLTF');
      return;
    }
    
    // ✅ MANUALLY ASSIGN TEXTURES TO MATERIALS
    model.traverse((child: any) => {
      if (child.isMesh && child.material) {
        console.log(`🔧 Processing mesh: ${child.name}`);
        
        // ✅ GET MATERIAL INDEX FROM MESH
        const materialIndex = child.material.userData?.materialIndex || 0;
        console.log(`🎨 Material index: ${materialIndex}`);
        
        // ✅ CHECK IF GLTF HAS TEXTURE DATA
        if (gltf.textures && gltf.textures.length > 0) {
          const textureData = gltf.textures[0]; // First texture
          console.log(`🖼️ Texture data:`, textureData);
          
          if (textureData && gltf.images && gltf.images[textureData.source]) {
            const imageData = gltf.images[textureData.source];
            console.log(`📷 Image data:`, imageData);
            
            // ✅ CREATE TEXTURE FROM GLTF DATA
            try {
              const texture = new THREE.Texture();
              texture.image = imageData;
              texture.needsUpdate = true;
              texture.flipY = false;
              
              // ✅ ASSIGN TO MATERIAL
              child.material.map = texture;
              child.material.needsUpdate = true;
              
              console.log(`✅ Texture assigned to mesh: ${child.name}`);
            } catch (error) {
              console.error(`❌ Failed to create texture for mesh: ${child.name}`, error);
            }
          }
        }
      }
    });
  };

  // ✅ MANUAL TEXTURE LOADING FROM SEPARATE PNG FILE
  const loadTextureFromPNG = async (model: THREE.Object3D) => {
    console.log('🔄 Loading texture from separate PNG file...');
    
    try {
      // ✅ LOAD FOX.PNG TEXTURE
      const textureAsset = Asset.fromModule(require('../assets/models/Fox.png'));
      await textureAsset.downloadAsync();
      
      console.log('✅ Fox.png texture loaded:', textureAsset.uri);
      
      // ✅ CREATE THREE.JS TEXTURE
      const texture = new THREE.Texture();
      texture.image = textureAsset;
      texture.needsUpdate = true;
      texture.flipY = false;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      
      console.log('✅ Three.js texture created');
      
      // ✅ ASSIGN TEXTURE TO ALL MESHES
      model.traverse((child: any) => {
        if (child.isMesh && child.material) {
          console.log(`🎨 Assigning texture to mesh: ${child.name}`);
          
          // ✅ ASSIGN TEXTURE TO MATERIAL
          child.material.map = texture;
          child.material.needsUpdate = true;
          
          // ✅ ENSURE MATERIAL IS VISIBLE
          child.material.transparent = false;
          child.material.opacity = 1.0;
          
          console.log(`✅ Texture assigned to mesh: ${child.name}`);
        }
      });
      
      console.log('✅ All meshes updated with texture');
      
    } catch (error) {
      console.error('❌ Failed to load texture from PNG:', error);
    }
  };

  // ✅ TC3.1: RAYCASTING FOR TOUCH ANIMATION TRIGGER
  const performRaycasting = (touchX: number, touchY: number, screenWidth: number, screenHeight: number) => {
    if (!modelRef.current || !cameraRef.current || !rendererRef.current) return null;

    // Convert screen coordinates to normalized device coordinates (-1 to +1)
    const mouse = new THREE.Vector2();
    mouse.x = (touchX / screenWidth) * 2 - 1;
    mouse.y = -(touchY / screenHeight) * 2 + 1;

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // Check intersection with model
    const intersects = raycaster.intersectObject(modelRef.current, true);

    if (intersects.length > 0) {
      console.log('🎯 Model touched! Triggering animation...');
      return intersects[0];
    }
    return null;
  };

  // ✅ TC3.1: TRIGGER ANIMATION ON TOUCH
  const triggerTouchAnimation = (animationName: string = 'hit') => {
    if (!mixerRef.current || !modelRef.current) return;

    const anyModel = modelRef.current as any;
    const clips = anyModel.animations || [];

    if (clips.length > 0) {
      // Find animation clip
      const clip = clips.find((c: any) =>
        c.name?.toLowerCase().includes(animationName.toLowerCase())
      ) || clips[Math.floor(Math.random() * clips.length)]; // Random if not found

      // Stop current action and play new one
      mixerRef.current.stopAllAction();
      const action = mixerRef.current.clipAction(clip);
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();

      setCurrentAnimation(animationName);
      setAnimationFeedback(`🎯 ${animationName.toUpperCase()}!`);
      console.log(`🎬 Playing touch animation: ${clip.name || animationName}`);

      // Clear feedback after short time
      setTimeout(() => setAnimationFeedback(''), 1000);

      // Return to idle after animation
      setTimeout(() => {
        if (mixerRef.current) {
          const idleClip = clips.find((c: any) => c.name?.toLowerCase().includes('idle')) || clips[0];
          const idleAction = mixerRef.current.clipAction(idleClip);
          idleAction.reset();
          idleAction.play();
          setCurrentAnimation('idle');
        }
      }, clip.duration * 1000 || 2000);
    }
  };

  // ✅ TC3.2: SWIPE GESTURE DETECTION AND THROW ANIMATION
  const detectSwipeGesture = (startX: number, startY: number, endX: number, endY: number, duration: number) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / duration; // pixels per ms

    // Swipe thresholds
    const minDistance = 100; // minimum swipe distance
    const minVelocity = 0.5; // minimum swipe velocity

    if (distance > minDistance && velocity > minVelocity) {
      // Determine swipe direction
      const angle = Math.atan2(deltaY, deltaX);
      const direction = {
        horizontal: Math.abs(deltaX) > Math.abs(deltaY),
        vertical: Math.abs(deltaY) > Math.abs(deltaX),
        right: deltaX > 0,
        left: deltaX < 0,
        up: deltaY < 0,
        down: deltaY > 0
      };

      console.log(`🏐 Swipe detected! Distance: ${distance.toFixed(2)}, Velocity: ${velocity.toFixed(2)}, Direction:`, direction);

      // Trigger throw animation based on direction
      if (direction.horizontal) {
        triggerThrowAnimation(direction.right ? 'throw_right' : 'throw_left', velocity);
      } else if (direction.vertical) {
        triggerThrowAnimation(direction.up ? 'throw_up' : 'throw_down', velocity);
      }

      return true;
    }
    return false;
  };

  // ✅ TC3.2: TRIGGER THROW ANIMATION
  const triggerThrowAnimation = (throwType: string, velocity: number) => {
    if (!mixerRef.current || !modelRef.current) return;

    const anyModel = modelRef.current as any;
    const clips = anyModel.animations || [];

    if (clips.length > 0) {
      // Find throw animation or use attack/fly animation
      const throwClip = clips.find((c: any) =>
        c.name?.toLowerCase().includes('attack') ||
        c.name?.toLowerCase().includes('fly') ||
        c.name?.toLowerCase().includes('jump')
      ) || clips[Math.floor(Math.random() * clips.length)];

      // Stop current action and play throw animation
      mixerRef.current.stopAllAction();
      const action = mixerRef.current.clipAction(throwClip);
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;

      // Adjust playback speed based on swipe velocity
      const speedMultiplier = Math.min(Math.max(velocity / 2, 0.5), 3.0);
      action.setEffectiveTimeScale(speedMultiplier);
      action.play();

      setCurrentAnimation(throwType);
      setAnimationFeedback(`🏐 ${throwType.replace('_', ' ').toUpperCase()}!`);
      console.log(`🎬 Playing throw animation: ${throwClip.name || throwType} (speed: ${speedMultiplier.toFixed(2)}x)`);

      // Clear feedback after animation
      setTimeout(() => setAnimationFeedback(''), 1500);

      // Add visual feedback - temporary scale effect
      if (modelRef.current) {
        const originalScale = (modelRef.current as any).originalScale || 0.6;
        const scaleEffect = originalScale * (1 + velocity * 0.1);
        modelRef.current.scale.setScalar(scaleEffect);

        // Return to normal scale
        setTimeout(() => {
          if (modelRef.current) {
            modelRef.current.scale.setScalar(originalScale);
          }
        }, 200);
      }

      // Return to idle after animation
      setTimeout(() => {
        if (mixerRef.current) {
          const idleClip = clips.find((c: any) => c.name?.toLowerCase().includes('idle')) || clips[0];
          const idleAction = mixerRef.current.clipAction(idleClip);
          idleAction.reset();
          idleAction.play();
          setCurrentAnimation('idle');
        }
      }, (throwClip.duration * 1000 / speedMultiplier) || 1500);
    }
  };

  // ✅ TOUCH HANDLERS ĐÃ ĐƯỢC THAY THẾ BẰNG PANRESPONDER

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      if (modelRef.current) {
        const { velocityX } = event.nativeEvent;
        const momentum = velocityX * 0.001; // ✅ MOMENTUM MƯỢT MÀ CHO 360 ĐỘ

        // ✅ THÊM MOMENTUM SAU KHI THẢ TAY
        modelRef.current.rotation.y += momentum;

        // ✅ RESET FLAG SAU 2 GIÂY
        setTimeout(() => {
          if (modelRef.current) {
            (modelRef.current as any).isUserRotating = false;
            // console.log(`🔄 Auto rotation resumed`); // ❌ BỚT LOG
          }
        }, 2000);

        // console.log(`🚀 Momentum applied: ${momentum}, Final rotation: ${modelRef.current.rotation.y}`); // ❌ BỚT LOG
      }
    }
  };

  useEffect(() => {
    requestCameraPermission();

    // ✅ PRELOAD MODELS NGAY KHI KHỞI ĐỘNG APP
    preloadModels();

    // ✅ KHÔNG AUTO-HIDE NGAY - CHỜ MODEL LOAD XONG
    // Auto-hide sẽ được set trong loadPokemonModel

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // ✅ KHÔNG CLEAR HINT TIMEOUT Ở ĐÂY NỮA
    };
  }, []);

  // ✅ HELPER: MAP FILE PATH → BUNDLED ASSET (KHÔNG CÒN FILE CŨ Ở GỐC)
  const resolveBundledAsset = (filePath: string) => {
    if (filePath.includes('pokemon_scizor.glb')) {
      return Asset.fromModule(require('../assets/models/pokemon_concua/pokemon_scizor.glb'));
    }
    if (filePath.includes('Fox.glb')) {
      return Asset.fromModule(require('../assets/models/Fox.glb'));
    }
    throw new Error(`Unsupported bundled asset: ${filePath}`);
  };

  // ✅ PRELOAD MODELS FOR INSTANT LOADING
  const preloadModels = async () => {
    try {
      console.log('⚡ Preloading models for instant access...');

      const preloadTargets = [
        { name: 'Scizor', path: 'assets/models/pokemon_concua/pokemon_scizor.glb' },
        { name: 'Fox', path: 'assets/models/Fox.glb' },
      ];

      for (const target of preloadTargets) {
        try {
          const asset = resolveBundledAsset(target.path);
          await asset.downloadAsync();
          console.log(`✅ ${target.name} model preloaded!`, asset.localUri || asset.uri);
        } catch (error) {
          console.log(`⚠️ ${target.name} preload failed:`, error);
        }
      }
    } catch (error) {
      console.log('⚠️ Preload failed, will load on demand:', error);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    console.log('📷 Camera permission:', status === 'granted' ? 'GRANTED' : 'DENIED');
  };


  // Handle QR Code scan
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    console.log('🎯 QR Code scanned successfully:', data);
    setScannedData(data);
    loadPokemonModel(data);
  };

  // ✅ DYNAMIC SCALE SYSTEM - HỆ THỐNG SCALE TỰ ĐỘNG
  const calculateOptimalScale = (model: THREE.Object3D) => {
    console.log('📐 Calculating optimal scale for model...');
    
    // ✅ BƯỚC 1: LẤY KÍCH THƯỚC MODEL (BOUNDING BOX)
    const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDimension = Math.max(size.x, size.y, size.z);

          console.log('📏 Model bounding box:', {
            width: size.x,
            height: size.y,
            depth: size.z,
            maxDimension: maxDimension
          });

    // ✅ BƯỚC 2: TÍNH SCALE DỰA TRÊN MÀN HÌNH
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;
    const aspectRatio = screenWidth / screenHeight;
    
          // ✅ MỤC TIÊU: MODEL CHIẾM 100% KÍCH THƯỚC TỰ NHIÊN
          const targetScreenSize = 2.0; // 200% - giảm kích thước để model vừa phải
          const optimalScale = targetScreenSize / maxDimension;

    // ✅ DEBUG: SCALE CALCULATION
    console.log('🎯 Scale calculation:', {
            targetScreenSize,
            maxDimension,
      calculatedScale: optimalScale,
      screenSize: { width: screenWidth, height: screenHeight, aspectRatio }
    });
    
          // ✅ BƯỚC 3: ÁP DỤNG SCALE VÀ SETUP ZOOM LIMITS
          model.scale.setScalar(optimalScale);
          model.position.set(0, -0.1, 0);
          
          // ✅ DEBUG: LOG SCALE CUỐI CÙNG
          console.log('🎯 Final scale applied:', {
            scale: model.scale,
            position: model.position,
            boundingBox: { width: size.x, height: size.y, depth: size.z }
          });
          
          // ✅ STORE SCALE INFO FOR ZOOM LIMITS
          (model as any).originalScale = optimalScale;
          (model as any).minScale = optimalScale * 0.5;  // ✅ MIN: 50% của original
          (model as any).maxScale = optimalScale * 3.0;  // ✅ MAX: 300% của original
    
    console.log('✅ Dynamic scale applied:', {
      originalScale: optimalScale,
      minScale: optimalScale * 0.5,
      maxScale: optimalScale * 3.0,
      position: model.position
    });
    
    return optimalScale;
  };

  // ✅ SIMPLIFIED MODEL LOADING - CHỈ LOAD MODEL THẬT, KHÔNG FALLBACK
  const loadPokemonModel = async (qrData: string) => {
    try {
      console.log('🎯 Starting REAL model loading for:', qrData);
      setIsLoading(true);
      setLoadingProgress(10);
      setModelInfo('Đang phân tích QR code...');

      // Parse QR data để lấy model config
      const glbConfig = getGLBModelFromQRData(qrData);

      if (glbConfig) {
        console.log('✅ Model config found:', glbConfig.name, 'File:', glbConfig.filePath);
        setModelInfo(`🦊 Đang tải model GLB: ${glbConfig.name}...`);
        setLoadingProgress(30);

        // ✅ SIMPLIFIED MODEL LOADING - DIRECT APPROACH
        console.log('🎯 Using simplified model loading approach');
          setLoadingProgress(40);
          setModelInfo(`📥 Đang tải file GLB: ${glbConfig.name}...`);

        let asset: any;
        let gltf: any;

        try {
          // ✅ SIMPLE ASSET LOADING
          console.log('🔍 Loading asset for:', glbConfig.filePath);

          const normalizedPath = glbConfig.filePath.includes('pokemon_scizor.glb')
            ? 'assets/models/pokemon_concua/pokemon_scizor.glb'
            : glbConfig.filePath;
          asset = resolveBundledAsset(normalizedPath);

          console.log('✅ Asset created:', asset.uri);
            await asset.downloadAsync();
          console.log('✅ Asset downloaded');

          // ✅ SIMPLE GLTF LOADING WITH TEXTURE DEBUG
            gltf = await loadAsync(asset);
          console.log('✅ GLTF loaded successfully');
          
          // ✅ DEBUG GLTF STRUCTURE - CHI TIẾT HƠN
          console.log('🔍 GLTF Structure Debug:', {
            scenes: gltf.scenes?.length || 0,
            animations: gltf.animations?.length || 0,
            materials: gltf.materials?.length || 0,
            textures: gltf.textures?.length || 0,
            images: gltf.images?.length || 0,
            meshes: gltf.meshes?.length || 0
          });
          
          // ✅ DEBUG GLTF OBJECT KEYS
          console.log('🔍 GLTF Object Keys:', Object.keys(gltf));
          
          // ✅ DEBUG SCENE CHILDREN
          if (gltf.scene) {
            console.log('🔍 Scene children:', gltf.scene.children?.length || 0);
            gltf.scene.traverse((child: any) => {
              console.log(`🔍 Scene child: ${child.name || 'unnamed'}`, {
                type: child.type,
                isMesh: child.isMesh,
                material: child.material?.type || 'no material',
                hasMap: !!child.material?.map
              });
            });
          }
          
          // ✅ DEBUG MATERIALS
          if (gltf.materials) {
            gltf.materials.forEach((material: any, index: number) => {
              console.log(`🎨 Material ${index}:`, {
                name: material.name,
                hasBaseColorTexture: !!material.pbrMetallicRoughness?.baseColorTexture,
                baseColorTextureIndex: material.pbrMetallicRoughness?.baseColorTexture?.index,
                metallicFactor: material.pbrMetallicRoughness?.metallicFactor,
                roughnessFactor: material.pbrMetallicRoughness?.roughnessFactor
              });
            });
          }
          
          // ✅ DEBUG TEXTURES
          if (gltf.textures) {
            gltf.textures.forEach((texture: any, index: number) => {
              console.log(`🖼️ Texture ${index}:`, {
                sampler: texture.sampler,
                source: texture.source,
                hasImage: !!gltf.images?.[texture.source]
              });
            });
          }

          if (!gltf || !gltf.scene) {
            throw new Error('GLB file loaded but no scene found');
          }

          const loadedModel = gltf.scene;
          console.log('🎉 MODEL LOADED!', {
            children: loadedModel.children?.length || 0,
            animations: gltf.animations?.length || 0
          });

          // ✅ SIMPLE MODEL SETUP
          console.log('🔧 Setting up model...');
          
          // ✅ SCALE WILL BE CALCULATED BY calculateOptimalScale() LATER
          
          console.log('✅ Model setup complete');

          // ✅ ENHANCED MATERIAL SETUP - ĐẢM BẢO TEXTURE RENDER ĐÚNG MÀU
          console.log('🎨 Setting up materials with texture support...');
          loadedModel.traverse((child: any) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              if (child.material) {
                // ✅ ENSURE TEXTURE LOADING
                if (child.material.map) {
                  child.material.map.needsUpdate = true;
                  child.material.map.flipY = false; // ✅ FIX TEXTURE ORIENTATION
                  console.log('✅ Texture map found and updated for mesh:', child.name);
                }
                
                // ✅ ENSURE NORMAL MAP LOADING
                if (child.material.normalMap) {
                  child.material.normalMap.needsUpdate = true;
                  child.material.normalMap.flipY = false;
                  console.log('✅ Normal map found and updated for mesh:', child.name);
                }
                
                // ✅ ENSURE ROUGHNESS/METALLIC MAPS
                if (child.material.roughnessMap) {
                  child.material.roughnessMap.needsUpdate = true;
                  child.material.roughnessMap.flipY = false;
                }
                
                if (child.material.metalnessMap) {
                  child.material.metalnessMap.needsUpdate = true;
                  child.material.metalnessMap.flipY = false;
                }
                
                // ✅ FORCE MATERIAL UPDATE
                child.material.needsUpdate = true;
                child.material.transparent = false; // ✅ ENSURE OPAQUE RENDERING
                
                console.log('✅ Material fully updated for mesh:', child.name, {
                  hasMap: !!child.material.map,
                  hasNormalMap: !!child.material.normalMap,
                  hasRoughnessMap: !!child.material.roughnessMap,
                  hasMetalnessMap: !!child.material.metalnessMap
                });
              }
            }
          });

          // ✅ SIMPLE ANIMATION SETUP
          if (gltf.animations && gltf.animations.length > 0) {
            console.log('🎬 Setting up animations...');
            mixerRef.current = new THREE.AnimationMixer(loadedModel);
            
            const firstClip = gltf.animations[0];
            const action = mixerRef.current.clipAction(firstClip);
            action.play();
            console.log('✅ Animation setup complete');
          }

          // ✅ ADD MODEL TO SCENE - SIMPLIFIED
          console.log('🎯 Adding model to scene...');
          
          if (sceneRef.current) {
            // Clear existing models
            sceneRef.current.clear();
            
            // Add lighting back
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            sceneRef.current.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(1, 1, 1);
            sceneRef.current.add(directionalLight);
            
            // Add model to scene
            sceneRef.current.add(loadedModel);
            modelRef.current = loadedModel;
            
            // ✅ APPLY DYNAMIC SCALE SYSTEM
            console.log('📐 Applying dynamic scale system...');
            calculateOptimalScale(loadedModel);
            
            // ✅ FORCE TEXTURE LOADING FROM GLTF DATA
            console.log('🔄 Force loading textures from GLTF data...');
            forceTextureLoading(gltf, loadedModel);
            
            // ✅ MANUAL TEXTURE LOADING FROM SEPARATE PNG FILE
            console.log('🔄 Loading texture from separate PNG file...');
            await loadTextureFromPNG(loadedModel);
            
            // ✅ FORCE TEXTURE RELOAD AFTER MODEL IS ADDED TO SCENE
            console.log('🔄 Forcing texture reload after scene addition...');
            setTimeout(() => {
              if (loadedModel) {
                // ✅ DEBUG TEXTURE LOADING
                debugTextureLoading(loadedModel);
                
                loadedModel.traverse((child: any) => {
                  if (child.isMesh && child.material) {
                    // ✅ FORCE ALL TEXTURES TO RELOAD
                    if (child.material.map) {
                      child.material.map.needsUpdate = true;
                    }
                    if (child.material.normalMap) {
                      child.material.normalMap.needsUpdate = true;
                    }
                    if (child.material.roughnessMap) {
                      child.material.roughnessMap.needsUpdate = true;
                    }
                    if (child.material.metalnessMap) {
                      child.material.metalnessMap.needsUpdate = true;
                    }
                    child.material.needsUpdate = true;
                  }
                });
                console.log('✅ Textures reloaded after scene addition');
              }
            }, 100);
            
            // ✅ SHOW GESTURE HINT KHI MODEL LOAD XONG
            console.log('🎯 Showing gesture hint for loaded model');
            setShowGestureHint(true);
            console.log('🎯 showGestureHint set to true');
            
            // ✅ FORCE RE-RENDER ĐỂ ĐẢM BẢO UI UPDATE
            setTimeout(() => {
              console.log('🎯 Force re-render gesture hint');
              setShowGestureHint(true);
              console.log('🎯 showGestureHint after force re-render:', true);
            }, 100);
            
            // ✅ SET AUTO-HIDE TIMEOUT SAU KHI MODEL LOAD XONG
            setTimeout(() => {
              console.log(`🎯 Auto-hiding gesture hint after 5 seconds`);
              setShowGestureHint(false);
            }, 5000);
            
            console.log('✅ Model added to scene successfully');
            console.log('✅ Scene children count:', sceneRef.current.children.length);
            } else {
            console.error('❌ Scene not available for adding model');
          }
          
        } catch (loadError) {
          console.error('❌ loadAsync failed:', loadError);
          throw loadError;
        }
        
        // ✅ COMPLETE LOADING
        setLoadingProgress(100);
        setIsLoading(false);
        setModelInfo(`✅ ${glbConfig.name} loaded successfully!`);
        
        console.log('🎉 MODEL LOADING COMPLETE!');

          } else {
        // Không tìm thấy model
        console.warn('⚠️ Unknown Pokemon model ID');
        setModelInfo('⚠️ Pokemon model không tồn tại');

        Alert.alert(
          '⚠️ Model không tồn tại',
          'QR code không chứa Pokemon model hợp lệ. Vui lòng thử QR code khác.',
          [{ text: 'OK' }]
        );

        setIsLoading(false);
      }
      
                    } catch (error) {
      console.error('❌ Error loading Pokemon model:', error);
      setModelInfo('❌ Lỗi tải Pokemon model');
      setIsLoading(false);
    }
  };

  const onContextCreate = async (gl: any) => {
    try {
      // Thiết lập Scene, Camera, Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000);
      const renderer = new Renderer({ gl });
      
      // ✅ LƯU SCENE VÀO REF
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      
      // ✅ Nếu model đã được load trước đó, add vào scene ngay
      if (modelRef.current) {
        scene.add(modelRef.current);
        console.log('🔄 Adding existing model to new scene');
      }
      
      // ✅ SETUP CAMERA - BETTER POSITION FOR FALLBACK MODELS
      camera.position.set(0, 1.0, 4.0); // ✅ Closer and higher for better visibility
      camera.lookAt(0, 0, 0); // Nhìn thẳng vào center
      console.log('🎯 Camera position:', camera.position);
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0); // Trong suốt để thấy camera
      // @ts-ignore - alpha property for transparency
      renderer.alpha = true; // ✅ ENABLE ALPHA CHANNEL
      
      // ✅ ORBITCONTROLS KHÔNG TƯƠNG THÍCH VỚI REACT NATIVE
      // Sử dụng touch handlers tự implement thay thế
      console.log('🎮 Using custom touch handlers for React Native compatibility');
      
      // ✅ MÀU SẮC CHUẨN SRGB CHO ĐỘ CHÍNH XÁC CAO
      // @ts-ignore - tương thích nhiều phiên bản three
      if ((renderer as any).outputColorSpace !== undefined) {
        // @ts-ignore
        (renderer as any).outputColorSpace = THREE.SRGBColorSpace;
                              } else {
        // @ts-ignore
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
      
      // ✅ PBR RENDERING CHO MÀU SẮC CHÍNH XÁC
      // @ts-ignore
      renderer.physicallyCorrectLights = true;
      // @ts-ignore
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      // @ts-ignore
      renderer.toneMappingExposure = 1.2; // Tăng exposure cho màu sắc rõ hơn
      
      // ✅ SHADOW SETTINGS CHO CHI TIẾT
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // ✅ REFERENCES ĐÃ ĐƯỢC LƯU Ở TRÊN

        // ✅ ENHANCED LIGHTING SYSTEM - TỐI ƯU CHO TEXTURE RENDERING
        // ✅ AMBIENT LIGHT - ĐẢM BẢO KHÔNG CÓ VÙNG TỐI HOÀN TOÀN
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        // ✅ MAIN DIRECTIONAL LIGHT - CHIẾU SÁNG CHÍNH
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(2, 4, 3);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        scene.add(directionalLight);

        // ✅ FILL LIGHTS - ĐẢM BẢO MÀU SẮC ĐỀU
        const leftFillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        leftFillLight.position.set(-3, 2, 2);
        scene.add(leftFillLight);

        const rightFillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        rightFillLight.position.set(3, 2, 2);
        scene.add(rightFillLight);
        
        // ✅ KEY LIGHT - ÁNH SÁNG CHÍNH CHO TEXTURE
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
        keyLight.position.set(0, 3, 4);
        scene.add(keyLight);
        
        // ✅ RIM LIGHT - TẠO ĐỘ SÂU CHO MODEL
        const rimLight = new THREE.DirectionalLight(0x88ccff, 0.3);
        rimLight.position.set(0, 1, -3);
        scene.add(rimLight);
        
        // ✅ ADDITIONAL POINT LIGHT FOR DETAILS
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 20);
        pointLight.position.set(0, 2, 3);
        scene.add(pointLight);

      // ✅ ANIMATION LOOP - TỐI ƯU HIỆU SUẤT!
      const animate = () => {
        timeoutRef.current = setTimeout(animate, 1000 / 30); // ✅ GIẢM XUỐNG 30 FPS CHO HIỆU SUẤT

        // ✅ ORBITCONTROLS KHÔNG TƯƠNG THÍCH VỚI REACT NATIVE

        // ✅ UPDATE ANIMATION MIXER
        const delta = clockRef.current.getDelta();
        if (mixerRef.current) {
          mixerRef.current.update(delta);
        }

        if (modelRef.current) {
          const time = Date.now() * 0.001;

          // ✅ DEBUG: Log model info occasionally
          if (Math.floor(time) % 5 === 0 && Math.floor(time * 10) % 10 === 0) {
            console.log('🎯 Model debug:', {
              position: modelRef.current.position,
              scale: modelRef.current.scale,
              visible: modelRef.current.visible,
              children: modelRef.current.children.length,
              isFallback: (modelRef.current as any).isFallback
            });
          }

          // Update AnimationMixer nếu có
          if ((modelRef.current as any).updateMixer) {
            (modelRef.current as any).updateMixer(delta);
          }
          
          // ✅ BREATHING ANIMATION - TỐI ƯU!
          if ((modelRef.current as any).animate) {
            (modelRef.current as any).animate();
                              } else {
            // ✅ MODEL HOÀN TOÀN TĨNH - ĐỂ USER TRẢI NGHIỆM CỬ CHỈ TỰ NHIÊN
            // Breathing effect đã tắt để model đứng yên hoàn toàn
          }
          
          // ✅ MODEL ĐỨNG YÊN BAN ĐẦU - ĐỂ USER TRẢI NGHIỆM CỬ CHỈ TỰ NHIÊN
          // Auto-rotation đã tắt để user có thể khám phá cử chỉ một cách tự nhiên
          
          // ✅ ĐẢM BẢO MODEL LUÔN TRONG TẦM NHÌN
          const modelPosition = modelRef.current.position;
          const cameraPosition = camera.position;
          const distance = Math.sqrt(
            Math.pow(modelPosition.x - cameraPosition.x, 2) +
            Math.pow(modelPosition.y - cameraPosition.y, 2) +
            Math.pow(modelPosition.z - cameraPosition.z, 2)
          );
          
          // Nếu model quá xa, đưa về gần camera
          if (distance > 5) {
            modelRef.current.position.set(0, 0, 0);
          }
        }

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate();
      console.log('🎬 3D Scene initialized successfully!');

    } catch (error) {
      console.error('Error creating 3D context:', error);
              setIsLoading(false);
            }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Đang yêu cầu quyền truy cập camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>❌ Không có quyền truy cập camera</Text>
        <View style={styles.button} onTouchEnd={onClose}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Camera làm background */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scannedData ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417'],
        }}
        pointerEvents="none"
      />

      {/* ✅ SEPARATE GLVIEW AND PANRESPONDER - XỬ LÝ CỬ CHỈ LIÊN TỤC */}
      {/* ✅ GLVIEW RIÊNG BIỆT - KHÔNG CHẶN TOUCH EVENTS */}
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
        pointerEvents="none"
      />

      {/* ✅ PANRESPONDER RIÊNG BIỆT - XỬ LÝ CỬ CHỈ LIÊN TỤC */}
      <View
        style={styles.touchWrapper}
        {...panResponder.panHandlers}
        onLayout={(evt) => {
          console.log('🎮 PanResponder layout:', evt.nativeEvent.layout);
          console.log('🎮 PanResponder zIndex: 1001, elevation: 1001');
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>{modelInfo}</Text>

            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{loadingProgress}%</Text>

            <Text style={styles.systemInfo}>🎮 Pokemon AR System</Text>
          </View>
        </View>
      )}

      {/* UI Controls */}
      <View style={styles.overlay}>
        {/* ✅ FIX: UI NHẤT QUÁN - THAY ĐỔI THEO TRẠNG THÁI */}
        {!scannedData ? (
          <Text style={styles.instruction}>
            📱 Quét QR code để hiển thị Pokemon 3D
          </Text>
        ) : (
          <View>
            <Text style={styles.instruction}>
              🦂 {modelInfo || 'Pokemon đã sẵn sàng!'}
            </Text>
            {/* ✅ TC6.1: ANIMATION FEEDBACK UI */}
            {animationFeedback && (
              <Text style={styles.animationFeedback}>
                {animationFeedback}
              </Text>
            )}
          </View>
        )}

        {/* ✅ REMOVED INSTRUCTION TEXT AS REQUESTED */}

        {/* ✅ CHỈ HIỆN KHI ĐANG LOADING ĐỂ TRÁNH RỐI UI */}
        {scannedData && isLoading && (
          <Text style={styles.scannedData}>
            🔍 Đã quét: {scannedData}
          </Text>
        )}

        {/* ✅ GESTURE HINT - HƯỚNG DẪN TƯƠNG TÁC */}
        {scannedData && !isLoading && showGestureHint && (
          <View style={styles.gestureHint}>
            <Text style={styles.gestureHintText}>
              👆 Vuốt để xoay • 🤏 Chụm để zoom
            </Text>
          </View>
        )}



        <View
          style={styles.closeButton}
          onTouchEnd={onClose}
        >
          <Text style={styles.closeText}>❌ Đóng</Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  touchWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001, // ✅ CAO HƠN GESTURE HINT VÀ DEBUG INFO
    backgroundColor: 'transparent',
    elevation: 1001, // Android elevation
  },
  glView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    zIndex: 1000, // ✅ UI ELEMENTS LUÔN Ở TRÊN 3D MODEL
    alignItems: 'center',
    // ✅ TC6.2: ADAPTIVE PADDING FOR DIFFERENT DEVICES
    paddingTop: Platform.OS === 'ios' ? (Dimensions.get('window').height > 800 ? 60 : 40) : 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingHorizontal: 20,
  },
  instruction: {
    color: '#fff',
    // ✅ TC6.2: RESPONSIVE FONT SIZE
    fontSize: Dimensions.get('window').width < 375 ? 16 : 18,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)', // ✅ TĂNG OPACITY CHO RÕ RÀNG
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // ✅ VIỀN TRẮNG NHẸ
    // ✅ TC6.2: ENSURE VISIBILITY ON ALL DEVICES
    maxWidth: Dimensions.get('window').width - 40,
  },
  subInstruction: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  scannedData: {
    color: '#FFD700',
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: 'rgba(255,0,0,0.7)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // ✅ TC6.1: ANIMATION FEEDBACK STYLES
  animationFeedback: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: 200,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  systemInfo: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  // ✅ GESTURE HINT STYLES
  gestureHint: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  gestureHintText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // ✅ DEBUG STYLES
  debugInfo: {
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 10,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default PokemonARViewer;