import sharp from "sharp";

/**
 * Smart crop function that trims transparent edges and returns x, y offset and scale.
 * Always treats the original image width as the base canvas size.
 * 
 * @param imageUrl - URL or base64 string of the image
 * @returns Object with x, y offsets and scale factor
 */
export async function smartCrop(imageUrl) {
  // Handle both URL and base64
  let inputBuffer;
  
  if (imageUrl.startsWith('data:')) {
    // Base64 string
    const base64Data = imageUrl.includes(",") 
      ? imageUrl.split(",")[1] 
      : imageUrl.replace(/^data:image\/\w+;base64,/, "");
    inputBuffer = Buffer.from(base64Data, "base64");
  } else {
    // URL - fetch the image
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    inputBuffer = Buffer.from(arrayBuffer);
  }

  // Get original dimensions
  const originalMetadata = await sharp(inputBuffer).metadata();
  const originalWidth = originalMetadata.width || 0;
  const originalHeight = originalMetadata.height || 0;

  // Trim transparent edges and get trim info
  const { data: trimmedBuffer, info } = await sharp(inputBuffer)
    .trim() // Removes transparent borders
    .toBuffer({ resolveWithObject: true });

  const trimmedWidth = info.width;
  const trimmedHeight = info.height;

  // Trim offsets (where the trimmed content starts in original image)
  const x = Math.abs(info.trimOffsetLeft || 0);
  const y = Math.abs(info.trimOffsetTop || 0);

  // Normalize x and y to 0-1 range (percentage of original dimensions)
  const normalizedX = x / originalWidth;
  const normalizedY = y / originalHeight;

  const scale = trimmedWidth / originalWidth;

  // Convert trimmed buffer to base64
  const base64 = `data:image/png;base64,${trimmedBuffer.toString('base64')}`;

  return {
    x: normalizedX,
    y: normalizedY,
    scale,
    trimmedWidth,
    trimmedHeight,
    originalWidth,
    originalHeight,
    base64,
  };
}