// Asset file path utilities

import type { AssetType } from '../types';

// ============================================
// Asset folder mapping
// ============================================

const ASSET_FOLDERS: Record<AssetType, string> = {
  map: 'maps',
  'agent-icon': 'agents-icon',
  'agent-banner': 'agent-banner',
};

// ============================================
// Path generation
// ============================================

/**
 * Generate the file path for an asset image
 */
export function getAssetFilePath(assetName: string, assetType: AssetType): string {
  const folder = ASSET_FOLDERS[assetType];
  return `/img/${folder}/${assetName}.png`;
}

/**
 * Get the folder name for an asset type
 */
export function getAssetFolder(assetType: AssetType): string {
  return ASSET_FOLDERS[assetType];
}
