import React, { useState, useMemo } from 'react';
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
  Utensils,
  Coffee,
  Zap,
  Printer
} from 'lucide-react';
import { Material, Category, Loan, BorrowerSession } from '../types';
import { calculateAvailableQuantity, getDutchCurrentDateTime } from '../lib/storage';

interface UserCatalogProps {
  userSession: BorrowerSession;
  categories: Category[];
  materials: Material[];
  loans: Loan[];
  onBorrow: (material: Material, quantity: number) => { success: boolean; loan?: Loan; error?: string };
  onSwitchUser: () => void;
  onFinishSession: () => void;
}

export const UserCatalog: React.FC<UserCatalogProps> = ({
  userSession,
  categories,
  materials,
  loans,
  onBorrow,
  onSwitchUser,
  onFinishSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Active material for modal checkout
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [borrowQuantity, setBorrowQuantity] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Success dialog state
  const [recentSuccess, setRecentSuccess] = useState<{
    loan: Loan;
    material: Material;
  } | null>(null);

  // Filter materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      // Category filter
      if (selectedCategory !== 'all' && material.categoryId !== selectedCategory) {
        return false;
      }

      // Search filter (name, barcode, notes, category)
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

  const handleOpenBorrowModal = (material: Material) => {
    const available = calculateAvailableQuantity(material, loans);
    if (available <= 0) return;

    setSelectedMaterial(material);
    setBorrowQuantity(1);
    setFormError(null);
  };

  const handleConfirmBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    const available = calculateAvailableQuantity(selectedMaterial, loans);

    if (borrowQuantity <= 0) {
      setFormError('Het aantal moet minimaal 1 zijn.');
      return;
    }

    if (borrowQuantity > available) {
      setFormError(`Je kunt maximaal ${available} stuks lenen van dit artikel.`);
      return;
    }

    const result = onBorrow(selectedMaterial, borrowQuantity);
    if (result.success && result.loan) {
      setRecentSuccess({
        loan: result.loan,
        material: selectedMaterial,
      });
      setSelectedMaterial(null);
      setFormError(null);
    } else {
      setFormError(result.error || 'Er is een fout opgetreden bij het registreren.');
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
    <div className="flex flex-col lg:flex-row flex-1 min-h-[calc(100vh-4rem-3rem)]">
      {/* Sidebar: Clean Utility Minimal */}
      <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-indigo-100 p-6 flex flex-col gap-6 shrink-0">
        {/* Search Block */}
        <div>
          <label className="block text-[10px] font-bold text-indigo-900/50 uppercase tracking-widest mb-3">
            Zoeken
          </label>
          <div className="relative">
            <input
              id="input-catalog-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Materiaal of barcode..."
              className="w-full bg-[#F7F5FA] border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#D70096] focus:border-transparent placeholder:text-slate-400 text-slate-800 transition-all"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Navigation */}
        <div>
          <label className="block text-[10px] font-bold text-indigo-900/50 uppercase tracking-widest mb-3">
            Categorieën
          </label>
          <nav className="flex flex-col gap-1">
            <button
              id="filter-category-all"
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-indigo-50 text-[#24126E] shadow-xs'
                  : 'hover:bg-slate-50 text-slate-600 font-medium'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Alle Materialen
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                selectedCategory === 'all' ? 'bg-indigo-200/80 text-[#24126E]' : 'bg-slate-100 text-slate-600'
              }`}>
                {materials.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = materials.filter(m => m.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`filter-category-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 text-[#24126E] font-semibold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {getCategoryIcon(cat.name)}
                    {cat.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isSelected ? 'bg-indigo-200/80 text-[#24126E]' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Session Quick Info Card in Sidebar */}
        <div className="p-4 bg-[#F7F5FA] rounded-2xl border border-indigo-50/80">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-[#D70096]"></div>
            <span className="text-[10px] font-bold text-indigo-900/60 uppercase tracking-wider">Huidige Lener</span>
          </div>
          <p className="text-xs font-bold text-[#24126E] truncate">{userSession.name}</p>
          <p className="text-[11px] text-slate-500">{userSession.team}</p>
          <button
            onClick={onSwitchUser}
            className="mt-3 text-[11px] font-bold text-[#D70096] hover:underline block"
          >
            Wissel van lener &rarr;
          </button>
        </div>

        {/* Help Need Box */}
        <div className="mt-auto p-4 bg-indigo-50/70 border border-indigo-100/60 rounded-2xl">
          <h4 className="text-xs font-bold text-[#24126E] mb-1 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#D70096]" />
            Hulp nodig?
          </h4>
          <p className="text-[11px] text-indigo-900/70 leading-relaxed">
            Neem contact op met de beheerder voor ontbrekende of defecte artikelen.
          </p>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {/* Main Section Header with Grid/List View Toggles */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#24126E] tracking-tight">
              Beschikbare Materialen
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Selecteer een item om direct de uitleen te registreren.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-xs border border-slate-200/80 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#F7F5FA] text-[#24126E] shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-[#F7F5FA] text-[#24126E] shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Lijst</span>
            </button>
          </div>
        </div>

        {/* Empty Search State */}
        {filteredMaterials.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 bg-[#F7F5FA] rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#24126E] mb-1">
              Geen materialen gevonden
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Er zijn geen artikelen die overeenkomen met je zoekopdracht of filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs font-bold text-[#D70096] hover:underline"
            >
              Filters wissen
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Card Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => {
              const category = categories.find(c => c.id === material.categoryId);
              const availableQty = calculateAvailableQuantity(material, loans);
              const isAvailable = availableQty > 0;

              return (
                <div
                  key={material.id}
                  id={`material-card-${material.id}`}
                  className={`bg-white rounded-3xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                    !isAvailable ? 'opacity-70' : ''
                  }`}
                >
                  <div>
                    {/* Visual Area */}
                    <div className="h-36 bg-[#F7F5FA] rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden">
                      {material.optionalImageUrl ? (
                        <img
                          src={material.optionalImageUrl}
                          alt={material.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-indigo-200">
                          {getCategoryIcon(category?.name || '')}
                        </div>
                      )}

                      {/* Category Badge on Top-Left */}
                      <span className="absolute top-3 left-3 bg-indigo-100/90 text-[#24126E] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {category?.name || 'Item'}
                      </span>

                      {/* Stock pill on Top-Right */}
                      <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        availableQty > 2 
                          ? 'bg-emerald-100 text-emerald-800'
                          : availableQty > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {availableQty > 0 ? `${availableQty} op voorraad` : 'Uitgeleend'}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-[#24126E] mb-1">
                      {material.name}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                      {material.notes || material.optionalBarcode || 'Beschikbaar voor onderwijs en teams'}
                    </p>
                  </div>

                  {/* Bottom Footer Bar */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                        {isAvailable ? 'Beschikbaar' : 'Status'}
                      </span>
                      <span className={`text-sm font-black ${isAvailable ? 'text-[#24126E]' : 'text-red-600'}`}>
                        {isAvailable ? `${availableQty} stuks` : 'Niet voorradig'}
                      </span>
                    </div>

                    <button
                      id={`btn-borrow-${material.id}`}
                      disabled={!isAvailable}
                      onClick={() => handleOpenBorrowModal(material)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isAvailable
                          ? 'bg-[#D70096] hover:bg-[#b5007e] text-white shadow-lg shadow-[#D70096]/20 cursor-pointer active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Leen nu
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Clean Utility List View */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {filteredMaterials.map((material) => {
              const category = categories.find(c => c.id === material.categoryId);
              const availableQty = calculateAvailableQuantity(material, loans);
              const isAvailable = availableQty > 0;

              return (
                <div
                  key={material.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F7F5FA] flex items-center justify-center text-[#24126E] shrink-0 border border-slate-100">
                      {material.optionalImageUrl ? (
                        <img
                          src={material.optionalImageUrl}
                          alt={material.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        getCategoryIcon(category?.name || '')
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#24126E]">{material.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-[#24126E] px-2 py-0.5 rounded-md">
                          {category?.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {material.notes || material.optionalBarcode || 'Geen extra notities'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter block">
                        Beschikbaar
                      </span>
                      <span className={`text-sm font-black ${isAvailable ? 'text-[#24126E]' : 'text-red-600'}`}>
                        {availableQty} / {material.totalQuantity} stuks
                      </span>
                    </div>

                    <button
                      disabled={!isAvailable}
                      onClick={() => handleOpenBorrowModal(material)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                        isAvailable
                          ? 'bg-[#D70096] hover:bg-[#b5007e] text-white shadow-md shadow-[#D70096]/20 cursor-pointer'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Leen nu
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Borrow Checkout Modal */}
      {selectedMaterial && (
        <div 
          id="modal-borrow-checkout"
          className="fixed inset-0 z-50 bg-[#1F1735]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D70096] block mb-1">
                  Uitleen registreren
                </span>
                <h3 className="text-xl font-extrabold text-[#24126E]">
                  {selectedMaterial.name}
                </h3>
              </div>
              <button
                id="btn-close-borrow-modal"
                onClick={() => setSelectedMaterial(null)}
                className="w-8 h-8 rounded-full bg-[#F7F5FA] hover:bg-[#E5DFEE] text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmBorrow} className="space-y-5">
              {/* Material Details Card */}
              <div className="bg-[#F7F5FA] rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Categorie:</span>
                  <span className="font-bold text-[#24126E]">
                    {categories.find(c => c.id === selectedMaterial.categoryId)?.name || '-'}
                  </span>
                </div>
                {selectedMaterial.optionalBarcode && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Barcode:</span>
                    <span className="font-mono font-medium text-[#24126E]">{selectedMaterial.optionalBarcode}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Beschikbare voorraad:</span>
                  <span className="font-bold text-emerald-700">
                    {calculateAvailableQuantity(selectedMaterial, loans)} van {selectedMaterial.totalQuantity}
                  </span>
                </div>
              </div>

              {/* Quantity Picker */}
              <div>
                <label className="block text-sm font-bold text-[#24126E] mb-2">
                  Aantal te lenen artikelen <span className="text-[#D70096]">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBorrowQuantity(prev => Math.max(1, prev - 1))}
                    disabled={borrowQuantity <= 1}
                    className="w-12 h-12 rounded-xl bg-[#F7F5FA] hover:bg-[#E5DFEE] disabled:opacity-40 disabled:cursor-not-allowed text-[#24126E] font-bold flex items-center justify-center border border-slate-200 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      id="input-borrow-quantity"
                      type="number"
                      min={1}
                      max={calculateAvailableQuantity(selectedMaterial, loans)}
                      value={borrowQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setBorrowQuantity(val);
                      }}
                      className="w-full text-center py-3 bg-[#F7F5FA] rounded-xl border border-slate-200 text-[#24126E] font-extrabold text-lg focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const max = calculateAvailableQuantity(selectedMaterial, loans);
                      setBorrowQuantity(prev => Math.min(max, prev + 1));
                    }}
                    disabled={borrowQuantity >= calculateAvailableQuantity(selectedMaterial, loans)}
                    className="w-12 h-12 rounded-xl bg-[#F7F5FA] hover:bg-[#E5DFEE] disabled:opacity-40 disabled:cursor-not-allowed text-[#24126E] font-bold flex items-center justify-center border border-slate-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Timestamp & Borrower Info Preview */}
              <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100/70 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#24126E]">
                  <span className="flex items-center gap-1 text-slate-500">
                    <User className="w-3.5 h-3.5 text-[#D70096]" />
                    Lener:
                  </span>
                  <span className="font-bold">{userSession.name} ({userSession.team})</span>
                </div>
                <div className="flex items-center justify-between text-[#24126E]">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-[#D70096]" />
                    Datum & Tijd:
                  </span>
                  <span className="font-medium">
                    {currentDateTime.dateStr} om {currentDateTime.timeStr}
                  </span>
                </div>
              </div>

              {/* Error message */}
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedMaterial(null)}
                  className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-[#F7F5FA] hover:bg-slate-200/80 text-slate-600 font-bold text-xs transition-colors"
                >
                  Annuleren
                </button>
                <button
                  id="btn-confirm-borrow-submit"
                  type="submit"
                  className="w-full sm:flex-[2] py-3 px-5 rounded-xl bg-[#D70096] hover:bg-[#b5007e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#D70096]/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Uitleen registreren</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Confirmation Dialog */}
      {recentSuccess && (
        <div 
          id="modal-borrow-success"
          className="fixed inset-0 z-50 bg-[#1F1735]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full mb-3 inline-block">
              Succesvol geregistreerd
            </span>

            <h3 className="text-xl sm:text-2xl font-extrabold text-[#24126E] mt-2 mb-2">
              Uitleen geregistreerd
            </h3>

            {/* Exact requested text format */}
            <div className="bg-[#F7F5FA] border border-slate-100 rounded-2xl p-4 my-4 text-left space-y-2">
              <p className="text-sm font-semibold text-[#24126E]">
                Uitleen geregistreerd voor <span className="text-[#D70096]">{recentSuccess.loan.borrowerName}</span> van team <span className="text-[#D70096]">{recentSuccess.loan.borrowerTeam}</span>.
              </p>
              
              <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Materiaal</span>
                  <span className="font-bold text-[#24126E]">{recentSuccess.loan.quantity}x {recentSuccess.loan.materialName}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Tijdstip</span>
                  <span className="font-medium text-[#24126E]">{recentSuccess.loan.borrowedAtDate} om {recentSuccess.loan.borrowedAtTime}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              Vergeet niet het materiaal na gebruik weer in te leveren bij de beheerder.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="btn-borrow-another"
                onClick={() => setRecentSuccess(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white font-bold text-xs transition-colors shadow-sm"
              >
                Nog een item lenen
              </button>
              <button
                id="btn-finish-lending"
                onClick={() => {
                  setRecentSuccess(null);
                  onFinishSession();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F7F5FA] hover:bg-slate-200/80 text-slate-600 font-bold text-xs transition-colors border border-slate-200/80"
              >
                Klaar (Startscherm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
