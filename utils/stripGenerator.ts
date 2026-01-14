import { PhotoData, Template } from '../types';

interface GenerateOptions {
  photos: PhotoData[];
  eventName: string;
  dateStr: string;
  template: Template;
}

export const generatePhotoStrip = async (options: GenerateOptions): Promise<string> => {
  const { photos, eventName, dateStr, template } = options;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // STRICT CONFIGURATION based on User Guide
  // Ukuran Kanvas Total: 600px x 1490px
  const STRIP_WIDTH = 600;
  const STRIP_HEIGHT = 1490;
  
  // Photo Dimensions
  const PHOTO_WIDTH = 520; 
  const PHOTO_HEIGHT = 390; 
  
  // Fixed Y Positions for 3 photos
  const PHOTO_POSITIONS = [160, 580, 1000];

  canvas.width = STRIP_WIDTH;
  canvas.height = STRIP_HEIGHT;

  // 1. Draw Background
  if (template.backgroundImage) {
    const bgImg = new Image();
    bgImg.src = template.backgroundImage;
    await new Promise<void>((resolve) => {
        bgImg.onload = () => resolve();
        bgImg.onerror = () => resolve(); // Proceed even if fail
    });
    // Draw image to cover exact dimensions
    ctx.drawImage(bgImg, 0, 0, STRIP_WIDTH, STRIP_HEIGHT);
  } else {
    // Solid Color fallback
    ctx.fillStyle = template.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Draw Header Area (Y: 0 - 160px)
  // Only draw text if it's not a custom image, or if we want to overlay text on custom image
  
  ctx.fillStyle = template.textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Event Name Centered in Header Area (Center of 0-160 is 80)
  ctx.font = 'bold 52px "Fredoka", sans-serif';
  ctx.fillText(eventName.toUpperCase(), STRIP_WIDTH / 2, 80);
  
  // Decorative Line (Only for standard templates)
  if (!template.backgroundImage) {
    ctx.strokeStyle = template.accentColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, 130);
    ctx.lineTo(STRIP_WIDTH - 40, 130);
    ctx.stroke();
  }

  // 3. Draw Photos at Fixed Positions
  // We limit to max 3 photos to match the template spec
  const photosToDraw = photos.slice(0, 3);
  
  for (let i = 0; i < photosToDraw.length; i++) {
    const photo = photosToDraw[i];
    const targetY = PHOTO_POSITIONS[i]; // 160, 580, or 1000

    const img = new Image();
    img.src = photo.dataUrl;
    
    // Wait for image to load
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    // Calculate 'contain' fit for the photo box
    const scale = Math.max(PHOTO_WIDTH / img.width, PHOTO_HEIGHT / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (STRIP_WIDTH - w) / 2;
    const y = targetY + (PHOTO_HEIGHT - h) / 2;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect((STRIP_WIDTH - PHOTO_WIDTH) / 2, targetY, PHOTO_WIDTH, PHOTO_HEIGHT);
    ctx.clip();
    
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    // Border around photo
    ctx.strokeStyle = template.borderColor || template.accentColor;
    ctx.lineWidth = template.backgroundImage ? 2 : 4; 
    ctx.strokeRect((STRIP_WIDTH - PHOTO_WIDTH) / 2, targetY, PHOTO_WIDTH, PHOTO_HEIGHT);
  }

  // 4. Draw Footer Area (Y: 1390 - 1490px)
  // Center of 1390 and 1490 is 1440.
  const footerCenterY = 1440;
  
  ctx.fillStyle = template.textColor;
  ctx.font = '28px "Inter", sans-serif';
  ctx.globalAlpha = 0.8;
  ctx.fillText(dateStr, STRIP_WIDTH / 2, footerCenterY);
  ctx.globalAlpha = 1.0;

  return canvas.toDataURL('image/png', 1.0);
};