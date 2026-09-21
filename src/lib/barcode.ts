/**
 * Clean Code 128 Barcode Generator for Summa Plus
 * Generates valid Code 128 (subset B) SVG bars directly without external dependencies.
 */

// Code 128 Character Patterns (Subset B)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '23311120'
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export function generateBarcodePattern(text: string): string {
  const cleanText = text.trim() || 'SUMMA';
  const codes: number[] = [START_CODE_B];

  // Encode each char (ASCII 32 to 126)
  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i);
    const val = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(val);
  }

  // Calculate Checksum
  let checksum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    checksum += codes[i] * i;
  }
  codes.push(checksum % 103);
  codes.push(STOP_CODE);

  // Convert codes to pattern string
  let pattern = '';
  for (const code of codes) {
    pattern += CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
  }
  return pattern;
}

export interface BarcodeSVGProps {
  value: string;
  label?: string;
  width?: number;
  height?: number;
  showText?: boolean;
}

/**
 * Generates an SVG string representation of a Code 128 Barcode
 */
export function generateBarcodeSVGString({
  value,
  label,
  width = 240,
  height = 70,
  showText = true,
}: BarcodeSVGProps): string {
  const pattern = generateBarcodePattern(value);
  
  // Calculate total module width
  let totalModules = 0;
  for (let i = 0; i < pattern.length; i++) {
    totalModules += parseInt(pattern[i], 10);
  }

  const quietZone = 10;
  const totalWidth = totalModules + (quietZone * 2);
  const barHeight = showText ? height - 18 : height;

  let x = quietZone;
  let isBar = true;
  let rects = '';

  for (let i = 0; i < pattern.length; i++) {
    const moduleWidth = parseInt(pattern[i], 10);
    if (isBar) {
      rects += `<rect x="${x}" y="0" width="${moduleWidth}" height="${barHeight}" fill="#24126E" />`;
    }
    x += moduleWidth;
    isBar = !isBar;
  }

  const textElement = showText
    ? `<text x="${totalWidth / 2}" y="${height - 2}" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="#24126E">${label || value}</text>`
    : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="${width}" height="${height}" style="background-color: transparent;">
      ${rects}
      ${textElement}
    </svg>
  `;
}

/**
 * Helper to compress or resize user uploaded photo in the browser before saving to localStorage
 */
export function compressImageFile(file: File, maxWidth = 900, maxHeight = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Kon afbeelding niet laden'));
    };
    reader.onerror = (err) => reject(err);
  });
}
