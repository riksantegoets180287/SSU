import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Barcode, 
  Package, 
  AlertTriangle, 
  X, 
  Check, 
  ExternalLink,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Upload,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';
import { Material, Category, Loan } from '../../types';
import { calculateAvailableQuantity } from '../../lib/storage';
import { compressImageFile } from '../../lib/barcode';

interface AdminMaterialsProps {
  materials: Material[];
  categories: Category[];
  loans: Loan[];
  onAddMaterial: (data: Omit<Material, 'id' | 'createdAt'>) => void;
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (materialId: string) => void;
  onNavigateToCategories: () => void;
  onResetToStandardMaterials?: () => void;
}

export const AdminMaterials: React.FC<AdminMaterialsProps> = ({
  materials,
  categories,
  loans,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onNavigateToCategories,
  onResetToStandardMaterials,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Image upload tab & drag state
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    totalQuantity: 1,
    optionalBarcode: '',
    optionalImageUrl: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      if (categoryFilter !== 'all' && m.categoryId !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cat = categories.find(c => c.id === m.categoryId)?.name.toLowerCase() || '';
        return (
          m.name.toLowerCase().includes(q) ||
          (m.optionalBarcode && m.optionalBarcode.toLowerCase().includes(q)) ||
          (m.notes && m.notes.toLowerCase().includes(q)) ||
          cat.includes(q)
        );
      }
      return true;
    });
  }, [materials, categoryFilter, searchQuery, categories]);

  const openAddModal = () => {
    if (categories.length === 0) return;
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      totalQuantity: 1,
      optionalBarcode: '',
      optionalImageUrl: '',
      notes: '',
    });
    setImageInputMode('upload');
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const openEditModal = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      categoryId: material.categoryId,
      totalQuantity: material.totalQuantity,
      optionalBarcode: material.optionalBarcode || '',
      optionalImageUrl: material.optionalImageUrl || '',
      notes: material.notes || '',
    });
    if (material.optionalImageUrl && material.optionalImageUrl.startsWith('http')) {
      setImageInputMode('url');
    } else {
      setImageInputMode('upload');
    }
    setFormErrors({});
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
    // Reset file input value to allow re-uploading same file if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processSelectedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }
    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImageFile(file, 800, 800, 0.8);
      setFormData(prev => ({ ...prev, optionalImageUrl: compressedDataUrl }));
    } catch (err) {
      console.error('Fout bij verwerken van afbeelding:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, optionalImageUrl: '' }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      errors.name = 'Materiaalnaam is verplicht.';
    }
    if (!formData.categoryId) {
      errors.categoryId = 'Selecteer een categorie.';
    }
    if (Number(formData.totalQuantity) < 1) {
      errors.totalQuantity = 'Aantal moet minimaal 1 zijn.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onAddMaterial({
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      totalQuantity: Number(formData.totalQuantity),
      optionalBarcode: formData.optionalBarcode.trim() || undefined,
      optionalImageUrl: formData.optionalImageUrl.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });

    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial || !validateForm()) return;

    onEditMaterial({
      ...editingMaterial,
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      totalQuantity: Number(formData.totalQuantity),
      optionalBarcode: formData.optionalBarcode.trim() || undefined,
      optionalImageUrl: formData.optionalImageUrl.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    });

    setEditingMaterial(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingMaterial) return;
    onDeleteMaterial(deletingMaterial.id);
    setDeletingMaterial(null);
  };

  // If no categories exist, show empty state prompt
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E5DFEE] p-8 sm:p-12 text-center max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-[#FDF0F8] text-[#D70096] flex items-center justify-center mx-auto mb-4">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-[#24126E] mb-2">
          Maak eerst een categorie aan
        </h3>
        <p className="text-xs text-[#645E78] leading-relaxed mb-6">
          Om materialen toe te kunnen voegen moet er minimaal één categorie bestaan (bijvoorbeeld ICT, Gereedschap of Lesmateriaal).
        </p>
        <button
          onClick={onNavigateToCategories}
          className="px-5 py-3 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white font-bold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Naar categorieën beheer</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#645E78]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek materiaal of barcode..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#E5DFEE] text-xs text-[#1F1735] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 bg-white rounded-xl border border-[#E5DFEE] text-xs font-semibold text-[#24126E] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
          >
            <option value="all">Alle categorieën ({materials.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onResetToStandardMaterials && (
            <button
              id="btn-reset-standard-materials"
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5DFEE] hover:border-indigo-300 bg-white hover:bg-[#F7F5FA] text-[#24126E] font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Herstel naar de 19 standaard Summa Plus producten"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#D70096]" />
              <span>Herstel 19 standaard producten</span>
            </button>
          )}

          <button
            id="btn-add-material"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuw materiaal toevoegen</span>
          </button>
        </div>
      </div>

      {/* Materials List / Table */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5DFEE] p-8 text-center">
          <Package className="w-10 h-10 text-[#645E78]/40 mx-auto mb-2" />
          <p className="text-sm font-bold text-[#24126E]">Geen materialen gevonden</p>
          <p className="text-xs text-[#645E78] mt-1">Pas je zoekopdracht aan of voeg een nieuw materiaal toe.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5DFEE] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5FA] border-b border-[#E5DFEE] text-[#24126E] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Materiaal</th>
                  <th className="px-4 py-3.5">Categorie</th>
                  <th className="px-4 py-3.5">Voorraad</th>
                  <th className="px-4 py-3.5">Barcode</th>
                  <th className="px-4 py-3.5">Notities</th>
                  <th className="px-5 py-3.5 text-right">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBF7]">
                {filteredMaterials.map((material) => {
                  const category = categories.find(c => c.id === material.categoryId);
                  const available = calculateAvailableQuantity(material, loans);
                  const activeBorrowed = material.totalQuantity - available;

                  return (
                    <tr key={material.id} className="hover:bg-[#FDF0F8]/30 transition-colors">
                      {/* Name & Image */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#F7F5FA] border border-[#E5DFEE] overflow-hidden shrink-0 flex items-center justify-center">
                            {material.optionalImageUrl ? (
                              <img
                                src={material.optionalImageUrl}
                                alt={material.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-[#24126E]/40" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#24126E] text-sm">{material.name}</p>
                            <span className="text-[10px] text-[#645E78]">ID: {material.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="inline-block bg-[#EEECF8] text-[#24126E] font-semibold px-2.5 py-1 rounded-md text-[11px]">
                          {category?.name || 'Onbekend'}
                        </span>
                      </td>

                      {/* Stock availability */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${available > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                              {available} beschikbaar
                            </span>
                            <span className="text-[#645E78]">/ {material.totalQuantity} tot.</span>
                          </div>
                          {activeBorrowed > 0 && (
                            <span className="inline-block text-[10px] text-[#D70096] font-medium bg-[#FDF0F8] px-2 py-0.5 rounded">
                              {activeBorrowed} momenteel uitgeleend
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Barcode */}
                      <td className="px-4 py-4">
                        {material.optionalBarcode ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-[#F7F5FA] border border-[#E5DFEE] px-2 py-0.5 rounded text-[#24126E]">
                            <Barcode className="w-3 h-3 text-[#645E78]" />
                            {material.optionalBarcode}
                          </span>
                        ) : (
                          <span className="text-[#645E78]/50 italic">-</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-4 max-w-xs">
                        <p className="text-[#645E78] text-[11px] truncate">
                          {material.notes || '-'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-mat-${material.id}`}
                            onClick={() => openEditModal(material)}
                            title="Bewerken"
                            className="w-8 h-8 rounded-lg bg-[#F7F5FA] hover:bg-[#EEECF8] text-[#24126E] flex items-center justify-center transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-delete-mat-${material.id}`}
                            onClick={() => setDeletingMaterial(material)}
                            title="Verwijderen"
                            className="w-8 h-8 rounded-lg bg-[#F7F5FA] hover:bg-red-50 text-[#645E78] hover:text-red-600 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Material Modal */}
      {(isAddModalOpen || editingMaterial) && (
        <div className="fixed inset-0 z-50 bg-[#1F1735]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E5DFEE] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D70096] block mb-1">
                  {editingMaterial ? 'Bewerken' : 'Nieuw item'}
                </span>
                <h3 className="text-xl font-extrabold text-[#24126E]">
                  {editingMaterial ? 'Materiaal bewerken' : 'Materiaal toevoegen'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMaterial(null);
                }}
                className="w-8 h-8 rounded-full bg-[#F7F5FA] hover:bg-[#E5DFEE] text-[#645E78] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingMaterial ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#24126E] mb-1.5">
                  Materiaalnaam <span className="text-[#D70096]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="bijv. Laptop oplader of HDMI kabel"
                  className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE] text-xs text-[#1F1735] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
                  autoFocus
                />
                {formErrors.name && (
                  <p className="mt-1 text-[11px] text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Category & Quantity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#24126E] mb-1.5">
                    Categorie <span className="text-[#D70096]">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE] text-xs font-semibold text-[#24126E] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24126E] mb-1.5">
                    Totale voorraad <span className="text-[#D70096]">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalQuantity: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE] text-xs text-[#1F1735] font-bold focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
                  />
                  {formErrors.totalQuantity && (
                    <p className="mt-1 text-[11px] text-red-600">{formErrors.totalQuantity}</p>
                  )}
                </div>
              </div>

              {/* Barcode (optional) */}
              <div>
                <label className="block text-xs font-bold text-[#24126E] mb-1.5">
                  Barcode / Scan code (optioneel)
                </label>
                <div className="relative">
                  <Barcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#645E78]" />
                  <input
                    type="text"
                    value={formData.optionalBarcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, optionalBarcode: e.target.value }))}
                    placeholder="bijv. ICT-LAP-001"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE] text-xs font-mono text-[#1F1735] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
                  />
                </div>
              </div>

              {/* Image upload / URL section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#24126E]">
                    Productafbeelding (optioneel)
                  </label>
                  <div className="flex items-center bg-[#F7F5FA] p-0.5 rounded-lg border border-[#E5DFEE] text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        imageInputMode === 'upload'
                          ? 'bg-white text-[#24126E] shadow-xs'
                          : 'text-[#645E78] hover:text-[#24126E]'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Van computer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                        imageInputMode === 'url'
                          ? 'bg-white text-[#24126E] shadow-xs'
                          : 'text-[#645E78] hover:text-[#24126E]'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Weblink</span>
                    </button>
                  </div>
                </div>

                {/* Mode 1: Upload from Computer */}
                {imageInputMode === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      className="hidden"
                    />

                    {formData.optionalImageUrl ? (
                      <div className="bg-[#F7F5FA] border border-[#E5DFEE] rounded-2xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-white border border-[#E5DFEE] overflow-hidden shrink-0 shadow-xs">
                            <img
                              src={formData.optionalImageUrl}
                              alt="Geselecteerde afbeelding"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#24126E] flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Afbeelding geüpload
                            </p>
                            <span className="text-[10px] text-[#645E78]">
                              Geoptimaliseerd voor opslag
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-[#24126E] text-xs font-semibold rounded-lg border border-[#E5DFEE] transition-colors cursor-pointer"
                          >
                            Wijzigen
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="p-1.5 bg-white hover:bg-red-50 text-red-600 rounded-lg border border-[#E5DFEE] transition-colors cursor-pointer"
                            title="Afbeelding verwijderen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                          isDragging
                            ? 'border-[#D70096] bg-[#FDF0F8]'
                            : 'border-[#E5DFEE] hover:border-[#24126E]/40 bg-[#F7F5FA] hover:bg-[#EEECF8]/40'
                        }`}
                      >
                        {isCompressing ? (
                          <div className="py-2 flex flex-col items-center justify-center gap-2 text-[#24126E]">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#D70096]" />
                            <span className="text-xs font-bold">Afbeelding verwerken...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5DFEE] text-[#24126E] flex items-center justify-center mb-2 shadow-xs">
                              <UploadCloud className="w-5 h-5 text-[#D70096]" />
                            </div>
                            <p className="text-xs font-bold text-[#24126E]">
                              Klik om foto te uploaden <span className="font-normal text-[#645E78]">of sleep hierheen</span>
                            </p>
                            <p className="text-[10px] text-[#645E78] mt-1">
                              PNG, JPG of WEBP (max. 10MB)
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Mode 2: External Image URL */}
                {imageInputMode === 'url' && (
                  <div className="space-y-2">
                    <div className="relative">
                      <ImageIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#645E78]" />
                      <input
                        type="url"
                        value={formData.optionalImageUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, optionalImageUrl: e.target.value }))}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE] text-xs text-[#1F1735] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
                      />
                    </div>
                    {formData.optionalImageUrl && (
                      <div className="flex items-center gap-3 p-2 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE]">
                        <div className="w-12 h-12 rounded-lg bg-white border border-[#E5DFEE] overflow-hidden shrink-0">
                          <img
                            src={formData.optionalImageUrl}
                            alt="Voorbeeld"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#24126E] truncate">
                            {formData.optionalImageUrl}
                          </p>
                          <span className="text-[10px] text-emerald-600 font-bold">
                            Voorbeeld geladen
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-xs font-bold text-[#24126E] mb-1.5">
                  Notities / Specificaties (optioneel)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="bijv. Universele USB-C 65W lader"
                  className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE] text-xs text-[#1F1735] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMaterial(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7F5FA] hover:bg-[#E5DFEE] text-[#645E78] font-bold text-xs transition-colors"
                >
                  Annuleren
                </button>
                <button
                  id="btn-save-material-submit"
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingMaterial ? 'Wijzigingen opslaan' : 'Toevoegen'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMaterial && (
        <div className="fixed inset-0 z-50 bg-[#1F1735]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E5DFEE] text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-[#24126E] mb-2">
              Materiaal verwijderen?
            </h3>
            <p className="text-xs text-[#645E78] mb-4">
              Weet je zeker dat je <strong>{deletingMaterial.name}</strong> wilt verwijderen uit het systeem?
            </p>

            {loans.some(l => l.materialId === deletingMaterial.id && l.status === 'uitgeleend') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs mb-4 text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Let op: er zijn momenteel nog actieve uitleningen voor dit artikel.
                </span>
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={() => setDeletingMaterial(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7F5FA] hover:bg-[#E5DFEE] text-[#645E78] font-bold text-xs transition-colors"
              >
                Annuleren
              </button>
              <button
                id="btn-confirm-delete-material"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors"
              >
                Definitief verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && onResetToStandardMaterials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E5DFEE] space-y-4">
            <div className="flex items-center gap-3 text-[#24126E]">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-[#24126E]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-[#24126E]">Standaard Producten Herstellen</h3>
                <p className="text-xs text-[#645E78]">19 producten (servies, laders, schoonmaak, diensten)</p>
              </div>
            </div>

            <p className="text-xs text-[#645E78] leading-relaxed">
              Weet je zeker dat je het uitleensysteem wilt leegmaken en herstellen naar de <strong>19 standaard producten</strong>?
              Bestaande oude testmaterialen en actieve uitleningen worden hierbij opgeschoond.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7F5FA] hover:bg-[#E5DFEE] text-[#645E78] font-bold text-xs transition-colors cursor-pointer"
              >
                Annuleren
              </button>
              <button
                id="btn-confirm-reset-materials"
                type="button"
                onClick={() => {
                  onResetToStandardMaterials();
                  setIsResetConfirmOpen(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Ja, herstel 19 producten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
