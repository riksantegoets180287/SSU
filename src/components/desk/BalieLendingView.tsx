import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Barcode, 
  Package, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Plus, 
  Minus, 
  ArrowRight,
  Clock, 
  Calendar,
  Sparkles,
  Info,
  Laptop,
  Wrench,
  BookOpen,
  Trophy,
  HelpCircle,
  User,
  LayoutGrid,
  List as ListIcon,
  RotateCcw,
  Check,
  UserCheck,
  Building,
  Shield,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Lock,
  Printer,
  Radio,
  Scan,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Utensils,
  Coffee,
  Zap
} from 'lucide-react';
import { Material, Category, Loan, LoanReturnCondition } from '../../types';
import { calculateAvailableQuantity, getDutchCurrentDateTime } from '../../lib/storage';
import { ReturnConditionModal } from './ReturnConditionModal';
import { BarcodePrintModal } from './BarcodePrintModal';
import { BarcodeRenderer } from '../common/BarcodeRenderer';

interface BalieLendingViewProps {
  categories: Category[];
  materials: Material[];
  loans: Loan[];
  onBorrow: (material: Material, quantity: number, borrowerName: string, borrowerTeam: string) => { success: boolean; loan?: Loan; error?: string };
  onReturnLoanWithCondition?: (
    loanId: string,
    condition: LoanReturnCondition,
    notes?: string,
    createServiceTicket?: boolean,
    returnQuantity?: number
  ) => void;
  onReturnLoan?: (
    loanId: string,
    condition?: LoanReturnCondition,
    notes?: string,
    createServiceTicket?: boolean,
    returnQuantity?: number
  ) => void;
  onExitToRoles: () => void;
}

