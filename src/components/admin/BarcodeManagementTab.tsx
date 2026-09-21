import React, { useState } from 'react';
import { 
  Barcode, 
  Printer, 
  Plus, 
  Sparkles, 
  Search, 
  Check, 
  Copy, 
  Layers, 
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Material, Category } from '../../types';
import { BarcodeRenderer } from '../common/BarcodeRenderer';
import { BarcodePrintModal } from '../desk/BarcodePrintModal';

interface BarcodeManagementTabProps {
  materials: Material[];
  categories: Category[];
  onUpdateMaterialBarcode: (materialId: string, barcode: string) => void;
}

export const BarcodeManagementTab: React.FC<BarcodeManagementTabProps> = ({
  materials,
  categories,
  onUpdateMaterialBarcode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredMaterials = materials.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return m.name.toLowerCase().includes(q) ||
           (m.optionalBarcode && m.optionalBarcode.toLowerCase().includes(q));
  });

  const handleStartEdit = (mat: Material) => {
    setEditingId(mat.id);
    setEditValue(mat.optionalBarcode || `SMP-${mat.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}`);
  };

  const handleSaveBarcode = (materialId: string) => {
    if (editValue.trim()) {
      onUpdateMaterialBarcode(materialId, editValue.trim().toUpperCase());
    }
    setEditingId(null);
  };

  const handleAutoGenerateAll = () => {
    materials.forEach(m => {
      if (!m.optionalBarcode) {
        const cat = categories.find(c => c.id === m.categoryId);
        const prefix = cat ? cat.name.slice(0, 3).toUpperCase() : 'SMP';
        const code = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
        onUpdateMaterialBarcode(m.id, code);
      }
    });
  };

  const handleCopy = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D70096] block mb-1">
            Handscanner & Label Studio
          </span>
          <h3 className="text-xl font-extrabold text-[#24126E]">
            Barcodes Beheren & Labels Printen
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Koppel barcodes aan materialen voor supersnelle inname en uitgifte met de handscanner.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAutoGenerateAll}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-[#24126E] text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            title="Genereer ontbrekende barcodes automatisch"
          >
            <Sparkles className="w-4 h-4 text-[#D70096]" />
            <span>Genereer Ontbrekende</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2.5 bg-[#D70096] hover:bg-[#b5007e] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-[#D70096]/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Alle Labels Printen</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek op materiaal of barcode..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {filteredMaterials.length} artikelen
        </span>
      </div>

      {/* Grid of Materials with Live Barcode Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((material) => {
          const category = categories.find(c => c.id === material.categoryId);
          const currentBarcode = material.optionalBarcode || `SMP-${material.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
          const isEditing = editingId === material.id;

          return (
            <div
              key={material.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-[#D70096]/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D70096] bg-pink-50 px-2 py-0.5 rounded-md">
                    {category?.name || 'Onbekend'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Voorraad: {material.totalQuantity}x
                  </span>
                </div>

                <h4 className="font-extrabold text-[#24126E] text-sm mb-3">
                  {material.name}
                </h4>

                {/* Barcode Visual Box */}
                <div className="bg-[#F7F5FA] rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-200/80 my-2">
                  <BarcodeRenderer
                    value={currentBarcode}
                    label={currentBarcode}
                    height={46}
                    showText={true}
                  />
                </div>
              </div>

              {/* Barcode Edit / Action */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Barcode code..."
                      className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-[#24126E] focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveBarcode(material.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Opslaan
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleStartEdit(material)}
                      className="text-xs font-bold text-[#24126E] hover:text-[#D70096] cursor-pointer"
                    >
                      Barcode bewerken
                    </button>
                    <button
                      onClick={() => handleCopy(currentBarcode)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode === currentBarcode ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Gekopieerd</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Kopieer</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Print Modal */}
      <BarcodePrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        materials={materials}
        categories={categories}
      />
    </div>
  );
};
