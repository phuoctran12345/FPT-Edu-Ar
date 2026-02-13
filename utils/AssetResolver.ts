import { Asset } from 'expo-asset';

const MODELS: Record<string, number> = {
  'ShipWithPhao.glb': require('../assets/models/ShipWithPhao.glb'),
  'HamTank1.glb': require('../assets/models/HamTank1.glb'),
  'KYDAI.glb': require('../assets/models/KYDAI.glb'),
  'ngomon.glb': require('../assets/models/ngomon.glb'),
};

const FALLBACK = MODELS['ShipWithPhao.glb'];

function getModuleForPath(filePath: string): number {
  for (const name of Object.keys(MODELS)) {
    if (filePath.includes(name)) return MODELS[name];
  }
  return FALLBACK;
}

export class AssetResolver {
  private static instance: AssetResolver;
  private assetCache: Map<string, Asset> = new Map();

  static getInstance(): AssetResolver {
    if (!AssetResolver.instance) {
      AssetResolver.instance = new AssetResolver();
    }
    return AssetResolver.instance;
  }

  async resolveAsset(filePath: string): Promise<string> {
    try {
      if (this.assetCache.has(filePath)) {
        return this.assetCache.get(filePath)!.localUri!;
      }
      const moduleId = getModuleForPath(filePath);
      const asset = Asset.fromModule(moduleId);
      await asset.downloadAsync();
      this.assetCache.set(filePath, asset);
      return asset.localUri!;
    } catch (error) {
      console.error(`❌ Error resolving asset ${filePath}:`, error);
      throw error;
    }
  }

  clearCache() {
    this.assetCache.clear();
  }

  getCacheInfo() {
    return { cachedAssets: Array.from(this.assetCache.keys()), cacheSize: this.assetCache.size };
  }
}

export const assetResolver = AssetResolver.getInstance();
