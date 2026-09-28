import React, { useMemo } from 'react';
import { generateBarcodePattern, isValidEAN13 } from '../../lib/barcode';

interface BarcodeRendererProps {
  value: string;
  label?: string;
  width?: number | string;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  label,
  width = '100%',
  height = 55,
  showText = true,
  className = '',
}) => {
  const pattern = useMemo(() => generateBarcodePattern(value), [value]);

  const displayValue = useMemo(() => {
    const digits = value.replace(/\D/g, '').padStart(13, '0').slice(0, 13);
    return digits;
  }, [value]);

  const isValid = useMemo(() => isValidEAN13(displayValue), [displayValue]);

  const { rects, totalWidth, guardBars } = useMemo(() => {
    const quietZone = 7;
    let x = quietZone;
    let isBar = true;
    const bars: { x: number; width: number; height: number }[] = [];
    const guards: { x: number; width: number }[] = [];

    // Track positions of guard bars for longer height
    // Guard bars are at: start (positions 0-2), center (positions 45-49), end (positions 95-97)
    // In the pattern string (excluding quiet zone):
    // Start guard: indices 0,1,2 (3 modules)
    // Center guard: indices 45-49 (5 modules)
    // End guard: indices 95-97 (3 modules)
    let moduleIndex = 0;
    const startGuardEnd = 3;
    const centerGuardStart = 45;
    const centerGuardEnd = 50;
    const endGuardStart = 95;

    for (let i = 0; i < pattern.length; i++) {
      const w = parseInt(pattern[i], 10);
      if (isBar) {
        const isGuard = moduleIndex < startGuardEnd ||
          (moduleIndex >= centerGuardStart && moduleIndex < centerGuardEnd) ||
          moduleIndex >= endGuardStart;
        const barH = isGuard ? height - 6 : (showText ? height - 18 : height - 6);
        bars.push({ x, width: w, height: barH });
        if (isGuard) guards.push({ x, width: w });
      }
      x += w;
      isBar = !isBar;
      moduleIndex++;
    }

    return {
      rects: bars,
      totalWidth: x + quietZone,
      guardBars: guards,
    };
  }, [pattern, height, showText]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        style={{ width, height, maxHeight: height }}
        className="overflow-visible"
      >
        {rects.map((r, idx) => (
          <rect
            key={idx}
            x={r.x}
            y={0}
            width={r.width}
            height={r.height}
            fill="#24126E"
          />
        ))}
        {showText && (
          <text
            x={totalWidth / 2}
            y={height - 2}
            fontFamily="monospace"
            fontSize="11"
            fontWeight="bold"
            letterSpacing="0.12em"
            textAnchor="middle"
            fill="#24126E"
          >
            {label || displayValue}
          </text>
        )}
      </svg>
      {!isValid && (
        <span className="text-[9px] text-amber-600 font-bold mt-0.5">
          Ongeldige EAN-13
        </span>
      )}
    </div>
  );
};
