// 🏛️ Museum 3D Viewer - PERFORMANCE OPTIMIZED FOR MOBILE
// ⚡ Tối ưu hóa cho điện thoại: Giảm lag, cải thiện FPS, fix zoom

import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Dimensions, PanResponder, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Camera, CameraView } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer, loadAsync } from 'expo-three';
import * as THREE from 'three';
import { Asset } from 'expo-asset';
import { Colors } from '../theme/colors';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

  // ✅ CRITICAL FIX: Sử dụng screen thay vì window để tránh safe area issues trên iPhone 12 Pro Max
  const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

// 🎯 AUTO ROTATION CONFIG - Tự xoay model khi mới load
// Tốc độ xoay (radian/giây) - 5.0 ~ 286°/s → xoay nhanh, phong cách demo ấn tượng
const AUTO_ROTATE_SPEED = 1;

// 🎯 DEBUG FLAG - Tắt console.log để giảm spam
const DEBUG = false; // Set to true để bật debug logs

// 🎯 Helper function để log có điều kiện
const log = (...args: any[]) => {
  if (DEBUG) {
    console.log(...args);
  }
};

interface Museum3DViewerProps {
  modelId: string;
  onBack: () => void;
  onContinue: () => void;
}

type ModelTextureConfig =
  | { baseColor: any; normal?: any; metallicRoughness?: any; metallic?: any; emission?: any }
  | '3d2'
  | '3d3'
  | string;

type ModelConfig = {
  name: string;
  file: any | null; // null = file không có trong bản build (đang .gitignore), chỉ model 1 bundle
  textures?: ModelTextureConfig;
};

// 🎯 MODEL CONFIGS - Chỉ require ShipWithPhao để EAS build pass (3 GLB kia đang .gitignore)
const MODELS: Record<string, ModelConfig> = {
  '1': {
    name: 'CHIẾN HẠM LỊCH SỬ',
    file: require('../assets/models/ShipWithPhao.glb'),
    textures: {
      baseColor: require('../assets/models/3d1/KyDai1_BaseColor (2048x2048).png'),
      normal: require('../assets/models/3d1/KyDai1_Normal (2048x2048).png'),
      metallicRoughness: require('../assets/models/3d1/KyDai1_Metallic-KyDai1_Roughness (2048x2048).png'),
    }
  },
  '2': {
    name: 'XE TĂNG HAMTANK',
    file: null, // Thêm file HamTank1.glb vào repo (bỏ .gitignore) để dùng
    textures: '3d2'
  },
  '3': {
    name: 'ĐÀI TƯỞNG NIỆM KYDAI',
    file: null,
    textures: '3d3'
  },
  '4': {
    name: 'NGÔ MÔN - HUẾ',
    file: null,
    textures: { baseColor: require('../assets/models/3d4/ngo mon (4096x4096).png') },
  },
};

