// Model 3D — chỉ các file thực sự có trong assets/models

import { GLBModelConfig } from './DynamicGLBLoader';

export interface ModelData {
  id: string;
  name: string;
  modelPath: string;
  description: string;
  scale: number;
}

const defaultPosition = { x: 0, y: -0.5, z: 0 };
const defaultRotation = { x: 0, y: 0, z: 0 };

export const GLB_MODEL_DATABASE: Record<string, GLBModelConfig> = {
  ship: {
    id: 'ship',
    name: 'Chiến hạm',
    filePath: 'assets/models/ShipWithPhao.glb',
    scale: 0.5,
    position: defaultPosition,
    rotation: defaultRotation,
    animations: [],
  },
  hamtank: {
    id: 'hamtank',
    name: 'Xe tăng HamTank',
    filePath: 'assets/models/HamTank1.glb',
    scale: 0.5,
    position: defaultPosition,
    rotation: defaultRotation,
    animations: [],
  },
  kydai: {
    id: 'kydai',
    name: 'Đài tưởng niệm KYDAI',
    filePath: 'assets/models/KYDAI.glb',
    scale: 0.5,
    position: defaultPosition,
    rotation: defaultRotation,
    animations: [],
  },
  ngomon: {
    id: 'ngomon',
    name: 'Ngô Môn Huế',
    filePath: 'assets/models/ngomon.glb',
    scale: 0.5,
    position: defaultPosition,
    rotation: defaultRotation,
    animations: [],
  },
};

export const MODEL_DATABASE: Record<string, ModelData> = {
  ship: { id: 'ship', name: 'Chiến hạm', modelPath: 'ShipWithPhao.glb', description: 'Chiến hạm lịch sử', scale: 0.5 },
  hamtank: { id: 'hamtank', name: 'Xe tăng HamTank', modelPath: 'HamTank1.glb', description: 'Xe tăng', scale: 0.5 },
  kydai: { id: 'kydai', name: 'Đài KYDAI', modelPath: 'KYDAI.glb', description: 'Đài tưởng niệm', scale: 0.5 },
  ngomon: { id: 'ngomon', name: 'Ngô Môn', modelPath: 'ngomon.glb', description: 'Cổng Hoàng thành Huế', scale: 0.5 },
};

export function getGLBModelConfig(modelId: string): GLBModelConfig | null {
  return GLB_MODEL_DATABASE[modelId] ?? null;
}

export function getAllGLBModels(): GLBModelConfig[] {
  return Object.values(GLB_MODEL_DATABASE);
}

export function isValidGLBModelId(modelId: string): boolean {
  return modelId in GLB_MODEL_DATABASE;
}

export function getModelFromQRData(qrData: string): ModelData | null {
  try {
    const parsed = JSON.parse(qrData);
    const modelId = parsed.modelId ?? parsed.id;
    if (modelId && MODEL_DATABASE[modelId]) {
      const model = { ...MODEL_DATABASE[modelId] };
      if (parsed.scale != null) model.scale = parsed.scale;
      return model;
    }
  } catch {
    if (MODEL_DATABASE[qrData]) return MODEL_DATABASE[qrData];
  }
  return null;
}

export function getGLBModelFromQRData(qrData: string): GLBModelConfig | null {
  try {
    const parsed = JSON.parse(qrData);
    const modelId = parsed.modelId ?? parsed.id;
    if (modelId && GLB_MODEL_DATABASE[modelId]) {
      const model = { ...GLB_MODEL_DATABASE[modelId] };
      if (parsed.scale != null) model.scale = parsed.scale;
      if (parsed.position) model.position = parsed.position;
      if (parsed.rotation) model.rotation = parsed.rotation;
      return model;
    }
  } catch {
    if (GLB_MODEL_DATABASE[qrData]) return GLB_MODEL_DATABASE[qrData];
  }
  return null;
}

export function generateQRData(modelId: string, customScale?: number): string {
  if (!MODEL_DATABASE[modelId] && !GLB_MODEL_DATABASE[modelId]) {
    throw new Error(`Model ${modelId} không tồn tại`);
  }
  return customScale != null ? JSON.stringify({ modelId, scale: customScale }) : modelId;
}

export function getAllModelIds(): string[] {
  return [...new Set([...Object.keys(MODEL_DATABASE), ...Object.keys(GLB_MODEL_DATABASE)])];
}

export function getModelInfo(modelId: string) {
  const glb = getGLBModelConfig(modelId);
  const legacy = MODEL_DATABASE[modelId];
  return { glb, legacy, hasGLB: !!glb, hasLegacy: !!legacy, exists: !!glb || !!legacy };
}

export const SAMPLE_QR_DATA = {
  ship: 'ship',
  hamtank: 'hamtank',
  kydai: 'kydai',
  ngomon: 'ngomon',
  shipGLB: JSON.stringify({ modelId: 'ship', scale: 0.5 }),
  hamtankGLB: JSON.stringify({ modelId: 'hamtank', scale: 0.5 }),
};
