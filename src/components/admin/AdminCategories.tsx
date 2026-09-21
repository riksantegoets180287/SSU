import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Layers, AlertCircle, Check, X, ShieldAlert, Package } from 'lucide-react';
import { Category, Material } from '../../types';

interface AdminCategoriesProps {
  categories: Category[];
  materials: Material[];
  onAddCategory: (name: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({
  categories,
  materials,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openAddModal = () => {
    setCategoryName('');
    setError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setError(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError('Categorienaam mag niet leeg zijn.');
      return;
    }

    if (categories.some(c => c.name.toLowerCase() === categoryName.trim().toLowerCase())) {
      setError('Er bestaat al een categorie met deze naam.');
      return;
    }

    onAddCategory(categoryName.trim());
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    if (!categoryName.trim()) {
      setError('Categorienaam mag niet leeg zijn.');
      return;
    }

    if (
      categories.some(
        c => c.id !== editingCategory.id && c.name.toLowerCase() === categoryName.trim().toLowerCase()
      )
    ) {
      setError('Er bestaat al een andere categorie met deze naam.');
      return;
    }

    onEditCategory({
      ...editingCategory,
      name: categoryName.trim(),
    });
    setEditingCategory(null);
  };

  const getLinkedMaterials = (categoryId: string) => {
    return materials.filter(m => m.categoryId === categoryId);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#24126E]">
            Overzicht van alle categorieën
          </h3>
          <p className="text-xs text-[#645E78]">
            Beheer de rubrieken waaronder materialen worden geordend.
          </p>
        </div>

        <button
          id="btn-add-category"
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuwe categorie toevoegen</span>
        </button>
      </div>

      {/* Categories Grid / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const linked = getLinkedMaterials(cat.id);
          const hasLinked = linked.length > 0;

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-[#E5DFEE] p-5 shadow-xs flex flex-col justify-between hover:border-[#24126E]/40 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EEECF8] text-[#24126E] flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-edit-cat-${cat.id}`}
                      onClick={() => openEditModal(cat)}
                      title="Bewerken"
                      className="w-8 h-8 rounded-lg bg-[#F7F5FA] hover:bg-[#EEECF8] text-[#24126E] flex items-center justify-center transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-delete-cat-${cat.id}`}
                      onClick={() => setDeletingCategory(cat)}
                      title={hasLinked ? 'Kan niet verwijderd worden (bevat materialen)' : 'Verwijderen'}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        hasLinked
                          ? 'bg-[#F7F5FA] text-[#645E78]/40 hover:text-[#645E78]'
                          : 'bg-[#F7F5FA] hover:bg-red-50 text-[#645E78] hover:text-red-600'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-base font-bold text-[#24126E] mb-1">
                  {cat.name}
                </h4>

                <p className="text-xs text-[#645E78]">
                  {hasLinked ? (
                    <span className="font-semibold text-[#24126E]">
                      {linked.length} {linked.length === 1 ? 'materiaal' : 'materialen'} gekoppeld
                    </span>
                  ) : (
                    <span className="text-[#645E78]/70 italic">Geen materialen gekoppeld</span>
                  )}
                </p>
              </div>

              {/* Linked material preview chips */}
              {hasLinked && (
                <div className="mt-4 pt-3 border-t border-[#F0EBF7] flex flex-wrap gap-1">
                  {linked.slice(0, 3).map(m => (
                    <span key={m.id} className="text-[10px] bg-[#F7F5FA] text-[#645E78] px-2 py-0.5 rounded border border-[#E5DFEE]">
                      {m.name}
                    </span>
                  ))}
                  {linked.length > 3 && (
                    <span className="text-[10px] text-[#645E78] font-medium px-1">
                      +{linked.length - 3} meer
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {(isAddModalOpen || editingCategory) && (
        <div className="fixed inset-0 z-50 bg-[#1F1735]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E5DFEE]">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D70096] block mb-1">
                  {editingCategory ? 'Bewerken' : 'Nieuwe categorie'}
                </span>
                <h3 className="text-xl font-extrabold text-[#24126E]">
                  {editingCategory ? 'Categorie bewerken' : 'Categorie toevoegen'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCategory(null);
                }}
                className="w-8 h-8 rounded-full bg-[#F7F5FA] hover:bg-[#E5DFEE] text-[#645E78] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingCategory ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#24126E] mb-1.5">
                  Categorienaam <span className="text-[#D70096]">*</span>
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="bijv. Audio/Visueel of EHBO"
                  className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE] text-xs text-[#1F1735] font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
                  autoFocus
                />
                {error && (
                  <p className="mt-1 text-[11px] text-red-600">{error}</p>
                )}
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7F5FA] hover:bg-[#E5DFEE] text-[#645E78] font-bold text-xs transition-colors"
                >
                  Annuleren
                </button>
                <button
                  id="btn-save-category-submit"
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCategory ? 'Opslaan' : 'Toevoegen'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Check & Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-[#1F1735]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E5DFEE] text-center">
            {getLinkedMaterials(deletingCategory.id).length > 0 ? (
              // BLOCKED: Linked materials exist
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                  <ShieldAlert className="w-7 h-7" />
                </div>

                <h3 className="text-lg font-bold text-[#24126E] mb-2">
                  Categorie kan niet verwijderd worden
                </h3>
                <p className="text-xs text-[#645E78] mb-4 leading-relaxed">
                  Er zijn nog <strong>{getLinkedMaterials(deletingCategory.id).length}</strong> materialen gekoppeld aan de categorie <strong>{deletingCategory.name}</strong>.
                </p>
                <p className="text-xs text-[#645E78] mb-6">
                  Verplaats of verwijder eerst deze materialen voordat je deze categorie kunt verwijderen.
                </p>

                <button
                  onClick={() => setDeletingCategory(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#24126E] text-white font-bold text-xs hover:bg-[#1A0D52] transition-colors"
                >
                  Begrepen
                </button>
              </div>
            ) : (
              // ALLOWED: No linked materials
              <div>
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <Trash2 className="w-7 h-7" />
                </div>

                <h3 className="text-lg font-bold text-[#24126E] mb-2">
                  Categorie verwijderen?
                </h3>
                <p className="text-xs text-[#645E78] mb-6">
                  Weet je zeker dat je categorie <strong>{deletingCategory.name}</strong> wilt verwijderen?
                </p>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setDeletingCategory(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#F7F5FA] hover:bg-[#E5DFEE] text-[#645E78] font-bold text-xs transition-colors"
                  >
                    Annuleren
                  </button>
                  <button
                    id="btn-confirm-delete-category"
                    onClick={() => {
                      onDeleteCategory(deletingCategory.id);
                      setDeletingCategory(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors"
                  >
                    Verwijderen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
