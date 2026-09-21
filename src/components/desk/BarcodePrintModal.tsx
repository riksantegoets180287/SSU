import React, { useState } from 'react';
import { Barcode, Printer, X, Check, Copy, Download, Layers, Sparkles, Sliders } from 'lucide-react';
import { Material, Category } from '../../types';
import { BarcodeRenderer } from '../common/BarcodeRenderer';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  categories: Category[];
  onUpdateBarcode?: (materialId: string, barcode: string) => void;
}

export type BarcodePrintMode = 'per_item' | 'per_quantity_same' | 'per_quantity_unique';

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  materials,
  categories,
  onUpdateBarcode,
}) => {
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [labelSize, setLabelSize] = useState<'compact' | 'standard' | 'large'>('standard');
  const [printMode, setPrintMode] = useState<BarcodePrintMode>('per_item');
  const [includeSchoolName, setIncludeSchoolName] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredMaterials = materials.filter(m => {
    if (selectedFilterCategory === 'all') return true;
    return m.categoryId === selectedFilterCategory;
  });

  // Expand items based on printMode
  interface PrintableLabel {
    uniqueKey: string;
    material: Material;
    category?: Category;
    barcodeValue: string;
    unitIndex?: number;
    totalUnits?: number;
    isVariant: boolean;
  }

  const printableLabels: PrintableLabel[] = [];

  filteredMaterials.forEach((material) => {
    const category = categories.find(c => c.id === material.categoryId);
    const baseCode = material.optionalBarcode || `SMP-${material.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
    const qty = Math.max(1, material.totalQuantity || 1);

    if (printMode === 'per_item') {
      // 1 sticker per material type
      printableLabels.push({
        uniqueKey: `${material.id}-single`,
        material,
        category,
        barcodeValue: baseCode,
        totalUnits: qty,
        isVariant: false,
      });
    } else if (printMode === 'per_quantity_same') {
      // Same barcode repeated for all items in stock (e.g. 10x identical sticker)
      for (let i = 1; i <= qty; i++) {
        printableLabels.push({
          uniqueKey: `${material.id}-same-${i}`,
          material,
          category,
          barcodeValue: baseCode,
          unitIndex: i,
          totalUnits: qty,
          isVariant: false,
        });
      }
    } else if (printMode === 'per_quantity_unique') {
      // Unique serialised variants: e.g. SMP-HDMI-01, SMP-HDMI-02...
      for (let i = 1; i <= qty; i++) {
        const paddedIndex = String(i).padStart(2, '0');
        const variantCode = `${baseCode}-${paddedIndex}`;
        printableLabels.push({
          uniqueKey: `${material.id}-var-${i}`,
          material,
          category,
          barcodeValue: variantCode,
          unitIndex: i,
          totalUnits: qty,
          isVariant: true,
        });
      }
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1F1735]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        {/* Modal Header (hidden during print) */}
        <div className="p-5 sm:p-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#24126E] flex items-center justify-center font-bold">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D70096] block">
                Summa Plus Barcode Studio
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#24126E]">
                Barcodes & Labels Printen
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#D70096] hover:bg-[#b5007e] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-[#D70096]/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Afdrukken / PDF opslaan</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F7F5FA] hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Options Toolbar (hidden during print) */}
        <div className="px-6 py-3.5 bg-[#F7F5FA] border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shrink-0 print:hidden">
          {/* Category Filter & Print Mode */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600">Categorie:</span>
              <select
                value={selectedFilterCategory}
                onChange={(e) => setSelectedFilterCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-[#24126E] font-medium focus:outline-none"
              >
                <option value="all">Alle ({materials.length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Mode selection: 1 per artikel vs per voorraad (identiek) vs per voorraad (unieke volgnummers) */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPrintMode('per_item')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  printMode === 'per_item'
                    ? 'bg-[#24126E] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="1 label per artikelsoort"
              >
                1 per artikel
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('per_quantity_same')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  printMode === 'per_quantity_same'
                    ? 'bg-[#24126E] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Print alle stuks met dezelfde barcode (bijv. 10x zelfde sticker)"
              >
                Alle stuks (zelfde code)
              </button>
              <button
                type="button"
                onClick={() => setPrintMode('per_quantity_unique')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  printMode === 'per_quantity_unique'
                    ? 'bg-[#D70096] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Print per exemplaar een uniek volgnummer (bijv. HDMI-01, HDMI-02)"
              >
                Volgnummers (-01, -02..)
              </button>
            </div>
          </div>

          {/* Label size & options */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600">Formaat:</span>
              {(['compact', 'standard', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setLabelSize(size)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-colors ${
                    labelSize === size
                      ? 'bg-[#24126E] text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {size === 'compact' ? 'Compact' : size === 'standard' ? 'Standaard' : 'Groot'}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
              <input
                type="checkbox"
                checked={includeSchoolName}
                onChange={(e) => setIncludeSchoolName(e.target.checked)}
                className="rounded text-[#D70096] focus:ring-[#D70096]"
              />
              <span className="text-[11px]">Summa Plus header</span>
            </label>
          </div>
        </div>

        {/* Printable Labels Grid */}
        <div className="flex-1 p-6 overflow-y-auto print:p-0 print:overflow-visible">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
            {printableLabels.map((lbl) => {
              const { material, category, barcodeValue, unitIndex, totalUnits, isVariant } = lbl;

              return (
                <div
                  key={lbl.uniqueKey}
                  className={`bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col justify-between items-center text-center relative group hover:border-[#D70096] transition-colors print:border-solid print:border-slate-800 print:rounded-lg print:break-inside-avoid ${
                    labelSize === 'compact' ? 'p-3' : labelSize === 'large' ? 'p-6' : 'p-4'
                  }`}
                >
                  {/* Top School Label Header */}
                  {includeSchoolName && (
                    <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                      <span className="text-[#D70096] font-black tracking-wider">Summa Plus</span>
                      <div className="flex items-center gap-1">
                        {unitIndex && (
                          <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                            isVariant ? 'bg-[#D70096] text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            #{unitIndex}/{totalUnits}
                          </span>
                        )}
                        <span className="bg-[#F7F5FA] px-1.5 py-0.5 rounded text-slate-600">
                          {category?.name || 'Item'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Material Name */}
                  <h4 className="font-extrabold text-[#24126E] text-xs sm:text-sm mb-1 line-clamp-1">
                    {material.name}
                  </h4>

                  {isVariant && unitIndex && (
                    <span className="text-[10px] font-bold text-[#D70096] mb-1">
                      Exemplaar #{unitIndex} van {totalUnits}
                    </span>
                  )}

                  {/* Barcode Render */}
                  <div className="w-full my-2 bg-white flex justify-center">
                    <BarcodeRenderer
                      value={barcodeValue}
                      label={barcodeValue}
                      height={labelSize === 'compact' ? 42 : labelSize === 'large' ? 65 : 52}
                      showText={true}
                    />
                  </div>

                  {/* Optional info */}
                  {material.notes && (
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {material.notes}
                    </p>
                  )}

                  {/* Quick Copy Action (hidden during print) */}
                  <div className="mt-2 pt-2 border-t border-slate-100 w-full flex items-center justify-between text-[10px] text-slate-400 print:hidden">
                    <span>
                      {unitIndex ? `Exemplaar ${unitIndex}/${totalUnits}` : `Voorraad: ${totalUnits}x`}
                    </span>
                    <button
                      onClick={() => handleCopy(barcodeValue)}
                      className="hover:text-[#D70096] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode === barcodeValue ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Gekopieerd!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Kopieer code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Note */}
        <div className="p-4 bg-[#F7F5FA] border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <div>
            Tip: Je kunt deze labels printen op stickerpapier of Dymo/Avery etiketten (bijv. 3x8 per vel).
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
