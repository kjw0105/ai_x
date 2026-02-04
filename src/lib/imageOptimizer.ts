/**
 * Image optimization utilities for reducing token usage
 * Resizes images to max dimensions and converts to JPEG for efficiency
 */

export interface OptimizedImage {
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

/**
 * Resize and compress an image for optimal token usage
 * @param dataUrl - Base64 data URL of the image
 * @param maxDimension - Maximum width or height (default 2048)
 * @param quality - JPEG quality 0-1 (default 0.85)
 */
export async function optimizeImage(
  dataUrl: string,
  maxDimension: number = 2048,
  quality: number = 0.85
): Promise<OptimizedImage> {
  const originalSize = dataUrl.length;

  // Create image element
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  const originalWidth = img.width;
  const originalHeight = img.height;

  // Calculate new dimensions maintaining aspect ratio
  let newWidth = originalWidth;
  let newHeight = originalHeight;

  if (Math.max(originalWidth, originalHeight) > maxDimension) {
    const scaleFactor = maxDimension / Math.max(originalWidth, originalHeight);
    newWidth = Math.floor(originalWidth * scaleFactor);
    newHeight = Math.floor(originalHeight * scaleFactor);
  }

  // Create canvas and resize
  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Use high-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw resized image
  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  // Convert to JPEG with quality setting
  const optimizedDataUrl = canvas.toDataURL("image/jpeg", quality);
  const optimizedSize = optimizedDataUrl.length;

  console.log(
    `[Image Optimizer] ${originalWidth}×${originalHeight} → ${newWidth}×${newHeight}, ` +
    `${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB ` +
    `(${((1 - optimizedSize / originalSize) * 100).toFixed(1)}% reduction)`
  );

  return {
    dataUrl: optimizedDataUrl,
    width: newWidth,
    height: newHeight,
    originalSize,
    optimizedSize,
    compressionRatio: optimizedSize / originalSize,
  };
}

/**
 * Optimize multiple images in parallel
 */
export async function optimizeImages(
  dataUrls: string[],
  maxDimension?: number,
  quality?: number
): Promise<OptimizedImage[]> {
  return Promise.all(
    dataUrls.map((dataUrl) => optimizeImage(dataUrl, maxDimension, quality))
  );
}

/**
 * Calculate estimated token usage for an image
 * Based on OpenAI's vision token calculation
 */
export function estimateImageTokens(width: number, height: number): number {
  // OpenAI calculates tokens based on 512px tiles
  const tilesWidth = Math.ceil(width / 512);
  const tilesHeight = Math.ceil(height / 512);
  const tiles = tilesWidth * tilesHeight;

  // Base cost: 85 tokens per tile + 85 base tokens
  return tiles * 170 + 85;
}
