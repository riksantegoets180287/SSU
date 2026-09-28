/**
 * EAN-13 Barcode Generator for Summa Plus
 * Generates valid EAN-13 SVG bars (13 numeric digits including check digit).
 */

// EAN-13 encoding tables
// First digit (number system) determines which parity pattern to use for the left 6 digits
const PARITY_PATTERNS: Record<string, string[]> = {
  '0': ['LLLLLL', 'RRRRRR'],
  '1': ['LLGLGG', 'RRRRRR'],
  '2': ['LLGGLG', 'RRRRRR'],
  '3': ['LLGGGL', 'RRRRRR'],
  '4': ['LGLLGG', 'RRRRRR'],
  '5': ['LGGLLG', 'RRRRRR'],
  '6': ['LGGGLL', 'RRRRRR'],
  '7': ['LGLGLG', 'RRRRRR'],
  '8': ['LGLGGL', 'RRRRRR'],
  '9': ['LGGLGL', 'RRRRRR'],
};

// L-pattern (odd parity) for digits 0-9
const L_PATTERNS: string[] = [
  '0001101', '0011001', '0010011', '0111101', '0100011',
  '0110001', '0101111', '0111011', '0110111', '0001011',
];

// G-pattern (even parity) for digits 0-9
const G_PATTERNS: string[] = [
  '0100111', '0110011', '0011011', '0100001', '0011101',
  '0111001', '0000101', '0010001', '0001001', '0010111',
];

// R-pattern for digits 0-9 (mirror of L)
const R_PATTERNS: string[] = [
  '1110010', '1100110', '1101100', '1000010', '1011100',
  '1001110', '1010000', '1000100', '1001000', '1110100',
];

// Guard bars
const START_GUARD = '101';
const CENTER_GUARD = '01010';
const END_GUARD = '101';

/**
 * Calculate the EAN-13 check digit from the first 12 digits.
 */
export function calculateEAN13CheckDigit(twelveDigits: string): string {
  const digits = twelveDigits.split('').map(Number);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return String(check);
}

/**
 * Validate that a string is a valid 13-digit EAN-13 code with correct check digit.
 */
export function isValidEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false;
  const expected = calculateEAN13CheckDigit(code.slice(0, 12));
  return code[12] === expected;
}

/**
 * Generate the bar pattern string for a 13-digit EAN-13 code.
 * Returns a string of 0s and 1s representing bars and spaces.
 */
export function generateBarcodePattern(text: string): string {
  // Ensure we have exactly 13 digits
  let digits = text.replace(/\D/g, '');
  if (digits.length < 13) {
    // Pad with leading zeros to 12, then calculate check digit
    digits = digits.padStart(12, '0');
    digits = digits + calculateEAN13CheckDigit(digits);
  } else if (digits.length > 13) {
    digits = digits.slice(0, 13);
  }

  const firstDigit = digits[0];
  const leftDigits = digits.slice(1, 7);
  const rightDigits = digits.slice(7, 13);

  const parity = PARITY_PATTERNS[firstDigit] || PARITY_PATTERNS['0'];
  const parityPattern = parity[0];

  let pattern = START_GUARD;

  // Left 6 digits with L/G parity
  for (let i = 0; i < 6; i++) {
    const d = Number(leftDigits[i]);
    const useG = parityPattern[i] === 'G';
    pattern += useG ? G_PATTERNS[d] : L_PATTERNS[d];
  }

  pattern += CENTER_GUARD;

  // Right 6 digits always R-pattern
  for (let i = 0; i < 6; i++) {
    const d = Number(rightDigits[i]);
    pattern += R_PATTERNS[d];
  }

  pattern += END_GUARD;

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
 * Generates an SVG string representation of an EAN-13 Barcode
 */
export function generateBarcodeSVGString({
  value,
  label,
  width = 240,
  height = 70,
  showText = true,
}: BarcodeSVGProps): string {
  const pattern = generateBarcodePattern(value);

  let x = 0;
  let isBar = true;
  let rects = '';
  const barHeight = showText ? height - 18 : height;

  for (let i = 0; i < pattern.length; i++) {
    const w = parseInt(pattern[i], 10);
    if (isBar) {
      rects += `<rect x="${x}" y="0" width="${w}" height="${barHeight}" fill="#24126E" />`;
    }
    x += w;
    isBar = !isBar;
  }

  const totalWidth = x;
  const displayValue = (value.replace(/\D/g, '')).padStart(13, '0').slice(0, 13);

  const textElement = showText
    ? `<text x="${totalWidth / 2}" y="${height - 2}" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="#24126E">${label || displayValue}</text>`
    : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="${width}" height="${height}" style="background-color: transparent;">
      ${rects}
      ${textElement}
    </svg>
  `;
}

/**
 * Generate a random valid 13-digit EAN-13 code.
 * Uses prefix 20-29 (internal/in-store range, not conflicting with GS1 prefixes).
 */
export function generateRandomEAN13(): string {
  const prefix = String(20 + Math.floor(Math.random() * 10)); // 20-29
  let code = prefix;
  while (code.length < 12) {
    code += Math.floor(Math.random() * 10);
  }
  return code + calculateEAN13CheckDigit(code);
}

/**
 * Generate a unique EAN-13 code with a serial number suffix.
 * Used for per-quantity unique barcodes.
 */
export function generateUniqueEAN13(baseIndex: number): string {
  // Use prefix 200 + 9-digit serial, then check digit
  let code = '200';
  const serial = String(baseIndex).padStart(9, '0').slice(0, 9);
  code += serial;
  return code + calculateEAN13CheckDigit(code);
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