const Museum3DViewer: React.FC<Museum3DViewerProps> = ({ modelId, onBack, onContinue }) => {
  // ✅ Giảm log - chỉ log khi cần thiết~
  // console.log('🏛️ Museum3DViewer mounted with modelId:', modelId);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0); // 🎯 Progress bar - Từ PokemonARViewer
  const [error, setError] = useState<string | null>(null);

  // 3D References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const animationRef = useRef<number | null>(null);
  const contextReadyRef = useRef<boolean>(false); // 🎯 Track if 3D context is ready
  const isUserRotatingRef = useRef<boolean>(false); // 🎯 Track if user is rotating model
  const isLoadingModelRef = useRef<boolean>(false); // 🎯 Prevent duplicate model loading

  // ⚡ OPTIMIZED Gesture state
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  
  // 🎯 USER FEEDBACK - Từ PokemonARViewer
  const [showGestureHint, setShowGestureHint] = useState<boolean>(false);
  const gestureHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⚡ PERFORMANCE OPTIMIZED PAN RESPONDER
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      const touches = evt.nativeEvent.touches;
      const { pageY } = evt.nativeEvent;
      const screenHeight = Dimensions.get('screen').height;
      const footerArea = screenHeight - 80; // ✅ Giảm từ 100px xuống 80px để tăng vùng chạm
      
      // ✅ 2 ngón tay (zoom) → Cho phép toàn màn hình, kể cả gần footer
      if (touches.length === 2) {
        return true; // Zoom có thể dùng toàn màn hình, không giới hạn
      }
      
      // ✅ 1 ngón tay (xoay) → Chặn ở vùng footer nhỏ hơn
      if (pageY > footerArea) {
        return false; // Không capture ở vùng footer
      }
      return true; // Capture ở vùng khác để xoay
    },
    onMoveShouldSetPanResponder: (evt) => {
      const touches = evt.nativeEvent.touches;
      const { pageY } = evt.nativeEvent;
      const screenHeight = Dimensions.get('screen').height;
      const footerArea = screenHeight - 80; // ✅ Giảm từ 100px xuống 80px để tăng vùng chạm
      
      // ✅ 2 ngón tay (zoom) → Cho phép toàn màn hình, kể cả gần footer
      if (touches.length === 2) {
        return true; // Zoom có thể dùng toàn màn hình, không giới hạn
      }
      
      // ✅ 1 ngón tay (xoay) → Chặn ở vùng footer nhỏ hơn
      if (pageY > footerArea) {
        return false; // Không capture ở vùng footer
      }
      return true; // Capture ở vùng khác để xoay
    },
    
    onPanResponderGrant: (evt) => {
      // ✅ ẨN GESTURE HINT SAU KHI USER TƯƠNG TÁC - Từ PokemonARViewer
      if (showGestureHint) {
        log('🎯 Hiding gesture hint after user interaction');
        setShowGestureHint(false);
      }
      
      // 🎯 MARK USER IS ROTATING - STOP AUTO ROTATION
      isUserRotatingRef.current = true;
      
      const touches = evt.nativeEvent.touches;
      if (touches.length === 2 && modelRef.current) {
        // Initialize zoom
        const touch1 = touches[0];
        const touch2 = touches[1];
        const distance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) + 
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        setInitialDistance(distance);
        setInitialScale(modelRef.current.scale.x);
      }
    },
    
    onPanResponderMove: (evt, gestureState) => {
      if (!modelRef.current) return;
      
      const touches = evt.nativeEvent.touches;
      
      if (touches.length === 1) {
        // 🎯 ENHANCED Single finger rotation từ PokemonARViewer
        // ✅ CRITICAL FIX: Sử dụng screen dimensions để detect iPhone 12 Pro Max chính xác
        const screenDims = Dimensions.get('screen');
        const isIPhone12ProMax = screenDims.width >= 428 && screenDims.height >= 926;
        const sensitivity = isIPhone12ProMax ? 0.01 : 0.008; // Pro Max: nhạy hơn
        
        const newRotationY = rotation.y + gestureState.dx * sensitivity;
        // ✅ Giảm góc xoay xuống dưới - Không cho xem đế/góc dưới của mô hình
        const newRotationX = Math.max(-Math.PI/18, Math.min(Math.PI/2, rotation.x + gestureState.dy * sensitivity)); // ✅ Giảm từ -15° xuống -10° (chặn hoàn toàn góc dưới)
        
        modelRef.current.rotation.y = newRotationY;
        modelRef.current.rotation.x = newRotationX;
      } else if (touches.length === 2) {
        // ⚡ ENHANCED Two finger zoom - Tăng độ nhạy và vùng chạm
        const touch1 = touches[0];
        const touch2 = touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.pageX - touch1.pageX, 2) + 
          Math.pow(touch2.pageY - touch1.pageY, 2)
        );
        
        if (initialDistance > 0) {
          // ✅ Tăng độ nhạy zoom: nhân với hệ số 1.2 để zoom nhanh hơn
          const baseScaleRatio = currentDistance / initialDistance;
          const zoomSensitivity = 2; // ✅ Tăng từ 1.0 lên 1.2 (nhạy hơn 20%)
          const scaleRatio = 1 + (baseScaleRatio - 1) * zoomSensitivity;
          
          // 🎯 ENHANCED zoom limits từ PokemonARViewer
          const originalScale = (modelRef.current as any).originalScale || 1;
          const minScale = (modelRef.current as any).minScale || originalScale * 0.3;
          const maxScale = (modelRef.current as any).maxScale || originalScale * 3.0;
          
          const newScale = Math.max(minScale, Math.min(maxScale, initialScale * scaleRatio));
          modelRef.current.scale.setScalar(newScale);
          
          // 📱 iPhone 12 Pro Max: Log zoom info
          if (DEBUG) {
            const screenDims = Dimensions.get('screen');
            const isIPhone12ProMax = screenDims.width >= 428 && screenDims.height >= 926;
            if (isIPhone12ProMax) {
              log(`🔍 Zoom applied (Pro Max): ${(newScale/originalScale).toFixed(2)}x`);
            }
          }
        }
      }
    },
    
    onPanResponderRelease: () => {
      if (modelRef.current) {
        setRotation({
          x: modelRef.current.rotation.x,
          y: modelRef.current.rotation.y
        });
      }
      setInitialDistance(0);

      // 🎯 Cho phép model tự xoay lại sau khi user buông tay
      isUserRotatingRef.current = false;
    }
  });

  // ⚡ PRELOAD MODELS - Tối ưu tốc độ (song song) từ PokemonARViewer
  const preloadModels = async () => {
    try {
      // ✅ Giảm log
      // console.log('⚡ Preloading museum models in parallel for instant access...');
      
      const preloadTargets = [
        { name: 'ShipWithPhao', asset: MODELS['1'].file, textures: MODELS['1'].textures as any },
      ].filter((t) => t.asset != null);
      
      // ⚡ Load tất cả models SONG SONG (parallel) thay vì tuần tự
      const preloadPromises = preloadTargets.map(async (target) => {
        try {
          // Preload GLB model
          const asset = Asset.fromModule(target.asset);
          await asset.downloadAsync();
          // ✅ Giảm log
          // console.log(`✅ ${target.name} model preloaded!`);
          
          // ⚡ Preload textures nếu có (song song)
          if (target.textures && typeof target.textures === 'object') {
            const texturePromises = [];
            if (target.textures.baseColor) {
              texturePromises.push(Asset.fromModule(target.textures.baseColor).downloadAsync());
            }
            if (target.textures.normal) {
              texturePromises.push(Asset.fromModule(target.textures.normal).downloadAsync());
            }
            if (target.textures.metallicRoughness) {
              texturePromises.push(Asset.fromModule(target.textures.metallicRoughness).downloadAsync());
            }
            if (texturePromises.length > 0) {
              await Promise.all(texturePromises);
              // ✅ Giảm log
              // console.log(`✅ ${target.name} textures preloaded!`);
            }
          }
        } catch (error) {
          // Silent fail - will load on demand
        }
      });
      
      // ⚡ Wait for all models to preload in parallel
      await Promise.all(preloadPromises);
      // ✅ Giảm log
      // console.log('✅ All models preloaded in parallel!');
    } catch (error) {
      // Silent fail - will load on demand
    }
  };

  // 🎯 FIXED LOGIC NGHIỆP VỤ: Camera → QR → Model
  useEffect(() => {
    // 🎯 CLEAR OLD MODEL WHEN modelId CHANGES
    if (modelRef.current && sceneRef.current) {
      log('🔄 Model ID changed, clearing old model...');
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
      isLoadingModelRef.current = false; // Reset loading flag
      setIsLoading(false);
    }
    
    (async () => {
      // ⚡ PRELOAD MODELS NGAY KHI KHỞI ĐỘNG - Logic từ PokemonARViewer
      // Không chờ camera permission, preload ngay để tăng tốc độ
      preloadModels();
      
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      // ✅ CHỈ LOAD MODEL KHI ĐÃ CÓ CAMERA PERMISSION VÀ MODEL ID
      if (status === 'granted' && modelId) {
        log('🎯 Camera permission granted, preparing for model loading...');
        log('🎯 Model ID received:', modelId);
        log('🎯 Context ready status:', contextReadyRef.current);
        
        // ⚡ TỐI ƯU: Giảm retry và thời gian chờ để tăng tốc độ - Render ngay lập tức
        let retryCount = 0;
        const maxRetries = 10; // ⚡ Giảm từ 20 xuống 10 (0.5 giây thay vì 2 giây)
        
        const checkAndLoad = () => {
          retryCount++;
          
          if (contextReadyRef.current && sceneRef.current && !modelRef.current) {
            // ✅ Giảm log
            // console.log('✅ 3D context ready, starting model loading...');
            loadModel();
          } else if (!contextReadyRef.current && retryCount < maxRetries) {
            setTimeout(checkAndLoad, 50); // ⚡ Giảm từ 200ms xuống 50ms để tăng tốc độ
          } else if (modelRef.current) {
            console.log('✅ Model already loaded, skipping...');
          } else if (retryCount >= maxRetries) {
            console.error('❌ Timeout waiting for 3D context');
            setError('Không thể khởi tạo 3D context. Vui lòng thử lại.');
          }
        };
        
        // ⚡ Start checking immediately
        checkAndLoad();
      }
    })();
    
    // Cleanup
    return () => {
      if (gestureHintTimeoutRef.current) {
        clearTimeout(gestureHintTimeoutRef.current);
    }
    };
  }, [modelId]);

  // 🎨 CUSTOM TEXTURE LOADER với TIMEOUT
  // 🎨 LOAD TEXTURES THEO MATERIAL NAME CHO HAMTANK1
  const loadMaterialTextures = async (materialName: string) => {
    try {
      // ✅ TEXTURE MODULES MAPPING - Phải require tĩnh (không thể dùng dynamic require)
      const textureModules: { [key: string]: { diffuse?: any; normal?: any; baseColor?: any; metallicRoughness?: any; metallic?: any; emission?: any } } = {
        'M_Ship06_CannonRope': {
          diffuse: require('../assets/models/3d2/T_Ship06_CannonRope_Diffuse (512x512).png')
        },
        'M_Ship06_Rope_02': {
          diffuse: require('../assets/models/3d2/T_Ship06_Rope_02_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_Rope_02_Normal (512x512).png')
        },
        'M_Ship06_Rope_03': {
          diffuse: require('../assets/models/3d2/T_Ship06_Rope_03_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_Rope_03_Normal (512x512).png')
        },
        'M_Ship06_WoodPlain_04': {
          diffuse: require('../assets/models/3d2/T_Ship06_WoodPlain_04_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_WoodPlain_04_Normal (512x512).png')
        },
        'M_Ship06_OarHolder': {
          diffuse: require('../assets/models/3d2/T_Ship06_OarHolder_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_OarHolder_Normal (512x512).png')
        },
        'M_Ship06_CannonSides': {
          diffuse: require('../assets/models/3d2/T_Ship06_CannonSides_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_CannonSides_Normal (512x512).png')
        },
        'M_Ship06_CannonMetal': {
          diffuse: require('../assets/models/3d2/T_Ship06_CannonMetal_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_CannonMetal_Normal (512x512).png')
        },
        'M_Ship06_CannonSupport': {
          diffuse: require('../assets/models/3d2/T_Ship06_CannonSupport_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_CannonSupport_Normal (512x512).png')
        },
        'M_Ship06_BarrelWood_01': {
          diffuse: require('../assets/models/3d2/T_Ship06_BarrelWood_01_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_BarrelWood_01_Normal (512x512).png')
        },
        'M_Ship06_BarrelWood_02': {
          diffuse: require('../assets/models/3d2/T_Ship06_BarrelWood_02_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_BarrelWood_02_Normal (512x512).png')
        },
        'M_Ship06_BarrelMetal_01': {
          diffuse: require('../assets/models/3d2/T_Ship06_BarrelMetal_01_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_BarrelMetal_01_Normal (512x512).png')
        },
        'M_Ship06_BarrelMetal_02': {
          diffuse: require('../assets/models/3d2/T_Ship06_BarrelMetal_02_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_BarrelMetal_02_Normal (512x512).png')
        },
        'M_Ship06_Sail': {
          diffuse: require('../assets/models/3d2/T_Ship06_Sail_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_Sail_Normal (512x512).png')
        },
        'M_Ship06_Flag': {
          baseColor: require('../assets/models/3d2/M_Ship06_Flag_BaseColor (2048x2048).png'),
          normal: require('../assets/models/3d2/T_Ship06_Flag_Normal (512x512).png')
        },
        'M_Ship06_Metal': {
          baseColor: require('../assets/models/3d2/M_Ship06_Metal_BaseColor (2048x2048).png'),
          normal: require('../assets/models/3d2/T_Ship06_Metal_Normal (512x512).png')
        },
        'M_Ship06_WoodPlain_05': {
          normal: require('../assets/models/3d2/T_Ship06_WoodPlain_05_Normal (512x512).png')
        },
        'M_Ship06_Rope_01': {
          diffuse: require('../assets/models/3d2/T_Ship06_Rope_01_Diffuse (512x512).png'),
          normal: require('../assets/models/3d2/T_Ship06_Rope_01_Normal (512x512).png')
        },
        'M_Ship06_WoodPlain_02': {
          normal: require('../assets/models/3d2/T_Ship06_WoodPlain_02_Normal (512x512).png')
        },
        'M_Ship06_WoodPlain_01': {
          normal: require('../assets/models/3d2/T_Ship06_WoodPlain_01_Normal (512x512).png')
        },
        'M_Ship06_WoodDark': {
          normal: require('../assets/models/3d2/T_Ship06_WoodDark_Normal (512x512).png')
        },
        'M_Ship06_WoodBolt_02': {
          baseColor: require('../assets/models/3d2/M_Ship06_WoodBolt_02_BaseColor (2048x2048).png'),
          normal: require('../assets/models/3d2/T_Ship06_WoodBolt_02_Normal (512x512).png')
        },
        'M_Ship06_WoodBolt_01': {
          baseColor: require('../assets/models/3d2/M_Ship06_WoodBolt_01_BaseColor (2048x2048).png'),
          normal: require('../assets/models/3d2/T_Ship06_WoodBolt_01_Normal (512x512).png')
        },
        'M_Ship06_WoodBolt_03': {
          baseColor: require('../assets/models/3d2/M_Ship06_WoodBolt_03_BaseColor (2048x2048).png'),
          normal: require('../assets/models/3d2/T_Ship06_WoodBolt_03_Normal (4096x4096).png')
        },
        'M_Ship06_WoodPlain_03': {
          normal: require('../assets/models/3d2/T_Ship06_WoodPlain_03_Normal (512x512).png')
        },
        'M_Ship06_WoodPlain_06': {
          normal: require('../assets/models/3d2/T_Ship06_WoodPlain_06_Normal (512x512).png')
        },
        'standardSurface1': {
          baseColor: require('../assets/models/3d2/standardSurface1_BaseColor (2048x2048).png'),
          normal: require('../assets/models/3d2/standardSurface1_Normal (2048x2048).png'),
          metallicRoughness: require('../assets/models/3d2/standardSurface1_Metallic-standardSurface1_Roughness (2048x2048).png')
        },
        // ✅ KYDAI TEXTURES từ folder 3d3 - MAPPING THEO MATERIAL NAME THỰC TẾ
        'KyDai1': {
          baseColor: require('../assets/models/3d3/KyDai1_BaseColor (2048x2048).png'),
          normal: require('../assets/models/3d3/KyDai1_Normal (2048x2048).png'),
          metallicRoughness: require('../assets/models/3d3/KyDai1_Metallic-KyDai1_Roughness (2048x2048).png')
        },
        'Ham1': {
          baseColor: require('../assets/models/3d3/Ham1_BaseColor (2048x2048).png'),
          normal: require('../assets/models/3d3/Ham1_Normal (2048x2048).png'),
          metallicRoughness: require('../assets/models/3d3/Ham1_Metallic-Ham1_Roughness (2048x2048).png')
        },
        'standardSurface1.002': {
          baseColor: require('../assets/models/3d3/standardSurface1.002_BaseColor-standardSurface1.002_Alpha.jpg (2048x2048).jpg'),
          normal: require('../assets/models/3d3/standardSurface1.002_Normal (2048x2048).jpg'),
          metallic: require('../assets/models/3d3/standardSurface1.002_Metallic (2048x2048).jpg'),
          emission: require('../assets/models/3d3/standardSurface1.002_Emission (2048x2048).jpg')
        },
        'standardSurface1.001': {
          baseColor: require('../assets/models/3d3/ChestRig_d (2048x2048).png')
        },
        'standardSurface1.003': {
          baseColor: require('../assets/models/3d3/VN_Head5_D (2048x2048).png')
        },
        'standardSurface1.004': {
          baseColor: require('../assets/models/3d3/VN_headgear_NVA_D (2048x2048).png')
        },
        'standardSurface1.005': {
          baseColor: require('../assets/models/3d3/GR_AK47_1ST_D (2048x2048).png')
        },
        'standardSurface1.006': {
          baseColor: require('../assets/models/3d3/US_Hair_D_Gre (2048x2048).png')
        },
        'chassis.0': {
          baseColor: require('../assets/models/3d3/interier (2048x2048).png')
        },
        'misc_a.1': {
          baseColor: require('../assets/models/3d3/whiteinter (2048x2048).png')
        },
        'misc_a.2': {
          baseColor: require('../assets/models/3d3/sandbags01_BaseColor (2048x2048).png'),
          normal: require('../assets/models/3d3/sandbags01_Normal (2048x2048).png')
        },
        'chassis_vlo.002': {
          baseColor: require('../assets/models/3d3/aeaa7e02 (512x512).png')
        },
        'Material.002': {
          baseColor: require('../assets/models/3d3/interier (2048x2048).png')
        },
        'Material.003': {
          baseColor: require('../assets/models/3d3/interier (2048x2048).png')
        },
        'Material.004': {
          baseColor: require('../assets/models/3d3/interier (2048x2048).png')
        },
        'Material.005': {
          baseColor: require('../assets/models/3d3/interier (2048x2048).png')
        }
      };

      // ✅ MAPPING MATERIAL NAME → TEXTURE FILES (chỉ để reference)
      const textureMapping: { [key: string]: { diffuse?: string; normal?: string; baseColor?: string; metallicRoughness?: string } } = {
        'M_Ship06_CannonRope': {
          diffuse: 'T_Ship06_CannonRope_Diffuse (512x512).png'
          // ⚠️ THIẾU: T_Ship06_CannonRope_Normal (không có trong folder 3d2)
        },
        'M_Ship06_Rope_02': {
          diffuse: 'T_Ship06_Rope_02_Diffuse (512x512).png',
          normal: 'T_Ship06_Rope_02_Normal (512x512).png'
        },
        'M_Ship06_Rope_03': {
          diffuse: 'T_Ship06_Rope_03_Diffuse (512x512).png',
          normal: 'T_Ship06_Rope_03_Normal (512x512).png'
        },
        'M_Ship06_WoodPlain_04': {
          diffuse: 'T_Ship06_WoodPlain_04_Diffuse (512x512).png',
          normal: 'T_Ship06_WoodPlain_04_Normal (512x512).png'
        },
        'M_Ship06_OarHolder': {
          diffuse: 'T_Ship06_OarHolder_Diffuse (512x512).png',
          normal: 'T_Ship06_OarHolder_Normal (512x512).png'
        },
        'M_Ship06_CannonSides': {
          diffuse: 'T_Ship06_CannonSides_Diffuse (512x512).png',
          normal: 'T_Ship06_CannonSides_Normal (512x512).png'
        },
        'M_Ship06_CannonMetal': {
          diffuse: 'T_Ship06_CannonMetal_Diffuse (512x512).png',
          normal: 'T_Ship06_CannonMetal_Normal (512x512).png'
        },
        'M_Ship06_CannonSupport': {
          diffuse: 'T_Ship06_CannonSupport_Diffuse (512x512).png',
          normal: 'T_Ship06_CannonSupport_Normal (512x512).png'
        },
        'M_Ship06_BarrelWood_01': {
          diffuse: 'T_Ship06_BarrelWood_01_Diffuse (512x512).png',
          normal: 'T_Ship06_BarrelWood_01_Normal (512x512).png'
        },
        'M_Ship06_BarrelWood_02': {
          diffuse: 'T_Ship06_BarrelWood_02_Diffuse (512x512).png',
          normal: 'T_Ship06_BarrelWood_02_Normal (512x512).png'
        },
        'M_Ship06_BarrelMetal_01': {
          diffuse: 'T_Ship06_BarrelMetal_01_Diffuse (512x512).png',
          normal: 'T_Ship06_BarrelMetal_01_Normal (512x512).png'
        },
        'M_Ship06_BarrelMetal_02': {
          diffuse: 'T_Ship06_BarrelMetal_02_Diffuse (512x512).png',
          normal: 'T_Ship06_BarrelMetal_02_Normal (512x512).png'
        },
        'M_Ship06_Sail': {
          diffuse: 'T_Ship06_Sail_Diffuse (512x512).png',
          normal: 'T_Ship06_Sail_Normal (512x512).png'
        },
        'M_Ship06_Flag': {
          baseColor: 'M_Ship06_Flag_BaseColor (2048x2048).png',
          normal: 'T_Ship06_Flag_Normal (512x512).png'
        },
        'M_Ship06_Metal': {
          baseColor: 'M_Ship06_Metal_BaseColor (2048x2048).png',
          normal: 'T_Ship06_Metal_Normal (512x512).png'
        },
        'M_Ship06_WoodPlain_05': {
          normal: 'T_Ship06_WoodPlain_05_Normal (512x512).png'
          // ⚠️ THIẾU: T_Ship06_WoodPlain_05_Diffuse (không có trong folder 3d2)
        },
        'M_Ship06_Rope_01': {
          diffuse: 'T_Ship06_Rope_01_Diffuse (512x512).png',
          normal: 'T_Ship06_Rope_01_Normal (512x512).png'
        },
        'M_Ship06_WoodPlain_02': {
          normal: 'T_Ship06_WoodPlain_02_Normal (512x512).png'
          // ⚠️ THIẾU: T_Ship06_WoodPlain_02_Diffuse (không có trong folder 3d2)
        },
        'M_Ship06_WoodPlain_01': {
          normal: 'T_Ship06_WoodPlain_01_Normal (512x512).png'
          // ⚠️ THIẾU: T_Ship06_WoodPlain_01_Diffuse (không có trong folder 3d2)
        },
        'M_Ship06_WoodDark': {
          normal: 'T_Ship06_WoodDark_Normal (512x512).png'
          // ⚠️ THIẾU: T_Ship06_WoodDark_Diffuse (không có trong folder 3d2)
        },
        'M_Ship06_WoodBolt_02': {
          baseColor: 'M_Ship06_WoodBolt_02_BaseColor (2048x2048).png',
          normal: 'T_Ship06_WoodBolt_02_Normal (512x512).png'
        },
        'M_Ship06_WoodBolt_01': {
          baseColor: 'M_Ship06_WoodBolt_01_BaseColor (2048x2048).png',
          normal: 'T_Ship06_WoodBolt_01_Normal (512x512).png'
        },
        'M_Ship06_WoodBolt_03': {
          baseColor: 'M_Ship06_WoodBolt_03_BaseColor (2048x2048).png',
          normal: 'T_Ship06_WoodBolt_03_Normal (4096x4096).png'
        },
        'M_Ship06_WoodPlain_03': {
          normal: 'T_Ship06_WoodPlain_03_Normal (512x512).png'
          // ⚠️ THIẾU: T_Ship06_WoodPlain_03_Diffuse (không có trong folder 3d2)
        },
        'M_Ship06_WoodPlain_06': {
          normal: 'T_Ship06_WoodPlain_06_Normal (512x512).png'
          // ⚠️ THIẾU: T_Ship06_WoodPlain_06_Diffuse (không có trong folder 3d2)
        },
        'standardSurface1': {
          baseColor: 'standardSurface1_BaseColor (2048x2048).png',
          normal: 'standardSurface1_Normal (2048x2048).png',
          metallicRoughness: 'standardSurface1_Metallic-standardSurface1_Roughness (2048x2048).png'
        }
      };

      const modules = textureModules[materialName];
      if (!modules) return null;

      const textures: any = {};

      // ✅ Load diffuse hoặc baseColor từ pre-required modules
      const colorModule = modules.diffuse || modules.baseColor;
      if (colorModule) {
        try {
          const asset = await Asset.fromModule(colorModule).downloadAsync();
          const texture = new THREE.Texture();
          texture.image = asset;
          texture.needsUpdate = true;
          texture.flipY = false;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          // @ts-ignore
          texture.colorSpace = THREE.SRGBColorSpace;
          textures.baseColor = texture;
        } catch (error) {
          console.warn(`⚠️ Failed to load color texture for ${materialName}:`, error);
        }
      }

      // ✅ Load normal từ pre-required modules
      if (modules.normal) {
        try {
          const asset = await Asset.fromModule(modules.normal).downloadAsync();
          const texture = new THREE.Texture();
          texture.image = asset;
          texture.needsUpdate = true;
          texture.flipY = false;
          textures.normal = texture;
        } catch (error) {
          console.warn(`⚠️ Failed to load normal texture for ${materialName}:`, error);
        }
      }

      // ✅ Load metallic-roughness từ pre-required modules
      if (modules.metallicRoughness) {
        try {
          const asset = await Asset.fromModule(modules.metallicRoughness).downloadAsync();
          const texture = new THREE.Texture();
          texture.image = asset;
          texture.needsUpdate = true;
          texture.flipY = false;
          textures.metallicRoughness = texture;
        } catch (error) {
          console.warn(`⚠️ Failed to load metallic-roughness texture for ${materialName}:`, error);
        }
      }

      // ✅ Load metallic (riêng biệt, nếu có)
      if (modules.metallic) {
        try {
          const asset = await Asset.fromModule(modules.metallic).downloadAsync();
          const texture = new THREE.Texture();
          texture.image = asset;
          texture.needsUpdate = true;
          texture.flipY = false;
          textures.metallic = texture;
        } catch (error) {
          console.warn(`⚠️ Failed to load metallic texture for ${materialName}:`, error);
        }
      }

      // ✅ Load emission (nếu có)
      if (modules.emission) {
        try {
          const asset = await Asset.fromModule(modules.emission).downloadAsync();
          const texture = new THREE.Texture();
          texture.image = asset;
          texture.needsUpdate = true;
          texture.flipY = false;
          textures.emission = texture;
        } catch (error) {
          console.warn(`⚠️ Failed to load emission texture for ${materialName}:`, error);
        }
      }

      return Object.keys(textures).length > 0 ? textures : null;
    } catch (error) {
      console.error(`❌ Error loading material textures for ${materialName}:`, error);
      return null;
    }
  };

  const loadCustomTextures = async (textureConfig: any) => {
    try {
      const textureLoader = new THREE.TextureLoader();
      const textures: any = {};

      // ⚡ TIMEOUT HELPER - Giảm timeout để tăng tốc độ
      const loadTextureWithTimeout = (promise: Promise<any>, timeoutMs: number = 5000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Texture load timeout')), timeoutMs)
          )
        ]);
  };

      // 🎯 TEXTURE OPTIMIZATION - Three.js sẽ tự resize trong React Native
      // Không cần resize thủ công vì document.createElement không có trong RN

      // ⚡ TỐI ƯU TỐC ĐỘ: Load textures SONG SONG (parallel) thay vì tuần tự
      const texturePromises: Promise<any>[] = [];

      // ⚡ TỐI ƯU: Pre-download tất cả assets SONG SONG
      const assetPromises: Promise<any>[] = [];
      if (textureConfig.baseColor) {
        assetPromises.push(Asset.fromModule(textureConfig.baseColor).downloadAsync().then(asset => ({ type: 'baseColor', asset })));
      }
      if (textureConfig.normal) {
        assetPromises.push(Asset.fromModule(textureConfig.normal).downloadAsync().then(asset => ({ type: 'normal', asset })));
      }
      if (textureConfig.metallicRoughness) {
        assetPromises.push(Asset.fromModule(textureConfig.metallicRoughness).downloadAsync().then(asset => ({ type: 'metallicRoughness', asset })));
      }
      
      // ⚡ Download tất cả assets song song
      const downloadedAssets = await Promise.all(assetPromises);
      // ✅ Giảm log
      // console.log('⚡ All texture assets downloaded in parallel');

      // ⚡ Load textures SONG SONG sau khi assets đã download - Dùng cách của PokemonARViewer (tạo texture từ Asset trực tiếp)
      if (textureConfig.baseColor) {
        const baseColorData = downloadedAssets.find(a => a.type === 'baseColor');
        if (baseColorData && baseColorData.asset) {
          texturePromises.push(
            loadTextureWithTimeout(
              new Promise((resolve, reject) => {
                try {
                  // ✅ CÁCH TỐT NHẤT: Tạo texture từ Asset trực tiếp (giống PokemonARViewer) - Hoạt động tốt trong React Native
              const texture = new THREE.Texture();
                  texture.image = baseColorData.asset;
              texture.needsUpdate = true;
              texture.flipY = false;
                  texture.wrapS = THREE.RepeatWrapping;
                  texture.wrapT = THREE.RepeatWrapping;
                  // @ts-ignore
                  texture.colorSpace = THREE.SRGBColorSpace;
              
                  // ✅ Giảm log
                  // console.log('✅ Base Color texture created from Asset directly');
              
                  resolve({ type: 'baseColor', texture });
            } catch (error) {
                  console.error('❌ Base Color texture creation error:', error);
                  // ✅ FALLBACK: Thử TextureLoader nếu tạo trực tiếp fail
                  try {
                    textureLoader.load(
                      baseColorData.asset.localUri || baseColorData.asset.uri,
                      (loadedTexture) => {
                        loadedTexture.flipY = false;
                        loadedTexture.wrapS = THREE.RepeatWrapping;
                        loadedTexture.wrapT = THREE.RepeatWrapping;
                        loadedTexture.needsUpdate = true;
                        // @ts-ignore
                        loadedTexture.colorSpace = THREE.SRGBColorSpace;
                        // ✅ Giảm log
                        // console.log('✅ Base Color texture loaded via TextureLoader (fallback)');
                        resolve({ type: 'baseColor', texture: loadedTexture });
                      },
                      undefined,
                      (loadError) => {
                        console.error('❌ TextureLoader fallback failed:', loadError);
                        reject(loadError);
                      }
                    );
                  } catch (fallbackError) {
                    console.error('❌ All texture loading methods failed:', fallbackError);
                    reject(fallbackError);
                  }
                }
              })
            ).catch(() => ({ type: 'baseColor', texture: null }))
          );
        }
      }

      if (textureConfig.normal) {
        const normalData = downloadedAssets.find(a => a.type === 'normal');
        if (normalData) {
          texturePromises.push(
            loadTextureWithTimeout(
              new Promise((resolve, reject) => {
                textureLoader.load(
                  normalData.asset.uri,
                  (loadedTexture) => {
                    loadedTexture.flipY = false;
                    loadedTexture.wrapS = THREE.RepeatWrapping;
                    loadedTexture.wrapT = THREE.RepeatWrapping;
                    loadedTexture.needsUpdate = true;
                    resolve({ type: 'normal', texture: loadedTexture });
                  },
                  undefined,
                  (error) => reject(error)
                );
              })
            ).catch(() => ({ type: 'normal', texture: null }))
          );
        }
      }

      if (textureConfig.metallicRoughness) {
        const metallicRoughnessData = downloadedAssets.find(a => a.type === 'metallicRoughness');
        if (metallicRoughnessData) {
          texturePromises.push(
            loadTextureWithTimeout(
              new Promise((resolve, reject) => {
                textureLoader.load(
                  metallicRoughnessData.asset.uri,
                  (loadedTexture) => {
                    loadedTexture.flipY = false;
                    loadedTexture.wrapS = THREE.RepeatWrapping;
                    loadedTexture.wrapT = THREE.RepeatWrapping;
                    loadedTexture.needsUpdate = true;
                    resolve({ type: 'metallicRoughness', texture: loadedTexture });
                  },
                  undefined,
                  (error) => reject(error)
                );
              })
            ).catch(() => ({ type: 'metallicRoughness', texture: null }))
          );
        }
      }

      // ⚡ Load tất cả textures SONG SONG
      const loadedTextures = await Promise.all(texturePromises);
      
      // Map results và validate image data
      loadedTextures.forEach(result => {
        if (result.type === 'baseColor' && result.texture && result.texture.image) {
          textures.baseColor = result.texture;
          // ✅ Giảm log
          // console.log('✅ BaseColor texture validated');
        }
        if (result.type === 'normal' && result.texture && result.texture.image) {
          textures.normal = result.texture;
        }
        if (result.type === 'metallicRoughness' && result.texture && result.texture.image) {
          textures.metallicRoughness = result.texture;
        }
      });

      // ✅ CRITICAL: Validate textures có image data
      if (textures.baseColor && !textures.baseColor.image) {
        console.error('❌ BaseColor texture không có image data!');
        textures.baseColor = null;
      }

      // ✅ Giảm log - chỉ log khi cần thiết
      // console.log('✅ All custom textures loaded successfully');
      return textures;
            } catch (error) {
      console.error('❌ Error loading custom textures:', error);
      // ✅ RETURN EMPTY OBJECT instead of null to continue rendering
      return {};
            }
  };

  // 📐 ENHANCED CENTERING SYSTEM - Căn giữa hoàn hảo cho AR
  const calculateOptimalScale = (model: THREE.Object3D) => {
    console.log('📐 [CENTERING] Bắt đầu căn giữa model...');
    
    // ✅ BƯỚC 1: RESET TẤT CẢ TRANSFORMS TRƯỚC
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    model.updateMatrixWorld(true);
    
    // ✅ BƯỚC 2: LẤY BOUNDING BOX CỦA MODEL GỐC (TRƯỚC KHI SCALE)
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    
    console.log('📏 [CENTERING] Model bounding box gốc:', {
      width: size.x.toFixed(3),
      height: size.y.toFixed(3),
      depth: size.z.toFixed(3),
      maxDimension: maxDimension.toFixed(3),
      center: { x: center.x.toFixed(3), y: center.y.toFixed(3), z: center.z.toFixed(3) }
    });
    
    // ✅ BƯỚC 3: TÍNH SCALE TỐI ƯU DỰA TRÊN FOV VÀ BOUNDING BOX (CÁCH TÍNH CHÍNH XÁC)
    const screenDims = Dimensions.get('screen');
    const screenHeight = screenDims.height;
    const screenWidth = screenDims.width;
    const aspectRatio = screenWidth / screenHeight;
    
    // ✅ CÁCH TÍNH MỚI: Dựa trên FOV camera và khoảng cách camera
    // FOV = 50 degrees, camera distance = 4.5 units
    const cameraFOV = 50; // degrees
    const cameraDistance = 4.5; // units (từ setupOptimalCamera)
    
    // ✅ Tính chiều cao viewport tại khoảng cách camera (dựa trên FOV)
    const fovRadians = (cameraFOV * Math.PI) / 180;
    const viewportHeight = 2 * cameraDistance * Math.tan(fovRadians / 2);
    
    // ✅ MỤC TIÊU: Model chiếm 6% chiều cao viewport (RẤT NHỎ, VỪA VỚI MÀN HÌNH)
    // Giải thích: 6% viewport = model sẽ chiếm khoảng 1/16 màn hình, rất nhỏ và vừa phải
    // Giảm từ 12% xuống 6% để model nhỏ hơn nhiều khi hiển thị lần đầu
    const targetViewportSize = viewportHeight * 0.06; // 6% chiều cao viewport - rất nhỏ
    
    // ✅ Tính scale để model vừa với target size
    const optimalScale = targetViewportSize / maxDimension;
    
    console.log('🎯 [CENTERING] Scale calculation (FOV-based):', {
      screenSize: { width: screenWidth, height: screenHeight, aspectRatio: aspectRatio.toFixed(2) },
      cameraFOV: cameraFOV,
      cameraDistance: cameraDistance,
      viewportHeight: viewportHeight.toFixed(3),
      targetViewportSize: targetViewportSize.toFixed(3),
      maxDimension: maxDimension.toFixed(3),
      calculatedScale: optimalScale.toFixed(4)
    });
    
    // ✅ BƯỚC 4: ÁP DỤNG SCALE
    model.scale.setScalar(optimalScale);
    model.updateMatrixWorld(true);
    
    // ✅ BƯỚC 5: TÍNH LẠI CENTER SAU KHI SCALE
    const boxAfterScale = new THREE.Box3().setFromObject(model);
    const centerAfterScale = boxAfterScale.getCenter(new THREE.Vector3());
    
    console.log('🔄 [CENTERING] Center sau scale:', {
      x: centerAfterScale.x.toFixed(3),
      y: centerAfterScale.y.toFixed(3),
      z: centerAfterScale.z.toFixed(3)
    });
    
    // ✅ BƯỚC 6: CĂN GIỮA HOÀN HẢO - Đưa center về (0, 0, 0) TRƯỚC KHI ROTATION
    // Đây là bước QUAN TRỌNG NHẤT để model nằm giữa màn hình
    model.position.x = -centerAfterScale.x;
    model.position.y = -centerAfterScale.y;
    model.position.z = -centerAfterScale.z;
    model.updateMatrixWorld(true);
    
    // ✅ BƯỚC 7: ÁP DỤNG ROTATION MẶC ĐỊNH (nếu cần)
    model.rotation.set(0.1, 0.4, 0);
    model.updateMatrixWorld(true);
    
    // ✅ BƯỚC 8: TÍNH LẠI CENTER SAU KHI ROTATION (QUAN TRỌNG!)
    // Rotation có thể làm thay đổi bounding box và center
    const boxAfterRotation = new THREE.Box3().setFromObject(model);
    const centerAfterRotation = boxAfterRotation.getCenter(new THREE.Vector3());
    
    console.log('🔄 [CENTERING] Center sau rotation:', {
      x: centerAfterRotation.x.toFixed(3),
      y: centerAfterRotation.y.toFixed(3),
      z: centerAfterRotation.z.toFixed(3)
    });
    
    // ✅ BƯỚC 9: CĂN LẠI SAU ROTATION - Đưa center về (0, 0, 0) một lần nữa
    // CRITICAL: Phải điều chỉnh position để center = (0,0,0) sau rotation
    if (Math.abs(centerAfterRotation.x) > 0.001 || 
        Math.abs(centerAfterRotation.y) > 0.001 || 
        Math.abs(centerAfterRotation.z) > 0.001) {
      // ✅ Tính offset cần thiết để đưa center về (0,0,0)
      const offsetX = -centerAfterRotation.x;
      const offsetY = -centerAfterRotation.y;
      const offsetZ = -centerAfterRotation.z;
      
      // ✅ Áp dụng offset vào position
      model.position.x += offsetX;
      model.position.y += offsetY;
      model.position.z += offsetZ;
    model.updateMatrixWorld(true);
      
      // ✅ Kiểm tra lại sau khi điều chỉnh
      const boxFinal = new THREE.Box3().setFromObject(model);
      const centerFinal = boxFinal.getCenter(new THREE.Vector3());
      
      console.log('🔄 [CENTERING] Center sau điều chỉnh:', {
        x: centerFinal.x.toFixed(3),
        y: centerFinal.y.toFixed(3),
        z: centerFinal.z.toFixed(3),
        offsetApplied: { x: offsetX.toFixed(3), y: offsetY.toFixed(3), z: offsetZ.toFixed(3) }
      });
    }
    
    // ✅ BƯỚC 10: FINAL CHECK - Kiểm tra vị trí cuối cùng
    model.updateMatrixWorld(true);
    const finalBox = new THREE.Box3().setFromObject(model);
    const finalCenter = finalBox.getCenter(new THREE.Vector3());
    const finalSize = finalBox.getSize(new THREE.Vector3());
    
    // ✅ Kiểm tra xem model đã ở giữa chưa (tolerance: 0.01 units)
    const isCentered = Math.abs(finalCenter.x) < 0.01 && 
                      Math.abs(finalCenter.y) < 0.01 && 
                      Math.abs(finalCenter.z) < 0.01;
    
    console.log('✅ [CENTERING] Kết quả positioning (GIỮA MÀN HÌNH):', {
      finalPosition: {
        x: model.position.x.toFixed(3),
        y: model.position.y.toFixed(3),
        z: model.position.z.toFixed(3)
      },
      finalCenter: {
        x: finalCenter.x.toFixed(3),
        y: finalCenter.y.toFixed(3),
        z: finalCenter.z.toFixed(3)
      },
      finalSize: {
        width: finalSize.x.toFixed(3),
        height: finalSize.y.toFixed(3),
        depth: finalSize.z.toFixed(3)
      },
      scale: optimalScale.toFixed(4),
      position: isCentered ? '✅ ĐÃ CĂN GIỮA HOÀN HẢO' : '⚠️ CẦN KIỂM TRA LẠI'
    });
    
    // ✅ STORE SCALE INFO FOR ZOOM LIMITS
    (model as any).originalScale = optimalScale;
    (model as any).minScale = optimalScale * 0.5;  // MIN: 50% của original
    (model as any).maxScale = optimalScale * 3.0;  // MAX: 300% của original
    
    // ✅ STORE CENTER INFO FOR CAMERA
    (model as any).modelCenter = finalCenter;
    
    return optimalScale;
  };

  // 🎯 ENHANCED CAMERA SETUP - Camera nhìn vào giữa màn hình
  const setupOptimalCamera = (camera: THREE.PerspectiveCamera) => {
    // ✅ Camera setup để model nằm GIỮA màn hình điện thoại
    const screenDims = Dimensions.get('screen');
    const aspectRatio = screenDims.width / screenDims.height;
    
    // ✅ Camera position: Đặt camera ở phía trước, ngang tầm với model
    // Y = 0 để camera ngang tầm, model sẽ nằm giữa màn hình
    camera.position.set(0, 0, 4.5);
    
    // ✅ CRITICAL: Camera nhìn vào GIỮA (0, 0, 0) để model nằm chính giữa màn hình
    // LookAt (0, 0, 0) để camera nhìn thẳng vào center, model sẽ nằm giữa hoàn toàn
    camera.lookAt(0, 0, 0);
    
    // ✅ Update projection matrix với aspect ratio đúng
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();
    
    console.log('📷 [CAMERA] Camera setup (nhìn vào giữa màn hình):', {
      position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      lookAt: { x: 0, y: 0, z: 0 },
      aspectRatio: aspectRatio.toFixed(3),
      fov: camera.fov
    });
  };

  // 🎯 FIT CAMERA TO MODEL - Tự động điều chỉnh camera để model nằm GIỮA màn hình
  const fitCameraToModel = (camera: THREE.PerspectiveCamera, model: THREE.Object3D) => {
    if (!model || !camera) return;
    
    // ✅ Tính bounding box của model (sau khi đã scale và rotation)
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // ✅ CRITICAL: Model đã được căn giữa về (0,0,0) trong calculateOptimalScale
    // Nếu center vẫn lệch, sử dụng center thực tế từ bounding box
    const actualCenter = center;
    
    // ✅ Tính khoảng cách camera cần thiết để model vừa màn hình
    const maxDim = Math.max(size.x, size.y, size.z);
    const screenDims = Dimensions.get('screen');
    const aspectRatio = screenDims.width / screenDims.height;
    
    // ✅ Tính distance dựa trên FOV và kích thước model
    const fov = camera.fov * (Math.PI / 180); // Convert to radians
    const distance = (maxDim / 2) / Math.tan(fov / 2);
    
    // ✅ CRITICAL: Camera position - Đặt camera ở phía trước model, ngang tầm
    // Camera Y = actualCenter.y để ngang tầm với model
    // Camera Z = actualCenter.z + distance để có khoảng cách phù hợp
    camera.position.set(
      actualCenter.x,           // X: Cùng vị trí X với center
      actualCenter.y,           // Y: Ngang tầm với center
      actualCenter.z + distance * 1.3  // Z: Phía trước model, khoảng cách an toàn
    );
    
    // ✅ CRITICAL: Camera nhìn vào center thực tế của model
    camera.lookAt(actualCenter);
    
    // ✅ Update aspect ratio
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();
    
    console.log('📷 [FIT CAMERA] Camera đã được điều chỉnh (nhìn vào giữa):', {
      modelCenter: { 
        x: actualCenter.x.toFixed(3), 
        y: actualCenter.y.toFixed(3), 
        z: actualCenter.z.toFixed(3) 
      },
      cameraPosition: { 
        x: camera.position.x.toFixed(3), 
        y: camera.position.y.toFixed(3), 
        z: camera.position.z.toFixed(3) 
      },
      lookAt: { 
        x: actualCenter.x.toFixed(3), 
        y: actualCenter.y.toFixed(3), 
        z: actualCenter.z.toFixed(3) 
      },
      distance: distance.toFixed(3),
      modelSize: { 
        width: size.x.toFixed(3), 
        height: size.y.toFixed(3), 
        depth: size.z.toFixed(3) 
      }
    });
  };

  // 🎯 MODEL POSITION MANAGEMENT - Logic từ PokemonARViewer
  const ensureModelInView = (model: THREE.Object3D, camera: THREE.Camera) => {
    // ✅ Logic từ PokemonARViewer: Đảm bảo model luôn trong tầm nhìn
    const modelPosition = model.position;
    const cameraPosition = camera.position;
    const distance = Math.sqrt(
      Math.pow(modelPosition.x - cameraPosition.x, 2) +
      Math.pow(modelPosition.y - cameraPosition.y, 2) +
      Math.pow(modelPosition.z - cameraPosition.z, 2)
    );
    
        // ✅ SAFETY MECHANISM - Theo pattern PokemonARViewer
        // Nếu model quá xa, đưa về vị trí chuẩn (0, 0, 0) - Căn giữa hoàn toàn
        if (distance > 5) {
          model.position.set(0, 0, 0); // ✅ Reset về center (0, 0, 0)
          // ✅ Giảm log
          // log('🎯 Model repositioned to center (0, 0, 0)');
        }
  };

  // ⚡ MINIMAL LIGHTING - Only 2 lights for performance
  // 🎯 THIẾT LẬP HỆ THỐNG ĐÈN - Logic từ code mẫu
  const setupLighting = (scene: THREE.Scene, currentModelId?: string) => {
    // Clear existing lights
    const existingLights = scene.children.filter(child => 
      child instanceof THREE.Light || 
      child.type.includes('Light')
    );
    existingLights.forEach(light => scene.remove(light));

    const screenDims = Dimensions.get('screen');
    const isIPhone12ProMax = screenDims.width >= 428 && screenDims.height >= 926;
    
    // ✅ Điều chỉnh intensity theo model: ShipWithPhao và HamTank1 trầm hơn
    const isShipOrTank = currentModelId === '1' || currentModelId === '2';
    const isNgoMon = currentModelId === '4';

    // Tông sáng cổ kính: ấm hơn, dịu hơn cho Ngọ Môn
    const ambientIntensity = isShipOrTank ? 0.5 : isNgoMon ? 0.55 : 0.8;
    const mainIntensity = isShipOrTank ? 2.0 : isNgoMon ? 2.4 : 3.5;
    const rimIntensity = isShipOrTank ? 1.0 : isNgoMon ? 1.2 : 1.8;
    const fillIntensity = isShipOrTank ? 0.8 : isNgoMon ? 1.0 : 1.5;
    const topIntensity = isShipOrTank ? 1.2 : isNgoMon ? 1.3 : 2.0;
    const hemisphereIntensity = isShipOrTank ? 0.4 : isNgoMon ? 0.45 : 0.7;
    
    // 1. ✅ Ánh sáng môi trường
    const ambientLight = new THREE.AmbientLight(isNgoMon ? 0xfff3e0 : 0xffffff, ambientIntensity);
  scene.add(ambientLight);

    // 2. ✅ Đèn chính (Key Light)
    const mainLight = new THREE.DirectionalLight(isNgoMon ? 0xffe3c4 : 0xffffff, mainIntensity);
    mainLight.position.set(3, 5, 4);
      mainLight.castShadow = false; // ⚡ Tắt shadows cho performance
    scene.add(mainLight);

    // 3. ✅ Đèn viền (Rim Light)
    const rimLight = new THREE.DirectionalLight(isNgoMon ? 0xdde7ff : 0xffffff, rimIntensity);
    rimLight.position.set(-2, 2, -4);
  scene.add(rimLight);
  
    // 4. ✅ Đèn phụ (Fill Light)
    const fillLight = new THREE.DirectionalLight(isNgoMon ? 0xfff1d7 : 0xffffff, fillIntensity);
    fillLight.position.set(-4, 3, 3);
    scene.add(fillLight);
    
    // 5. ✅ Đèn bổ sung (Top Light)
    const topLight = new THREE.DirectionalLight(0xffffff, topIntensity);
    topLight.position.set(0, 6, 0);
    scene.add(topLight);
    
    // 6. ✅ Hemisphere Light
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, hemisphereIntensity);
    hemisphereLight.position.set(0, 5, 0);
    scene.add(hemisphereLight);

    log(`✅ Enhanced lighting setup (6 lights) - ${isShipOrTank ? 'Trầm' : 'Sáng'} mode for model ${currentModelId}`);
  };

  // 🎯 XỬ LÝ TEXTURE MATERIAL - Logic từ code mẫu
  // Fix lỗi texture bị đen hoặc bị lật ngược trong Expo
  const fixMaterials = (model: THREE.Object3D) => {
    model.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // ✅ Bắt buộc update lại map
        if (child.material.map) {
          child.material.map.flipY = false; // ✅ QUAN TRỌNG: Chống lật texture
          child.material.map.needsUpdate = true;
          // @ts-ignore
          child.material.map.colorSpace = THREE.SRGBColorSpace;
        }
        
        // ✅ Đảm bảo model không bị trong suốt vô lý
        child.material.transparent = false;
        child.material.needsUpdate = true;
        
        // ✅ Kích hoạt nhận/đổ bóng (chỉ cho iPhone 12 Pro Max)
        const screenDims = Dimensions.get('screen');
    const isIPhone12ProMax = screenDims.width >= 428 && screenDims.height >= 926;
        if (isIPhone12ProMax) {
          child.castShadow = true;
          child.receiveShadow = true;
        } else {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      }
    });
    log('✅ Materials fixed (flipY=false, colorSpace=SRGB)');
  };


  // 🎨 ENHANCED MODEL LOADING with Custom Textures & Progress Bar
  const loadModel = async () => {
    // 🎯 PREVENT DUPLICATE LOADING
    if (isLoadingModelRef.current) {
      log('⚠️ Model is already loading, skipping duplicate call');
      return;
    }
      
      if (modelRef.current) {
      log('⚠️ Model already loaded, skipping duplicate call');
      return;
    }
    
    try {
      isLoadingModelRef.current = true;
      setIsLoading(true);
      setLoadingProgress(30); // ⚡ Tăng progress ngay để UX tốt hơn
      setLoadingText('⚡ Đang tải mô hình...');

      const modelConfig = MODELS[modelId as keyof typeof MODELS] || MODELS['1'];
      console.log('🎯 Loading model:', modelConfig.name);

      if (modelConfig.file == null) {
        setError(`Model "${modelConfig.name}" chưa có trong bản build này. Chọn Chiến hạm (1) hoặc thêm file GLB vào repo và bỏ .gitignore.`);
        setIsLoading(false);
        isLoadingModelRef.current = false;
        return;
      }

      // ⚡ SIMPLIFIED LOADING - Load GLB và textures song song nếu có thể
      const asset = Asset.fromModule(modelConfig.file);
      
      // ⚡ TỐI ƯU: Nếu asset đã preloaded, không cần download lại
      if (!asset.downloaded) {
        setLoadingProgress(60); // ⚡ Tăng progress nhanh hơn
        await asset.downloadAsync();
      }

      setLoadingProgress(80); // ⚡ Tăng progress nhanh hơn
      setLoadingText('Đang xử lý 3D...');
      
      // ⚡ Load GLB: thử expo-three loadAsync, nếu lỗi fallback GLTFLoader
      let gltf;
      try {
        gltf = await loadAsync(asset);
      } catch (loadErr) {
        console.warn('⚠️ loadAsync failed, fallback GLTFLoader:', loadErr);
        const loader = new GLTFLoader();
        const uri = (asset as any).localUri || asset.uri;
        gltf = await loader.loadAsync(uri);
      }

        if (!gltf || !gltf.scene) {
        throw new Error('Không thể load mô hình 3D');
      }

        setLoadingProgress(70);
      const model = gltf.scene;
      log('✅ Model loaded successfully');

      // ✅ DEBUG GLTF STRUCTURE - Giảm log
      // console.log('🔍 GLTF Structure Debug');

      // ✅ FORCE TEXTURE LOADING FROM GLTF DATA - Giống PokemonARViewer
      // 🎯 LOG GLTF TEXTURE DATA CHO HAMTANK1 - TABLE FORMAT
      if (modelId === '2') {
        const gltfData = gltf as any;
        console.log('\n📦 ========== HAMTANK1 GLTF TEXTURE DATA ==========');
        console.log(`📊 Total textures in GLTF: ${gltfData.textures?.length || 0}`);
        console.log(`📊 Total images in GLTF: ${gltfData.images?.length || 0}`);
        console.log(`📊 Total materials in GLTF: ${gltfData.materials?.length || 0}\n`);
        
        if (gltfData.textures && gltfData.textures.length > 0) {
          console.log('📋 GLTF TEXTURES TABLE:');
          console.log('┌─────┬──────────────────────────────────────────────────────────────────────┐');
          console.log('│ ID  │ Texture Info                                                         │');
          console.log('├─────┼──────────────────────────────────────────────────────────────────────┤');
          
          gltfData.textures.forEach((texture: any, index: number) => {
            const textureInfo = JSON.stringify(texture).substring(0, 70).padEnd(70);
            console.log(`│ ${String(index).padStart(3)} │ ${textureInfo} │`);
          });
          
          console.log('└─────┴──────────────────────────────────────────────────────────────────────┘\n');
        }
        
        if (gltfData.materials && gltfData.materials.length > 0) {
          console.log('📋 GLTF MATERIALS TABLE:');
          console.log('┌─────┬──────────────────────────────────────────────────────────────────────┐');
          console.log('│ ID  │ Material Name / Texture Info                                          │');
          console.log('├─────┼──────────────────────────────────────────────────────────────────────┤');
          
          gltfData.materials.forEach((material: any, index: number) => {
            const matName = (material.name || 'unnamed').padEnd(30);
            let textureInfo = 'No texture';
            if (material.pbrMetallicRoughness?.baseColorTexture) {
              textureInfo = `BaseColor: ${material.pbrMetallicRoughness.baseColorTexture.index}`;
            }
            const info = `${matName} | ${textureInfo}`.substring(0, 70).padEnd(70);
            console.log(`│ ${String(index).padStart(3)} │ ${info} │`);
          });
          
          console.log('└─────┴──────────────────────────────────────────────────────────────────────┘\n');
        }
      }
      
      if ((gltf as any).textures && (gltf as any).textures.length > 0) {
        // ✅ Giảm log
        // console.log('🔄 Force loading textures from GLTF data...');
        model.traverse((child: any) => {
          if (child.isMesh && child.material) {
            // ✅ Kiểm tra material có texture trong GLTF data không
            const materialIndex = child.material.userData?.materialIndex || 0;
            if ((gltf as any).materials && (gltf as any).materials[materialIndex]) {
              const gltfMaterial = (gltf as any).materials[materialIndex];
              
              // ✅ Kiểm tra pbrMetallicRoughness.baseColorTexture
              if (gltfMaterial.pbrMetallicRoughness?.baseColorTexture) {
                const textureIndex = gltfMaterial.pbrMetallicRoughness.baseColorTexture.index;
                if ((gltf as any).textures[textureIndex]) {
                  const textureData = (gltf as any).textures[textureIndex];
                  if (textureData.source !== undefined && (gltf as any).images[textureData.source]) {
                    // ✅ Texture đã được load bởi GLTFLoader, chỉ cần đảm bảo material sử dụng nó
                    // ✅ Giảm log
                    // console.log(`✅ Found texture in GLTF data for mesh: ${child.name}`);
                    // Material đã có texture từ loader, chỉ cần force update
                    if (child.material.map) {
                      child.material.map.needsUpdate = true;
                      // @ts-ignore
                      child.material.map.colorSpace = THREE.SRGBColorSpace;
                    }
                    child.material.needsUpdate = true;
                  }
                }
              }
            }
          }
        });
      }

      // ✅ KIỂM TRA GLB EMBEDDED TEXTURES TRƯỚC - Chi tiết hơn
      let hasGLBTextures = false;
      let textureMeshCount = 0;
      const textureInfo: any[] = []; // 🎯 Debug: Lưu thông tin textures
      
      model.traverse((child: any) => {
        if (child.isMesh && child.material) {
          // ✅ Kiểm tra nhiều nguồn texture
          if (child.material.map && child.material.map.image) {
            hasGLBTextures = true;
            textureMeshCount++;
            textureInfo.push({
              mesh: child.name,
              hasMap: true,
              mapSize: child.material.map.image?.width + 'x' + child.material.map.image?.height,
              material: child.material.name || 'unnamed'
            });
          } else if (child.material.pbrMetallicRoughness?.baseColorTexture) {
            // ✅ Kiểm tra PBR baseColorTexture
            hasGLBTextures = true;
            textureMeshCount++;
            textureInfo.push({
              mesh: child.name,
              hasPBR: true,
              material: child.material.name || 'unnamed'
            });
          } else {
            textureInfo.push({
              mesh: child.name,
              hasTexture: false,
              material: child.material.name || 'unnamed'
            });
          }
        }
      });
      
      // 🎯 LOG TEXTURE INFO CHO HAMTANK1 - TABLE FORMAT
      if (modelId === '2') {
        console.log('\n🎨 ========== HAMTANK1 TEXTURE ANALYSIS ==========');
        console.log(`📊 Total meshes: ${textureInfo.length}`);
        console.log(`✅ Meshes with textures: ${textureMeshCount}`);
        console.log(`🖼️ Has GLB embedded textures: ${hasGLBTextures}\n`);
        
        // 📋 TẠO TABLE TEXTURES
        console.log('📋 TEXTURE TABLE:');
        console.log('┌─────────────────────────────────────────────────────────────────────────────┐');
        console.log('│ Mesh Name                          │ Material        │ Texture Status   │');
        console.log('├─────────────────────────────────────────────────────────────────────────────┤');
        
        textureInfo.forEach((info, index) => {
          const meshName = (info.mesh || 'unnamed').padEnd(35).substring(0, 35);
          const materialName = (info.material || 'unnamed').padEnd(15).substring(0, 15);
          let status = '❌ No texture';
          if (info.hasMap) {
            status = `✅ Map (${info.mapSize || 'N/A'})`;
          } else if (info.hasPBR) {
            status = '✅ PBR Texture';
          }
          status = status.padEnd(17).substring(0, 17);
          
          console.log(`│ ${meshName} │ ${materialName} │ ${status} │`);
        });
        
        console.log('└─────────────────────────────────────────────────────────────────────────────┘\n');
      }

      // ⚡ TỐI ƯU: Load textures song song với material setup để tăng tốc
      setLoadingProgress(90); // ⚡ Tăng progress nhanh hơn
      setLoadingText('Đang tải textures...');
      
      // ✅ ƯU TIÊN GLB EMBEDDED TEXTURES - Chỉ dùng custom nếu GLB không có texture
      let customTextures: any = null;
      let useMaterialTextures = false; // ✅ Flag cho HamTank1
      
      if (modelConfig.textures === '3d2') {
        // ✅ HAMTANK1: Load textures theo material name từ folder 3d2
        useMaterialTextures = true;
        console.log('🎨 HamTank1: Sẽ load textures theo material name từ folder 3d2');
      } else if (modelConfig.textures === '3d3') {
        // ✅ KYDAI: Load textures theo material name từ folder 3d3
        useMaterialTextures = true;
        console.log('🎨 KYDAI: Sẽ load textures theo material name từ folder 3d3');
      } else if (modelConfig.textures) {
        // ✅ LUÔN LOAD CUSTOM TEXTURES NẾU CÓ CONFIG (GLB không có textures)
        try {
          customTextures = await loadCustomTextures(modelConfig.textures);
        } catch (error) {
          console.error('❌ Custom textures failed:', error);
          customTextures = null;
        }
      } else if (hasGLBTextures) {
        // ✅ GLB có embedded textures
      } else {
        // ✅ GLB không có textures
      }
      
      setLoadingProgress(95); // ⚡ Tăng progress nhanh hơn
      // ✅ Giảm log
      // console.log('🎨 Starting material setup...');
        
      // 🎨 HAMTANK1 & KYDAI: Preload tất cả material textures trước
      const materialTexturesMap: { [key: string]: any } = {};
      if (useMaterialTextures && (modelId === '2' || modelId === '3')) {
        const uniqueMaterials = new Set<string>();
        model.traverse((child: any) => {
          if (child.isMesh && child.material && child.material.name) {
            uniqueMaterials.add(child.material.name);
          }
        });
        
        const modelName = modelId === '2' ? 'HamTank1' : 'KYDAI';
        console.log(`🎨 ${modelName}: Loading textures for ${uniqueMaterials.size} unique materials...`);
        const texturePromises = Array.from(uniqueMaterials).map(async (materialName) => {
          const textures = await loadMaterialTextures(materialName);
          return { materialName, textures };
        });
        
        const loadedTextures = await Promise.all(texturePromises);
        loadedTextures.forEach(({ materialName, textures }) => {
          if (textures) {
            materialTexturesMap[materialName] = textures;
          }
        });
        console.log(`✅ ${modelName}: Loaded ${Object.keys(materialTexturesMap).length} material textures`);
      }
        
      // 🎨 ENHANCED MATERIAL SETUP with Custom Textures
      let meshCount = 0;
      model.traverse((child: any) => {
          if (child.isMesh) {
          meshCount++;
          
          // ⚡ DISABLE shadows for performance
          child.castShadow = false;
          child.receiveShadow = false;

            if (child.material) {
            // 🎨 HAMTANK1 & KYDAI: Apply preloaded textures theo material name
            if (useMaterialTextures && (modelId === '2' || modelId === '3')) {
              const materialName = child.material.name || '';
              const materialTextures = materialName ? materialTexturesMap[materialName] : null;
              
              if (materialTextures && materialTextures.baseColor) {
                // ✅ Convert to MeshStandardMaterial
                if (!child.material.isMeshStandardMaterial) {
                  const newMaterial = new THREE.MeshStandardMaterial();
                  newMaterial.copy(child.material);
                  child.material = newMaterial;
                }
                
                // ✅ Apply baseColor
                child.material.map = materialTextures.baseColor;
                // @ts-ignore
                child.material.map.colorSpace = THREE.SRGBColorSpace;
                child.material.map.flipY = false;
                child.material.map.generateMipmaps = true;
                child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                child.material.map.magFilter = THREE.LinearFilter;
                child.material.map.needsUpdate = true;
                child.material.needsUpdate = true;
                
                // ✅ Apply normal (iPhone 12 Pro Max)
                const screenDims = Dimensions.get('screen');
                const isIPhone12ProMax = screenDims.width >= 428 && screenDims.height >= 926;
                if (isIPhone12ProMax && materialTextures.normal) {
                  child.material.normalMap = materialTextures.normal;
                  child.material.normalMap.needsUpdate = true;
                  child.material.normalScale = new THREE.Vector2(1, 1);
                }
                
                // ✅ Apply metallic-roughness (nếu có)
                if (materialTextures.metallicRoughness) {
                  child.material.metalnessMap = materialTextures.metallicRoughness;
                  child.material.roughnessMap = materialTextures.metallicRoughness;
                  child.material.metalnessMap.needsUpdate = true;
                  child.material.roughnessMap.needsUpdate = true;
                }
                
                // ✅ Apply metallic riêng biệt (nếu có)
                if (materialTextures.metallic) {
                  child.material.metalnessMap = materialTextures.metallic;
                  child.material.metalnessMap.needsUpdate = true;
                }
                
                // ✅ Apply emission (nếu có)
                if (materialTextures.emission) {
                  child.material.emissiveMap = materialTextures.emission;
                  child.material.emissiveMap.needsUpdate = true;
                  child.material.emissiveIntensity = 1.0;
                }
                
                if (child.material.vertexColors !== undefined) {
                  child.material.vertexColors = false;
                }
              }
            }
            // 🎨 FIXED: Apply custom textures safely
            else if (customTextures && customTextures.baseColor) {
              log(`🎨 Applying custom textures to mesh: ${child.name}`);
              
              // ✅ CRITICAL: Convert to MeshStandardMaterial để đảm bảo texture được render
              if (!child.material.isMeshStandardMaterial) {
                const newMaterial = new THREE.MeshStandardMaterial();
                if (child.material.map) {
                  newMaterial.map = child.material.map; // Giữ texture cũ nếu có
                }
                newMaterial.copy(child.material);
                child.material = newMaterial;
                // ✅ Giảm log
                // console.log(`✅ Converted to MeshStandardMaterial for mesh: ${child.name}`);
    }
              
              // ✅ CRITICAL: Apply Base Color - CHỈ KHI CÓ IMAGE DATA
              if (customTextures.baseColor && customTextures.baseColor.image && customTextures.baseColor.image.width > 0) {
                // ✅ CRITICAL: Set map trước khi set properties
                child.material.map = customTextures.baseColor;

                // ✅ CRITICAL: Set color space TRƯỚC needsUpdate
                // @ts-ignore
                child.material.map.colorSpace = THREE.SRGBColorSpace;
                
                // ✅ CRITICAL: Set texture properties
                child.material.map.flipY = false;
                child.material.map.generateMipmaps = true;
                child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                child.material.map.magFilter = THREE.LinearFilter;
                child.material.map.wrapS = THREE.RepeatWrapping;
                child.material.map.wrapT = THREE.RepeatWrapping;
                
                // ✅ CRITICAL: Force update texture
                child.material.map.needsUpdate = true;
                
                // ✅ CRITICAL: Force material update
                child.material.needsUpdate = true;
                
                // ✅ CRITICAL: Đảm bảo material sử dụng map (không dùng vertex colors)
                if (child.material.vertexColors !== undefined) {
                  child.material.vertexColors = false;
                }
                
                // ✅ Giảm log - chỉ log khi DEBUG
                // console.log('✅ Base Color applied to mesh:', child.name);
              } else {
                // ✅ Giảm log
                // console.warn('⚠️ Base Color texture không có image data:', child.name);
              }
              
              // 📱 iPhone 12 Pro Max: Enable advanced textures
              const screenDims = Dimensions.get('screen');
    const isIPhone12ProMax = screenDims.width >= 428 && screenDims.height >= 926;
              if (isIPhone12ProMax) {
                // Apply Normal Map for Pro Max - SAFE CHECK
                if (customTextures.normal && customTextures.normal.image) {
                  child.material.normalMap = customTextures.normal;
                child.material.normalMap.needsUpdate = true;
                  child.material.normalScale = new THREE.Vector2(1, 1);
                  // ✅ Giảm log
                  // console.log('✅ Normal Map applied to mesh:', child.name);
              }
              
                // Apply Metallic-Roughness for Pro Max - SAFE CHECK
                if (customTextures.metallicRoughness && customTextures.metallicRoughness.image) {
                  child.material.metalnessMap = customTextures.metallicRoughness;
                  child.material.metalnessMap.needsUpdate = true;
                  child.material.roughnessMap = customTextures.metallicRoughness;
                child.material.roughnessMap.needsUpdate = true;
                  // ✅ Giảm log
                  // console.log('✅ Metallic-Roughness applied to mesh:', child.name);
                }
              } else {
                // Standard devices: Only base color for performance
                child.material.normalMap = null;
                child.material.roughnessMap = null;
                child.material.metalnessMap = null;
              }
            } else {
              // ✅ ƯU TIÊN GLB EMBEDDED TEXTURES - Model đã có texture sẵn trong GLB
              // ✅ CRITICAL: Đảm bảo GLB embedded textures được apply đúng
              if (child.material.map && child.material.map.image) {
                // ✅ CRITICAL: Set color space TRƯỚC needsUpdate
                // @ts-ignore
                child.material.map.colorSpace = THREE.SRGBColorSpace; // ✅ CRITICAL for color
                
                // ✅ CRITICAL: Set texture properties
                child.material.map.flipY = false;
                child.material.map.generateMipmaps = true;
                child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
                child.material.map.magFilter = THREE.LinearFilter;
                child.material.map.wrapS = THREE.RepeatWrapping;
                child.material.map.wrapT = THREE.RepeatWrapping;
                
                // ✅ CRITICAL: Force update texture
                child.material.map.needsUpdate = true;
                
                // ✅ CRITICAL: Force material update
                child.material.needsUpdate = true;
                
                // ✅ CRITICAL: Đảm bảo material sử dụng map
                if (child.material.vertexColors !== undefined) {
                  child.material.vertexColors = false;
                }
                
                // ✅ Giảm log
                // console.log('✅ GLB embedded texture applied:', child.name);
              } else if (child.material.pbrMetallicRoughness?.baseColorTexture) {
                // ✅ FALLBACK: Kiểm tra PBR baseColorTexture từ GLTF data
                // ✅ Giảm log
                // console.log('🔄 Trying to load texture from GLTF PBR data for mesh:', child.name);
                // Texture sẽ được load từ GLTF loader, chỉ cần đảm bảo material update
                child.material.needsUpdate = true;
              } else {
                // ⚠️ No texture - Kiểm tra material color từ GLB
                // ✅ CRITICAL: Nếu GLB có material color, dùng nó thay vì màu trắng
                if (!child.material.isMeshStandardMaterial) {
                  const newMaterial = new THREE.MeshStandardMaterial();
                  if (child.material.color) {
                    newMaterial.color.copy(child.material.color); // Giữ màu từ GLB
                    // ✅ Giảm log
                    // console.log(`✅ Using GLB material color for mesh: ${child.name}`);
                  } else {
                    // ✅ Nếu không có color, kiểm tra pbrMetallicRoughness.baseColorFactor
                    if (child.material.pbrMetallicRoughness?.baseColorFactor) {
                      const baseColor = child.material.pbrMetallicRoughness.baseColorFactor;
                      newMaterial.color.setRGB(baseColor[0], baseColor[1], baseColor[2]);
                      // ✅ Giảm log
                      // console.log(`✅ Using PBR baseColorFactor for mesh: ${child.name}`);
                    }
                  }
                  newMaterial.copy(child.material);
                  child.material = newMaterial;
                } else {
                  // ✅ Đảm bảo MeshStandardMaterial có color đúng
                  if (child.material.pbrMetallicRoughness?.baseColorFactor) {
                    const baseColor = child.material.pbrMetallicRoughness.baseColorFactor;
                    child.material.color.setRGB(baseColor[0], baseColor[1], baseColor[2]);
                    // ✅ Giảm log
                    // console.log(`✅ Applied PBR baseColorFactor to existing material: ${child.name}`);
                  }
                }
                child.material.needsUpdate = true;
                // ✅ Giảm log
                // console.warn('⚠️ No texture found for mesh:', child.name);
              }
              
              // Remove expensive maps for non-custom textures
              child.material.normalMap = null;
              child.material.roughnessMap = null;
              child.material.metalnessMap = null;
              }
              
              
            // ⚡ Common material properties - CRITICAL FOR COLOR RENDERING
              child.material.needsUpdate = true;
              child.material.transparent = false;
            child.material.opacity = 1.0;
            
            // 🎨 FORCE MATERIAL UPDATE - Áp dụng cho TẤT CẢ material types
            // ✅ CRITICAL: Force material to use map (texture) - cho mọi material
              if (child.material.map) {
                child.material.map.needsUpdate = true;
              // @ts-ignore
              child.material.map.colorSpace = THREE.SRGBColorSpace; // ✅ CRITICAL for color
            }
            
            // ✅ CRITICAL: Disable vertex colors nếu có để texture hiển thị đúng
            if (child.material.vertexColors !== undefined) {
              child.material.vertexColors = false;
            }
            
            // ✅ MeshStandardMaterial: PBR properties - Tối ưu cho ShipWithPhao (có KHR_materials_specular, KHR_materials_ior)
            if (child.material.isMeshStandardMaterial) {
              // ✅ ShipWithPhao có PBR nâng cao, giữ nguyên giá trị từ GLB
              // Chỉ override nếu không có texture (fallback)
              if (!child.material.map && !customTextures) {
                child.material.metalness = 0.0;
                child.material.roughness = 0.9;
              }
              // ✅ Đảm bảo material có đủ ánh sáng để hiển thị specular
              child.material.needsUpdate = true;
              }
              
            // ✅ MeshBasicMaterial: Ensure it uses map
            if (child.material.isMeshBasicMaterial && child.material.map) {
              // MeshBasicMaterial automatically uses map
            }
            
            // ✅ Giảm log - chỉ log khi DEBUG
            // console.log(`✅ Material updated for mesh: ${child.name}`);
            }
          }
        });

      log(`🎨 Enhanced ${meshCount} meshes with ${customTextures ? 'custom' : 'original'} textures`);

      // 🎯 FIX MATERIALS - Logic từ code mẫu (fix texture flipY, colorSpace)
      log('🎯 Fixing materials (flipY=false, colorSpace=SRGB)...');
      fixMaterials(model);
      
      // ✅ CRITICAL: Force update tất cả materials một lần nữa sau khi fix
      model.traverse((child: any) => {
                if (child.isMesh && child.material) {
                  if (child.material.map) {
                    child.material.map.needsUpdate = true;
            // @ts-ignore
            child.material.map.colorSpace = THREE.SRGBColorSpace;
                  }
                  child.material.needsUpdate = true;
          // ✅ CRITICAL: Đảm bảo material sử dụng map
          if (child.material.isMeshStandardMaterial && child.material.map) {
            // Force material to use map
            child.material.map.needsUpdate = true;
            }
          }
        });
      // ✅ Giảm log
      // console.log('✅ All materials force updated for correct color rendering');

      // ✅ ĐƠN GIẢN HÓA: BỎ TẤT CẢ LOGIC TỰ ĐỘNG, DÙNG HARDCODED VALUES
      // Reset model transforms
      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      model.updateMatrixWorld(true);
      
      // ✅ HARDCODED SCALE - Tách biệt scale cho từng model
      // ✅ KYDAI (modelId '3') dùng scale 0.1, Ngô Môn (4) nhỏ hơn, các model khác dùng 0.028
      const hardcodedScale = modelId === '3' ? 0.1 : modelId === '4' ? 0.02 : 0.028;
      model.scale.setScalar(hardcodedScale);
      model.updateMatrixWorld(true);
      
      // ✅ DÙNG THREE.JS BOX3 HELPER ĐỂ CĂN GIỮA MODEL HOÀN HẢO
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      
      // ✅ Đưa model về center (0,0,0) - Dùng Three.js Box3 helper
      model.position.x = -center.x;
      model.position.y = -center.y;
      model.position.z = -center.z;
      model.updateMatrixWorld(true);
      
      // ✅ KIỂM TRA LẠI SAU KHI POSITION - Đảm bảo model nằm chính giữa
      const finalBox = new THREE.Box3().setFromObject(model);
      const finalCenter = finalBox.getCenter(new THREE.Vector3());
      
      // ✅ Nếu center vẫn lệch, căn lại một lần nữa
      if (Math.abs(finalCenter.x) > 0.001 || Math.abs(finalCenter.y) > 0.001 || Math.abs(finalCenter.z) > 0.001) {
        model.position.x -= finalCenter.x;
        model.position.y -= finalCenter.y;
        model.position.z -= finalCenter.z;
        model.updateMatrixWorld(true);
      }
      
      // ✅ ĐIỀU CHỈNH VỊ TRÍ ĐỂ MODEL NẰM CHÍNH GIỮA VÀ HẠ XUỐNG
      // Thêm offset để đưa model về giữa màn hình, hạ xuống và dịch sang trái
      const offsetX = -0.45; // Dịch sang trái 0.45 units
      const offsetY = -0.75; // Hạ xuống 0.85 units
      const offsetZ = 0.0; // Không offset Z
      
      model.position.x += offsetX;
      model.position.y += offsetY;
      model.position.z += offsetZ;
      model.updateMatrixWorld(true);
      
      // ✅ STORE SCALE INFO FOR ZOOM LIMITS
      (model as any).originalScale = hardcodedScale;
      (model as any).minScale = hardcodedScale * 0.5;  // MIN: 50%
      (model as any).maxScale = hardcodedScale * 3.0;  // MAX: 300%
      
      // ✅ KIỂM TRA LẠI SAU KHI ÁP DỤNG OFFSET
      const finalBoxAfterOffset = new THREE.Box3().setFromObject(model);
      const finalCenterAfterOffset = finalBoxAfterOffset.getCenter(new THREE.Vector3());
      
      console.log('✅ [SIMPLE] Hardcoded scale và center (TO HƠN + HẠ XUỐNG):', {
        scale: hardcodedScale,
        initialCenter: { x: center.x.toFixed(3), y: center.y.toFixed(3), z: center.z.toFixed(3) },
        finalCenter: { x: finalCenter.x.toFixed(3), y: finalCenter.y.toFixed(3), z: finalCenter.z.toFixed(3) },
        offsetApplied: { x: offsetX.toFixed(3), y: offsetY.toFixed(3), z: offsetZ.toFixed(3) },
        position: { x: model.position.x.toFixed(3), y: model.position.y.toFixed(3), z: model.position.z.toFixed(3) },
        centerAfterOffset: { x: finalCenterAfterOffset.x.toFixed(3), y: finalCenterAfterOffset.y.toFixed(3), z: finalCenterAfterOffset.z.toFixed(3) },
        isCentered: Math.abs(finalCenterAfterOffset.x) < 0.01 && Math.abs(finalCenterAfterOffset.y) < 0.01 && Math.abs(finalCenterAfterOffset.z) < 0.01
      });

      // 🎯 ADD MODEL TO SCENE - ĐƠN GIẢN
      if (sceneRef.current && rendererRef.current && cameraRef.current) {
        log('🎯 Adding model to scene...');
        
        // Clear existing models but keep lights
        const lights = sceneRef.current.children.filter(child => 
          child instanceof THREE.Light || child.type.includes('Light')
        );
        sceneRef.current.clear();
          
        // Re-add lights
        lights.forEach(light => sceneRef.current?.add(light));
          
        // Ensure lighting is set up
        if (lights.length === 0) {
          setupLighting(sceneRef.current, modelId);
        }
        
        // 🎯 ENSURE MODEL IS VISIBLE
        model.visible = true;
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.visible = true;
            if (child.material) {
              child.material.visible = true;
              child.material.transparent = false;
              child.material.opacity = 1.0;
            }
          }
        });
        
        // Add model to scene
        if (!sceneRef.current.children.includes(model)) {
          sceneRef.current.add(model);
        }
        modelRef.current = model;
          
        // ✅ CRITICAL: Force update tất cả materials
        model.traverse((child: any) => {
                if (child.isMesh && child.material) {
                  if (child.material.map) {
                    child.material.map.needsUpdate = true;
              // @ts-ignore
              child.material.map.colorSpace = THREE.SRGBColorSpace;
                  }
                  child.material.needsUpdate = true;
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.visible = true;
            if (child.material.vertexColors !== undefined) {
              child.material.vertexColors = false;
            }
                }
              });
          
        // ✅ HARDCODED CAMERA - Đơn giản và ổn định cho iPhone 12 Pro Max
        if (cameraRef.current && cameraRef.current instanceof THREE.PerspectiveCamera) {
          const screenDims = Dimensions.get('screen');
          const aspectRatio = screenDims.width / screenDims.height;
          
          // ✅ HARDCODED CAMERA POSITION - Cố định cho iPhone 12 Pro Max
          cameraRef.current.position.set(0, 0, 3.5); // Camera ở phía trước, khoảng cách cố định
          cameraRef.current.lookAt(0, 0, 0); // Nhìn vào center
          cameraRef.current.aspect = aspectRatio;
          cameraRef.current.updateProjectionMatrix();
          
          console.log('📷 [CAMERA] Hardcoded camera setup:', {
            position: { x: 0, y: 0, z: 3.5 },
            lookAt: { x: 0, y: 0, z: 0 },
            aspectRatio: aspectRatio.toFixed(3)
          });
        }
        
        // 🎯 FORCE RENDER IMMEDIATELY - Multiple times to ensure visibility & color
        if (rendererRef.current && cameraRef.current) {
          // ✅ Force render ngay lập tức
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          
          // ✅ Force render lại sau 100ms để đảm bảo textures được apply
          setTimeout(() => {
            if (rendererRef.current && cameraRef.current && sceneRef.current) {
              rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
          }, 100);
          
          // ✅ Force render lại sau 300ms để đảm bảo màu sắc đúng
          setTimeout(() => {
            if (rendererRef.current && cameraRef.current && sceneRef.current) {
              // Force update materials một lần nữa
              model.traverse((child: any) => {
                if (child.isMesh && child.material && child.material.map) {
                  child.material.map.needsUpdate = true;
                  child.material.needsUpdate = true;
                }
              });
              rendererRef.current.render(sceneRef.current, cameraRef.current);
              // ✅ Giảm log
              // console.log('✅ Final render with textures applied');
            }
          }, 300);
        }
        
        log('✅ Model added to scene successfully');
        log('🎯 Scene children count:', sceneRef.current.children.length);
        log('🎯 Model position:', model.position);
        log('🎯 Model scale:', model.scale.x);
        log('🎯 Model visible:', model.visible);
        
        // 🎯 DEBUG: Check if model has meshes
        if (DEBUG) {
          let meshCount = 0;
          model.traverse((child: any) => {
            if (child.isMesh) {
              meshCount++;
              log(`📦 Mesh found: ${child.name || 'unnamed'}, visible: ${child.visible}`);
        }
          });
          log(`🎯 Total meshes in model: ${meshCount}`);
        }
        
      } else {
        console.error('❌ Scene/Renderer/Camera not available for adding model');
        setError('Không thể khởi tạo 3D scene');
        return;
      }
      
      setLoadingProgress(100);
      setIsLoading(false);
      setLoadingText('');
      isLoadingModelRef.current = false; // 🎯 Reset loading flag
      
      // ✅ CRITICAL LOG: Model render status - Giảm log chi tiết
      // console.log('🎉 Model setup complete!');
      
      // ✅ SHOW GESTURE HINT KHI MODEL LOAD XONG - Từ PokemonARViewer
      log('🎯 Showing gesture hint for loaded model');
      setShowGestureHint(true);
      
      // ✅ AUTO-HIDE GESTURE HINT AFTER 5 SECONDS
      if (gestureHintTimeoutRef.current) {
        clearTimeout(gestureHintTimeoutRef.current);
      }
      gestureHintTimeoutRef.current = setTimeout(() => {
        log('🎯 Auto-hiding gesture hint after 5 seconds');
        setShowGestureHint(false);
      }, 5000);
      
      // ✅ BỎ TỰ ĐỘNG KÍCH HOẠT - Để người dùng tự bấm nút "Tiếp tục" sau khi xem mô hình
      // User sẽ tự quyết định khi nào chuyển sang quiz bằng cách bấm nút "Tiếp tục"

    } catch (error) {
      console.error('❌ Error loading model:', error);
      setError('Không thể tải mô hình 3D');
      setIsLoading(false);
      isLoadingModelRef.current = false; // 🎯 Reset loading flag on error
    }
  };

  // ⚡ PERFORMANCE OPTIMIZED 3D CONTEXT
  const onContextCreate = async (gl: any) => {
    try {
      log('🎬 Creating optimized 3D context...');

      // Setup Three.js
      const scene = new THREE.Scene();
      // 🎯 CRITICAL: FOV 50 để model không bị méo, aspect ratio đúng
      const camera = new THREE.PerspectiveCamera(
        50, // FOV 50 degrees (thay vì 60) để model vừa màn hình hơn
        gl.drawingBufferWidth / gl.drawingBufferHeight, 
        0.1, 
        100
      );
      const renderer = new Renderer({ gl });
      
      // Store references
      sceneRef.current = scene;
      cameraRef.current = camera;
      rendererRef.current = renderer;
      
      // 📱 SETUP OPTIMAL CAMERA từ PokemonARViewer
      setupOptimalCamera(camera);

      // 📱 ENHANCED QUALITY SETTINGS - Áp dụng cho TẤT CẢ thiết bị
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      
      // ✅ Tăng pixel ratio để chất lượng cao hơn cho TẤT CẢ thiết bị
      const pixelRatio = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 2) : 2, 2.5); // ✅ Tăng chất lượng cho mọi thiết bị
      renderer.setPixelRatio(pixelRatio);
      
      renderer.setClearColor(0x000000, 0); // Transparent background
      
      // 🎯 ENABLE ALPHA CHANNEL for transparency
      // @ts-ignore
      renderer.alpha = true;
      
      // 🎨 CẤU HÌNH RENDERER - Enhanced Quality Settings cho TẤT CẢ thiết bị
      // @ts-ignore
      renderer.outputColorSpace = THREE.SRGBColorSpace; // ✅ Hệ màu chuẩn
        // @ts-ignore
      renderer.physicallyCorrectLights = true; // ✅ Sử dụng ánh sáng vật lý
      // @ts-ignore
      renderer.toneMapping = THREE.ACESFilmicToneMapping; // ✅ Tone màu điện ảnh
      // @ts-ignore
      renderer.toneMappingExposure = 1.2; // ✅ Tăng độ sáng tổng thể
      
      // ✅ Enhanced quality settings cho TẤT CẢ thiết bị
      // @ts-ignore
      renderer.antialias = true; // ✅ Bật khử răng cưa để hình ảnh mượt hơn
        // @ts-ignore
      renderer.powerPreference = 'high-performance'; // ✅ Ưu tiên hiệu năng cao
      
      // ✅ Enhanced quality đã được áp dụng cho TẤT CẢ thiết bị ở trên
      log('📱 Enhanced camera quality enabled for all devices');
      
      // ⚡ Shadow settings - Tắt shadows cho tất cả thiết bị để tối ưu performance
      renderer.shadowMap.enabled = false; // ✅ Tắt shadows để tăng FPS cho tất cả thiết bị
      // @ts-ignore
      renderer.powerPreference = 'high-performance';

      // Setup basic lighting
      setupLighting(scene, modelId);

      log('⚡ 3D context ready for model loading');
      
      // 📱 ADAPTIVE FPS cho TẤT CẢ thiết bị - GIẢM LAG
      let lastTime = 0;
      let lastSafetyCheck = 0;
      const targetFPS = 24; // ✅ FPS cố định 24 cho tất cả thiết bị (chất lượng tốt)
      const frameInterval = 1000 / targetFPS;
      const safetyCheckInterval = 2500; // ✅ Check safety mỗi 2.5 giây
      
      const animate = (currentTime: number) => {
        animationRef.current = requestAnimationFrame(animate);
        
        if (currentTime - lastTime < frameInterval) {
          return;
        }
        lastTime = currentTime;

        // 🎯 MODEL POSITION MANAGEMENT - TỐI ƯU: Chỉ check khi cần thiết
        // ✅ Giảm lag: Chỉ check safety mechanism mỗi 2.5 giây
        if (modelRef.current && camera && (currentTime - lastSafetyCheck) > safetyCheckInterval) {
          ensureModelInView(modelRef.current, camera);
          lastSafetyCheck = currentTime;
        }
        
        // 🎯 RENDER - Chỉ render khi có model để giảm lag
        if (renderer && scene && camera && modelRef.current) {
          // 🎯 AUTO ROTATION - Tự xoay model từ trái sang phải khi user không chạm
          const deltaSeconds = frameInterval / 1000;
          if (!isUserRotatingRef.current) {
            // 🎯 Đổi chiều: xoay từ phải sang trái (giảm góc Y theo thời gian)
            modelRef.current.rotation.y -= AUTO_ROTATE_SPEED * deltaSeconds;
          }

        renderer.render(scene, camera);
        gl.endFrameEXP();
        }
        // ✅ Không render scene trống để giảm lag
      };

      animate(0);
      log(`✅ 3D context ready (${targetFPS} FPS - Enhanced quality for all devices)!`);
      
      // 🎯 MARK CONTEXT AS READY
      contextReadyRef.current = true;
      log('✅ Context ready flag set to true - model can now be loaded');

    } catch (error) {
      console.error('❌ Error creating 3D context:', error);
      setError('Không thể khởi tạo 3D viewer');
      contextReadyRef.current = false;
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // ⚡ RENDER UI
  if (hasPermission === null) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#EFEAA8" />
          <Text style={styles.statusText}>Đang yêu cầu quyền camera...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (hasPermission === false) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>❌ Không có quyền camera</Text>
          <TouchableOpacity style={styles.button} onPress={onBack}>
            <Text style={styles.buttonText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Camera Background - Enhanced Quality */}
      <CameraView 
        style={styles.camera} 
        facing="back"
        enableTorch={false}
        zoom={0}
      />

      {/* 3D View */}
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
      />

      {/* Gesture Layer - Vuốt để xoay, chụm để zoom */}
      <View
        style={styles.gestureLayer}
        {...panResponder.panHandlers}
      />

      {/* ✅ Đã xóa header theo yêu cầu */}

      {/* Loading Overlay - Đã ẩn theo yêu cầu */}
      {false && isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#EFEAA8" />
            <Text style={styles.loadingText}>
              {loadingText || '⚡ Đang tối ưu mô hình cho điện thoại...'}
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${loadingProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{loadingProgress}%</Text>
            
            <Text style={styles.systemInfo}>🏛️ Museum AR System</Text>
          </View>
        </View>
      )}

      {/* Error Overlay */}
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={onBack}>
            <Text style={styles.buttonText}>Quay lại</Text>
            </TouchableOpacity>
        </View>
      )}

      {/* Gesture Hint - Từ PokemonARViewer */}
      {!isLoading && !error && modelRef.current && showGestureHint && (
        <View style={styles.gestureHintContainer}>
          <View style={styles.gestureHint}>
            <Text style={styles.gestureHintText}>
              👆 Vuốt để xoay • 🤏 Chụm để zoom
            </Text>
          </View>
        </View>
      )}

      {/* Controls - Footer */}
      {!isLoading && !error && modelRef.current && (
        <View style={styles.controls} pointerEvents="box-none">
          {/* ✅ Xóa text "CHIẾN HẠM LỊCH SỬ" theo yêu cầu */}
          {/* <Text style={styles.instructionText}>
            📱 {MODELS[modelId as keyof typeof MODELS]?.name || 'Mô hình 3D'} • Tối ưu cho iPhone 12 Pro Max
          </Text> */}
          <View style={styles.buttonRow} pointerEvents="auto">
            <TouchableOpacity style={styles.backControlButton} onPress={onBack}>
              <Text style={styles.backControlButtonText}>← Trở về</Text>
            </TouchableOpacity>
          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
              <Text style={styles.continueButtonText}>Tiếp tục</Text>
          </TouchableOpacity>
          </View>
        </View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // ✅ Theo pattern PokemonARViewer - màu đen thuần
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glView: {
    flex: 1, // ✅ Theo pattern PokemonARViewer - chiếm toàn bộ không gian
    backgroundColor: 'transparent',
  },
  gestureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1001, // ✅ Theo pattern PokemonARViewer - cao hơn để capture gestures
    elevation: 1001, // Android elevation
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // ✅ Xóa màu đỏ, dùng đen trong suốt
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textLight,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // 🎯 LOADING STYLES - Từ PokemonARViewer
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent', // ✅ Xóa màu đỏ overlay
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: Colors.backgroundLight,
    paddingHorizontal: 32,
    paddingVertical: 28,
    borderRadius: 24,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 320,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  progressBarContainer: {
    width: 200,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 15,
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF8C42', // ✅ Cam thường thay vì đỏ
    borderRadius: 3,
  },
  progressText: {
    color: Colors.textDark,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  systemInfo: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // ✅ Xóa màu đỏ, dùng đen trong suốt
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 5,
  },
  statusText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1002, // ✅ Tăng zIndex cao hơn gesture layer để footer có thể click được
    alignItems: 'center',
    elevation: 1002, // Android elevation
  },
  instructionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // ✅ Xóa màu đỏ, dùng đen trong suốt
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 12,
    width: '100%',
    lineHeight: 18,
  },
  button: {
    backgroundColor: Colors.buttonSecondary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.buttonSecondaryText,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
    justifyContent: 'center',
  },
  backControlButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF8C42', // ✅ Cam thường thay vì đỏ
    minHeight: 52,
    justifyContent: 'center',
  },
  backControlButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textLight,
    letterSpacing: 0.3,
  },
  continueButton: {
    flex: 1,
    backgroundColor: Colors.buttonPrimary,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.buttonPrimaryText,
  },
  // 🎯 GESTURE HINT STYLES - Từ PokemonARViewer - Cải thiện layout
  gestureHintContainer: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'none',
  },
  gestureHint: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // ✅ Xóa màu đỏ, dùng đen trong suốt
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#FF8C42', // ✅ Cam thường thay vì đỏ
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  gestureHintText: {
    color: '#FF8C42', // ✅ Cam thường thay vì đỏ
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

export default Museum3DViewer;

