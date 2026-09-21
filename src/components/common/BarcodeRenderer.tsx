import React, { useMemo } from 'react';
import { generateBarcodePattern } from '../../lib/barcode';

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

  const { rects, totalWidth } = useMemo(() => {
    let totalModules = 0;
    for (let i = 0; i < pattern.length; i++) {
      totalModules += parseInt(pattern[i], 10);
    }

    const quietZone = 8;
    const computedTotalWidth = totalModules + quietZone * 2;
    const barHeight = showText ? height - 16 : height;

    let x = quietZone;
    let isBar = true;
    const bars: { x: number; width: number; height: number }[] = [];

    for (let i = 0; i < pattern.length; i++) {
      const moduleWidth = parseInt(pattern[i], 10);
      if (isBar) {
        bars.push({ x, width: moduleWidth, height: barHeight });
      }
      x += moduleWidth;
      isBar = !isBar;
    }

    return { rects: bars, totalWidth: computedTotalWidth };
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
            letterSpacing="0.08em"
            textAnchor="middle"
            fill="#24126E"
          >
            {label || value}
          </text>
        )}
      </svg>
    </div>
  );
};
