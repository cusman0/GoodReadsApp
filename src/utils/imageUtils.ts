/**
 * Utility for client-side image resizing and compression
 * Resizes image to 256x256, center-crops to square, and compresses to JPEG (quality ~0.8)
 * Ensures final base64 data URL size is under 100 KB.
 */
declare const document: any;
declare const Image: any;

export async function resizeImageTo256Jpeg(inputUri: string): Promise<string> {
  const cleanUri = (inputUri || '').trim();
  if (!cleanUri) return '';

  // 1. Browser / DOM environment with HTMLCanvasElement
  if (typeof document !== 'undefined') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Canvas 2D context not available'));
          }

          // Center-crop to square
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 256, 256);

          let quality = 0.8;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);

          // If over 100 KB (~136,000 base64 chars), recompress with lower quality
          if (dataUrl.length > 100 * 1024 * 1.33) {
            quality = 0.65;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          if (dataUrl.length > 150000) {
            quality = 0.45;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for canvas resize.'));
      img.src = cleanUri;
    });
  }

  // 2. React Native non-DOM environment fallback
  try {
    const response = await fetch(cleanUri);
    const blob = await response.blob();
    if (blob.size > 5 * 1024 * 1024) {
      throw new Error('Image file is larger than 5 MB.');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (!result) {
          return reject(new Error('Failed to convert image to data URL.'));
        }
        if (result.length > 150000) {
          return reject(
            new Error('Image is too large. Final compressed size must be under 100 KB.')
          );
        }
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to read image as data URL.'));
      reader.readAsDataURL(blob);
    });
  } catch (err: any) {
    if (cleanUri.startsWith('data:image/')) {
      if (cleanUri.length > 150000) {
        throw new Error('Image data is too large. Final compressed size must be under 100 KB.');
      }
      return cleanUri;
    }
    throw err;
  }
}