export const BalieLendingView: React.FC<BalieLendingViewProps> = ({
  categories,
  materials,
  loans,
  onBorrow,
  onReturnLoanWithCondition,
  onReturnLoan,
  onExitToRoles,
}) => {
  const [activeTab, setActiveTab] = useState<'uitgifte' | 'inname'>('uitgifte');
  
  // Borrower inputs at the desk
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerTeam, setBorrowerTeam] = useState('');
  const [rememberBorrower, setRememberBorrower] = useState(true);

  // Search and filter in catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Checkout Modal State
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [borrowQuantity, setBorrowQuantity] = useState<number>(1);
  const [modalBorrowerName, setModalBorrowerName] = useState('');
  const [modalBorrowerTeam, setModalBorrowerTeam] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Return condition modal state
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<Loan | null>(null);

  // Barcode print modal
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // Handscanner state & audio feedback
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scannerPulse, setScannerPulse] = useState(false);
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const [isScannerTestingOpen, setIsScannerTestingOpen] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Success dialog
  const [recentSuccess, setRecentSuccess] = useState<{
    loan: Loan;
    material: Material;
  } | null>(null);

  // Inname search filter
  const [innameSearch, setInnameSearch] = useState('');

  const activeLoans = useMemo(() => {
    return loans.filter(l => l.status === 'uitgeleend');
  }, [loans]);

  const filteredActiveLoans = useMemo(() => {
    if (!innameSearch.trim()) return activeLoans;
    const q = innameSearch.toLowerCase().trim();
    return activeLoans.filter(l => 
      l.borrowerName.toLowerCase().includes(q) ||
      l.borrowerTeam.toLowerCase().includes(q) ||
      l.materialName.toLowerCase().includes(q) ||
      l.categoryName.toLowerCase().includes(q)
    );
  }, [activeLoans, innameSearch]);

  // Filter materials for uitgifte
  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      if (selectedCategory !== 'all' && material.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const category = categories.find(c => c.id === material.categoryId)?.name.toLowerCase() || '';
        const matchName = material.name.toLowerCase().includes(query);
        const matchBarcode = material.optionalBarcode?.toLowerCase().includes(query) || false;
        const matchNotes = material.notes?.toLowerCase().includes(query) || false;
        const matchCategory = category.includes(query);
        return matchName || matchBarcode || matchNotes || matchCategory;
      }
      return true;
    });
  }, [materials, selectedCategory, searchQuery, categories]);

  // Audio feedback for scanner
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Hardware Barcode Scanner Listener
  const scanBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const handleBarcodeScanned = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return;

    setLastScannedCode(cleanCode);
    setScannerPulse(true);
    playScanBeep();
    setTimeout(() => setScannerPulse(false), 2000);

    // 1. Try to find material with this exact barcode or ID
    let matchedMaterial = materials.find(
      m => (m.optionalBarcode && m.optionalBarcode.toLowerCase() === cleanCode.toLowerCase()) ||
           m.id.toLowerCase() === cleanCode.toLowerCase()
    );

    // 1b. If not found directly, check if it's a serialised variant barcode (e.g. "SMP-HDMI-01-03" -> base "SMP-HDMI-01")
    if (!matchedMaterial && cleanCode.includes('-')) {
      const parts = cleanCode.split('-');
      // remove last part (e.g. "03" or "1")
      if (parts.length > 1) {
        const potentialBaseCode = parts.slice(0, -1).join('-').toLowerCase();
        matchedMaterial = materials.find(
          m => (m.optionalBarcode && m.optionalBarcode.toLowerCase() === potentialBaseCode) ||
               m.id.toLowerCase() === potentialBaseCode
        );
      }
    }

    if (matchedMaterial) {
      if (activeTab === 'inname') {
        // If in Inname tab, look for an active loan for this material
        const matchingLoan = activeLoans.find(l => l.materialId === matchedMaterial.id);
        if (matchingLoan) {
          setSelectedLoanForReturn(matchingLoan);
          return;
        }
      }

      // In Uitgifte mode: open borrow modal
      handleOpenBorrowModal(matchedMaterial);
      return;
    }

    // 2. Try to find an active loan directly
    const matchingLoan = activeLoans.find(
      l => l.id.toLowerCase() === cleanCode.toLowerCase()
    );
    if (matchingLoan) {
      setSelectedLoanForReturn(matchingLoan);
      return;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Scanners type fast (usually < 70ms between keys)
      if (e.key === 'Enter') {
        if (scanBufferRef.current.length >= 2) {
          const code = scanBufferRef.current;
          scanBufferRef.current = '';
          handleBarcodeScanned(code);
          if (!isInput) {
            e.preventDefault();
          }
        }
        return;
      }

      if (e.key.length === 1) {
        if (diff > 120) {
          // New barcode scan sequence started
          scanBufferRef.current = e.key;
        } else {
          scanBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [materials, activeLoans, activeTab]);

  const handleOpenBorrowModal = (material: Material) => {
    const available = calculateAvailableQuantity(material, loans);
    if (available <= 0) return;

    setSelectedMaterial(material);
    setBorrowQuantity(1);
    setModalBorrowerName(borrowerName);
    setModalBorrowerTeam(borrowerTeam);
    setFormError(null);
  };

  const handleConfirmBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    const name = modalBorrowerName.trim() || borrowerName.trim();
    const team = modalBorrowerTeam.trim() || borrowerTeam.trim();

    if (!name) {
      setFormError('Vul de naam van de lener / collega / student in.');
      return;
    }
    if (!team) {
      setFormError('Vul het team, de opleiding of afdeling van de lener in.');
      return;
    }

    const available = calculateAvailableQuantity(selectedMaterial, loans);
    if (borrowQuantity <= 0) {
      setFormError('Het aantal moet minimaal 1 zijn.');
      return;
    }
    if (borrowQuantity > available) {
      setFormError(`Er zijn maximaal ${available} stuks beschikbaar.`);
      return;
    }

    const result = onBorrow(selectedMaterial, borrowQuantity, name, team);
    if (result.success && result.loan) {
      setRecentSuccess({
        loan: result.loan,
        material: selectedMaterial,
      });

      if (rememberBorrower) {
        setBorrowerName(name);
        setBorrowerTeam(team);
      } else {
        setBorrowerName('');
        setBorrowerTeam('');
      }

      setSelectedMaterial(null);
      setFormError(null);
    } else {
      setFormError(result.error || 'Er is een fout opgetreden bij het registreren.');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentDateTime = getDutchCurrentDateTime();

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('servies') || name.includes('keuken') || name.includes('bestek') || name.includes('bord') || name.includes('vork')) {
      return <Utensils className="w-4 h-4" />;
    }
    if (name.includes('koffie') || name.includes('thee') || name.includes('schotel')) {
      return <Coffee className="w-4 h-4" />;
    }
    if (name.includes('oplader') || name.includes('ict') || name.includes('laptop')) {
      return <Zap className="w-4 h-4" />;
    }
    if (name.includes('schoonmaak') || name.includes('facilitair') || name.includes('stofzuiger')) {
      return <Sparkles className="w-4 h-4" />;
    }
    if (name.includes('dienst') || name.includes('kopieer') || name.includes('lamineer') || name.includes('balie')) {
      return <Printer className="w-4 h-4" />;
    }
    if (name.includes('gereedschap')) return <Wrench className="w-4 h-4" />;
    if (name.includes('les') || name.includes('onderwijs')) return <BookOpen className="w-4 h-4" />;
    if (name.includes('sport')) return <Trophy className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-4rem-3rem)]">
      {/* Top Desk Sub-Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExitToRoles}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#24126E] bg-[#F7F5FA] hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Rollenkeuze</span>
          </button>
          
          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

          {/* Scanner Active Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            scannerPulse 
              ? 'bg-emerald-500 text-white ring-4 ring-emerald-300 animate-pulse' 
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            <Scan className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
            <span>Handscanner Gereed</span>
            {lastScannedCode && (
              <span className="bg-white/80 text-[#24126E] px-1.5 py-0.5 rounded text-[10px] font-mono">
                {lastScannedCode}
              </span>
            )}
          </div>
        </div>

        {/* Right Action Controls: Print Barcodes + Kiosk Fullscreen + Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Label print button */}
          <button
            onClick={() => setIsBarcodeModalOpen(true)}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#24126E] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Genereer en print barcodes"
          >
            <Printer className="w-3.5 h-3.5 text-[#D70096]" />
            <span className="hidden sm:inline">Labels & Barcodes</span>
          </button>

          {/* Fullscreen Kiosk toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-[#F7F5FA] hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title={isFullscreen ? "Venster herstellen" : "Kiosk Volledig Scherm"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Tab Switcher: Uitgifte vs Inname */}
          <div className="flex items-center gap-1.5 bg-[#F7F5FA] p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('uitgifte')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'uitgifte'
                  ? 'bg-[#24126E] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#24126E]'
              }`}
            >
              1. Uitgifte (Lenen)
            </button>
            <button
              onClick={() => setActiveTab('inname')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'inname'
                  ? 'bg-[#D70096] text-white shadow-md shadow-[#D70096]/20'
                  : 'text-[#D70096] hover:bg-pink-50'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>2. Inname ({activeLoans.length})</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'uitgifte' ? (
        /* ================= UITGIFTE (LENEN REGISTREREN) ================= */
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Sidebar: Categorieën Filter */}
          <aside className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-indigo-100 p-6 flex flex-col gap-6 shrink-0">
            {/* Categorieën Filter */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                Filter op Categorie
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#24126E] text-white shadow-xs'
                      : 'bg-[#F7F5FA] text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Alle materialen</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>
                    {materials.length}
                  </span>
                </button>

                {categories.map((cat) => {
                  const count = materials.filter(m => m.categoryId === cat.id).length;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#24126E] text-white shadow-xs'
                          : 'bg-[#F7F5FA] text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(cat.name)}
                        <span>{cat.name}</span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-slate-200/80 text-slate-600'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Catalog View */}
          <main className="flex-1 p-6 sm:p-8 flex flex-col gap-6">
            {/* Search & Scanner Controls */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                {/* Zoekbalk */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Zoek op naam, kenmerk of categorie..."
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F7F5FA] rounded-2xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Handscanner / Barcode Invoer boven bij de zoekbalk */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualBarcodeInput.trim()) {
                      handleBarcodeScanned(manualBarcodeInput);
                      setManualBarcodeInput('');
                    }
                  }}
                  className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/90 px-3 py-1.5 rounded-2xl sm:max-w-xs shrink-0"
                >
                  <Scan className="w-4 h-4 text-emerald-600 shrink-0" />
                  <input
                    type="text"
                    value={manualBarcodeInput}
                    onChange={(e) => setManualBarcodeInput(e.target.value)}
                    placeholder="Scan of typ barcode..."
                    className="w-full bg-transparent text-xs text-[#24126E] font-mono focus:outline-none placeholder:text-emerald-800/60"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Scan
                  </button>
                </form>
              </div>

              {/* View mode & count */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  {filteredMaterials.length} {filteredMaterials.length === 1 ? 'artikel' : 'artikelen'}
                </span>
                <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                <div className="bg-[#F7F5FA] border border-slate-200 rounded-xl p-1 flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#24126E] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Gridweergave"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'list' ? 'bg-[#24126E] text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title="Lijstweergave"
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Catalog Items */}
            {filteredMaterials.length === 0 ? (
              <div className="flex-1 bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#24126E] flex items-center justify-center mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-[#24126E] text-base mb-1">Geen materialen gevonden</h4>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Er zijn geen artikelen die overeenkomen met je zoekopdracht of geselecteerde categorie.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F7F5FA] hover:bg-slate-200 text-xs font-bold text-[#24126E]"
                >
                  Filters resetten
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredMaterials.map((material) => {
                  const available = calculateAvailableQuantity(material, loans);
                  const category = categories.find(c => c.id === material.categoryId);
                  const isOutOfStock = available <= 0;

                  return (
                    <div
                      key={material.id}
                      className={`bg-white rounded-3xl border border-slate-200/80 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group ${
                        isOutOfStock ? 'opacity-70 bg-slate-50/60' : ''
                      }`}
                    >
                      <div>
                        {/* Top Meta Bar */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D70096] bg-pink-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            {getCategoryIcon(category?.name || '')}
                            <span>{category?.name || 'Onbekend'}</span>
                          </span>

                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : available <= 2
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isOutOfStock ? 'Uitgeleend (0)' : `${available} beschikbaar`}
                          </span>
                        </div>

                        {/* Image or Icon Placeholder */}
                        {material.optionalImageUrl ? (
                          <div className="h-32 w-full rounded-2xl overflow-hidden bg-[#F7F5FA] mb-3 relative">
                            <img
                              src={material.optionalImageUrl}
                              alt={material.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : null}

                        {/* Title & Notes */}
                        <h4 className="font-extrabold text-base text-[#24126E] mb-1 group-hover:text-[#D70096] transition-colors">
                          {material.name}
                        </h4>

                        {material.notes && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {material.notes}
                          </p>
                        )}

                        {/* Barcode Tag */}
                        {material.optionalBarcode && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-[#F7F5FA] px-2.5 py-1 rounded-lg w-fit mb-3">
                            <Barcode className="w-3.5 h-3.5 text-[#D70096]" />
                            <span>{material.optionalBarcode}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleOpenBorrowModal(material)}
                        disabled={isOutOfStock}
                        className={`w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-[#24126E] hover:bg-[#D70096] text-white shadow-xs hover:shadow-md'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Direct Lenen / Uitgeven</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs divide-y divide-slate-100">
                {filteredMaterials.map((material) => {
                  const available = calculateAvailableQuantity(material, loans);
                  const category = categories.find(c => c.id === material.categoryId);
                  const isOutOfStock = available <= 0;

                  return (
                    <div
                      key={material.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F5FA] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#24126E] flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                          {material.optionalImageUrl ? (
                            <img
                              src={material.optionalImageUrl}
                              alt={material.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            getCategoryIcon(category?.name || '')
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm sm:text-base text-[#24126E]">
                              {material.name}
                            </span>
                            <span className="text-[10px] font-bold uppercase bg-pink-50 text-[#D70096] px-2 py-0.5 rounded">
                              {category?.name}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            {material.optionalBarcode && (
                              <span className="flex items-center gap-1 font-mono text-slate-400">
                                <Barcode className="w-3 h-3" />
                                {material.optionalBarcode}
                              </span>
                            )}
                            <span>Totaal: {material.totalQuantity}x</span>
                            <span className={isOutOfStock ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                              {available} beschikbaar
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenBorrowModal(material)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all self-end sm:self-auto ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-[#24126E] hover:bg-[#D70096] text-white shadow-xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Uitgeven</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      ) : (
        /* ================= INNAME (RETOURBALIE MET CONDITIECHECK) ================= */
        <div className="flex-1 p-6 sm:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">
          {/* Header Bar in Inname */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D70096] block mb-1">
                Retourbalie & Inname
              </span>
              <h3 className="text-xl font-extrabold text-[#24126E]">
                Actueel Uitgeleende Materialen ({activeLoans.length})
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Scan de barcode of klik op &ldquo;Retour innemen&rdquo; om direct de conditie te controleren.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={innameSearch}
                onChange={(e) => setInnameSearch(e.target.value)}
                placeholder="Zoek op lener, team of item..."
                className="w-full pl-9 pr-3 py-2 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
              />
            </div>
          </div>

          {/* Active Loans List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
            {filteredActiveLoans.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-[#24126E] text-base mb-1">
                  Alles is momenteel ingeleverd!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Er staan momenteel geen actieve uitleningen open in het systeem.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredActiveLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F5FA] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-pink-50 text-[#D70096] flex items-center justify-center shrink-0 font-bold text-sm">
                        {loan.quantity}x
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-[#24126E]">
                            {loan.materialName}
                          </span>
                          <span className="text-[10px] font-bold uppercase bg-indigo-50 text-[#24126E] px-2 py-0.5 rounded">
                            {loan.categoryName}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <User className="w-3 h-3 text-[#D70096]" />
                            {loan.borrowerName} ({loan.borrowerTeam})
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            {loan.borrowedAtDate} om {loan.borrowedAtTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedLoanForReturn(loan)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer self-end sm:self-auto shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retour innemen & Conditiecheck</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-[#1F1735]/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D70096] block mb-1">
                  Balie Uitgifte Registreren
                </span>
                <h3 className="text-xl font-extrabold text-[#24126E]">
                  {selectedMaterial.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="w-8 h-8 rounded-full bg-[#F7F5FA] hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBorrow} className="space-y-4">
              {/* Lener Inputs */}
              <div className="bg-[#F7F5FA] p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold text-[#24126E] uppercase tracking-wider block">
                  Gegevens van de Lener
                </span>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Naam lener <span className="text-[#D70096]">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalBorrowerName}
                    onChange={(e) => setModalBorrowerName(e.target.value)}
                    placeholder="bijv. Marleen van Houten"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Opleiding / Team / Afdeling <span className="text-[#D70096]">*</span>
                  </label>
                  <input
                    type="text"
                    value={modalBorrowerTeam}
                    onChange={(e) => setModalBorrowerTeam(e.target.value)}
                    placeholder="bijv. ICT / Docententeam A"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                  Aantal stuks <span className="text-[#D70096]">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBorrowQuantity(prev => Math.max(1, prev - 1))}
                    disabled={borrowQuantity <= 1}
                    className="w-11 h-11 rounded-xl bg-[#F7F5FA] hover:bg-slate-200 text-[#24126E] font-bold flex items-center justify-center border border-slate-200 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={calculateAvailableQuantity(selectedMaterial, loans)}
                    value={borrowQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setBorrowQuantity(val);
                    }}
                    className="flex-1 text-center py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-[#24126E] font-extrabold text-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const max = calculateAvailableQuantity(selectedMaterial, loans);
                      setBorrowQuantity(prev => Math.min(max, prev + 1));
                    }}
                    disabled={borrowQuantity >= calculateAvailableQuantity(selectedMaterial, loans)}
                    className="w-11 h-11 rounded-xl bg-[#F7F5FA] hover:bg-slate-200 text-[#24126E] font-bold flex items-center justify-center border border-slate-200 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Beschikbaar in magazijn: {calculateAvailableQuantity(selectedMaterial, loans)} van {selectedMaterial.totalQuantity}
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedMaterial(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#F7F5FA] hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 px-5 rounded-xl bg-[#D70096] hover:bg-[#b5007e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#D70096]/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Uitgifte Bevestigen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Condition Modal */}
      <ReturnConditionModal
        isOpen={!!selectedLoanForReturn}
        loan={selectedLoanForReturn}
        onClose={() => setSelectedLoanForReturn(null)}
        onConfirmReturn={(loanId, condition, notes, createTicket, returnQty) => {
          if (onReturnLoanWithCondition) {
            onReturnLoanWithCondition(loanId, condition, notes, createTicket, returnQty);
          } else if (onReturnLoan) {
            onReturnLoan(loanId, condition, notes, createTicket, returnQty);
          }
        }}
      />

      {/* Barcode Print Studio Modal */}
      <BarcodePrintModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        materials={materials}
        categories={categories}
      />

      {/* Success Dialog */}
      {recentSuccess && (
        <div className="fixed inset-0 z-50 bg-[#1F1735]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full mb-2 inline-block">
              Uitgifte Geregistreerd
            </span>

            <h3 className="text-xl font-bold text-[#24126E] mt-1 mb-2">
              Succesvol verwerkt aan de balie
            </h3>

            <div className="bg-[#F7F5FA] border border-slate-200/80 rounded-2xl p-4 my-4 text-left text-xs space-y-2">
              <p className="font-semibold text-[#24126E]">
                {recentSuccess.loan.quantity}x {recentSuccess.loan.materialName} uitgeleend aan <strong className="text-[#D70096]">{recentSuccess.loan.borrowerName}</strong> ({recentSuccess.loan.borrowerTeam}).
              </p>
              <div className="pt-2 border-t border-slate-200 text-slate-500">
                Tijdstip: {recentSuccess.loan.borrowedAtDate} om {recentSuccess.loan.borrowedAtTime}
              </div>
            </div>

            <button
              onClick={() => setRecentSuccess(null)}
              className="w-full py-3 px-4 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              Volgende uitgifte / Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
