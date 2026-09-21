import React, { useState, useRef } from 'react';
import { 
  Utensils, 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Upload, 
  Tag, 
  Layers, 
  RotateCcw,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Flame
} from 'lucide-react';
import { MenuItem, ServiceTicket } from '../../types';
import { calculateOrderedPortions, calculateRemainingPortions } from '../../lib/storage';
import { compressImageFile } from '../../lib/barcode';

interface MenuManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onSaveMenuItems: (items: MenuItem[]) => void;
  tickets: ServiceTicket[];
}

const PRESET_DISH_IMAGES = [
  {
    name: 'Boerenkool & Rookworst',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    category: 'hoofdgerecht'
  },
  {
    name: 'Tomaten-groentesoep',
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    category: 'soep'
  },
  {
    name: 'Broodje Warm Vlees & Saté',
    url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    category: 'broodje'
  },
  {
    name: 'Vegetarische Quiche',
    url: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=800&q=80',
    category: 'hoofdgerecht'
  },
  {
    name: 'Pasta Bolognese',
    url: 'https://images.unsplash.com/photo-1621996346565-e3d5d62810a9?auto=format&fit=crop&w=800&q=80',
    category: 'hoofdgerecht'
  },
  {
    name: 'Kip Wrap & Kruiden',
    url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
    category: 'broodje'
  },
  {
    name: 'Gezonde Salade Bowl',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    category: 'overig'
  },
  {
    name: 'Erwtensoep (Snert)',
    url: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=800&q=80',
    category: 'soep'
  },
  {
    name: 'Huisgemaakt Dessert / Gebak',
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    category: 'dessert'
  }
];

export const MenuManagementModal: React.FC<MenuManagementModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  onSaveMenuItems,
  tickets,
}) => {
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedPresetImage, setSelectedPresetImage] = useState<string>('');
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('€ 4,00');
  const [category, setCategory] = useState<MenuItem['category']>('hoofdgerecht');
  const [imageUrl, setImageUrl] = useState('');
  const [maxDailyPortions, setMaxDailyPortions] = useState<number>(20);
  const [dietaryTag, setDietaryTag] = useState('Specialiteit vd Week');
  const [active, setActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartCreate = () => {
    setEditingDish(null);
    setIsCreatingNew(true);
    setName('');
    setDescription('');
    setPrice('€ 4,00');
    setCategory('hoofdgerecht');
    setImageUrl(PRESET_DISH_IMAGES[0].url);
    setMaxDailyPortions(20);
    setDietaryTag('Specialiteit vd Week');
    setActive(true);
    setShowPresetPicker(false);
  };

  const handleStartEdit = (dish: MenuItem) => {
    setIsCreatingNew(false);
    setEditingDish(dish);
    setName(dish.name);
    setDescription(dish.description);
    setPrice(dish.price || '€ 4,00');
    setCategory(dish.category || 'hoofdgerecht');
    setImageUrl(dish.imageUrl || '');
    setMaxDailyPortions(dish.maxDailyPortions || 20);
    setDietaryTag(dish.dietaryTag || '');
    setActive(dish.active);
    setShowPresetPicker(false);
  };

  const handleCancelForm = () => {
    setIsCreatingNew(false);
    setEditingDish(null);
    setShowPresetPicker(false);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const compressed = await compressImageFile(files[0], 900, 900, 0.8);
      setImageUrl(compressed);
      showToast('Nieuwe afbeelding/flyer succesvol geüpload!');
    } catch {
      showToast('Kon foto niet verwerken.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isCreatingNew) {
      const newDish: MenuItem = {
        id: `dish-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        price: price.trim(),
        category,
        imageUrl: imageUrl.trim() || PRESET_DISH_IMAGES[0].url,
        maxDailyPortions: Number(maxDailyPortions) > 0 ? Number(maxDailyPortions) : 10,
        dietaryTag: dietaryTag.trim(),
        active,
      };
      const updated = [...menuItems, newDish];
      onSaveMenuItems(updated);
      showToast(`Gerecht "${newDish.name}" toegevoegd aan het menu!`);
    } else if (editingDish) {
      const updated = menuItems.map(item => {
        if (item.id === editingDish.id) {
          return {
            ...item,
            name: name.trim(),
            description: description.trim(),
            price: price.trim(),
            category,
            imageUrl: imageUrl.trim() || item.imageUrl,
            maxDailyPortions: Number(maxDailyPortions) > 0 ? Number(maxDailyPortions) : item.maxDailyPortions,
            dietaryTag: dietaryTag.trim(),
            active,
          };
        }
        return item;
      });
      onSaveMenuItems(updated);
      showToast(`Gerecht "${name}" succesvol bijgewerkt!`);
    }

    handleCancelForm();
  };

  const handleDeleteDish = (dishId: string, dishName: string) => {
    if (window.confirm(`Weet je zeker dat je het gerecht "${dishName}" wilt verwijderen uit het weekmenu?`)) {
      const updated = menuItems.filter(item => item.id !== dishId);
      onSaveMenuItems(updated);
      showToast(`Gerecht "${dishName}" verwijderd.`);
      if (editingDish?.id === dishId) {
        handleCancelForm();
      }
    }
  };

  const handleToggleActive = (dishId: string) => {
    const updated = menuItems.map(item => {
      if (item.id === dishId) {
        const next = !item.active;
        showToast(next ? `"${item.name}" staat nu op het weekmenu!` : `"${item.name}" gedeactiveerd.`);
        return { ...item, active: next };
      }
      return item;
    });
    onSaveMenuItems(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1F1735]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200/80 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-[#24126E] text-white flex items-center justify-between border-b border-indigo-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D70096] text-white flex items-center justify-center shadow-md">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-pink-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Keukenbeheer DV Team
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Weekmenu & Portiecapaciteit
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-banner notification */}
        {notification && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {/* Quick Info & Action Bar */}
          <div className="bg-[#F7F5FA] rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-[#24126E] flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#D70096]" />
                <span>Wekelijks menu & quotum beheer</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Beheer hier de gerechten die zichtbaar zijn in het aanvraagformulier voor collega&apos;s. Stel per gerecht in hoeveel porties de keuken maximaal kan bereiden (teller voorkomt overboeking) en wijzig gemakkelijk de afbeelding of flyer.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartCreate}
              className="px-4 py-2.5 bg-[#D70096] hover:bg-[#b5007e] active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nieuw gerecht toevoegen</span>
            </button>
          </div>

          {/* EDIT / CREATE FORM DRAWER */}
          {(isCreatingNew || editingDish) && (
            <div className="bg-white border-2 border-[#D70096]/40 rounded-3xl p-5 sm:p-6 shadow-md space-y-5 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-black text-base text-[#24126E] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D70096]" />
                  <span>{isCreatingNew ? 'Nieuw gerecht op het menu zetten' : `Gerecht bewerken: ${editingDish?.name}`}</span>
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Annuleren
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Naam */}
                  <div>
                    <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1">
                      Naam van het gerecht *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="bijv. Boerenkool met Ambachtelijke Rookworst"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                    />
                  </div>

                  {/* Prijs */}
                  <div>
                    <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1">
                      Prijs / Vergoeding
                    </label>
                    <input
                      type="text"
                      placeholder="bijv. € 4,50 of Gratis"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Categorie */}
                  <div>
                    <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1">
                      Type gerecht
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as MenuItem['category'])}
                      className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] cursor-pointer"
                    >
                      <option value="hoofdgerecht">Hoofdgerecht / Warme maaltijd</option>
                      <option value="soep">Soep & Breekbrood</option>
                      <option value="broodje">Broodje / Lunch</option>
                      <option value="snack">Snack / Tussendoortje</option>
                      <option value="dessert">Dessert / Gebak</option>
                      <option value="overig">Overig</option>
                    </select>
                  </div>

                  {/* Keukencapaciteit teller */}
                  <div>
                    <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Max porties (Capaciteit) *</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      required
                      value={maxDailyPortions}
                      onChange={(e) => setMaxDailyPortions(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Zoveel porties kan de keuken maken</span>
                  </div>

                  {/* Dieet/Tag label */}
                  <div>
                    <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1">
                      Label / Tag
                    </label>
                    <input
                      type="text"
                      placeholder="bijv. Specialiteit vd Week of Vegetarisch 🌱"
                      value={dietaryTag}
                      onChange={(e) => setDietaryTag(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                    />
                  </div>
                </div>

                {/* Omschrijving */}
                <div>
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1">
                    Smaakvolle omschrijving & ingrediënten
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Beschrijf het gerecht zodat mensen trek krijgen (bijv. verse boerenkool met Gelderse rookworst en jus)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                  />
                </div>

                {/* Afbeelding / Flyer Selectie */}
                <div className="p-4 bg-[#F7F5FA] rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="block text-xs font-bold text-[#24126E] uppercase tracking-wider">
                        Afbeelding of Flyer van het gerecht
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Upload een eigen foto/flyer, plak een fotolink of kies een heerlijke voorbeeldfoto.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#D70096]" />
                        <span>{isUploading ? 'Bezig met uploaden...' : 'Foto uploaden'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowPresetPicker(!showPresetPicker)}
                        className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-[#24126E] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#24126E]" />
                        <span>Kies voorbeeldfoto</span>
                      </button>
                    </div>
                  </div>

                  {/* Image Preview & URL input */}
                  <div className="flex items-center gap-4 pt-1">
                    <div className="w-24 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-inner">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Gerecht preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        placeholder="Of plak directe afbeeldings-URL (https://...)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                      />
                    </div>
                  </div>

                  {/* Preset picker carousel/grid */}
                  {showPresetPicker && (
                    <div className="pt-3 border-t border-slate-200 grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {PRESET_DISH_IMAGES.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setImageUrl(preset.url);
                            setShowPresetPicker(false);
                          }}
                          className="group cursor-pointer rounded-xl overflow-hidden border border-slate-200 hover:border-[#D70096] relative aspect-square transition-all"
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-1.5">
                            <span className="text-[10px] font-bold text-white leading-tight line-clamp-1">
                              {preset.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Switch & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 text-[#D70096] rounded border-slate-300 focus:ring-[#D70096]"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Gerecht actief aanbieden op het bestelformulier van deze week
                    </span>
                  </label>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#24126E] hover:bg-[#1A0D52] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      {isCreatingNew ? 'Gerecht Toevoegen' : 'Wijzigingen Opslaan'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* DISHES LIST VIEW */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Huidige Gerechten op het Menu ({menuItems.length})
              </span>
            </div>

            {menuItems.length === 0 ? (
              <div className="bg-[#F7F5FA] rounded-2xl p-8 text-center border border-slate-200">
                <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Nog geen gerechten ingesteld voor het weekmenu.</p>
                <button
                  onClick={handleStartCreate}
                  className="mt-3 px-4 py-2 bg-[#24126E] text-white text-xs font-bold rounded-xl"
                >
                  Voeg het eerste gerecht toe
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((dish) => {
                  const orderedCount = calculateOrderedPortions(dish.id, tickets);
                  const remainingCount = calculateRemainingPortions(dish, tickets);
                  const isSoldOut = remainingCount === 0;

                  return (
                    <div
                      key={dish.id}
                      className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                        dish.active 
                          ? 'border-slate-200/90 hover:border-[#24126E]/40' 
                          : 'border-slate-200/50 opacity-60 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        {/* Image + Quick details */}
                        <div className="flex gap-3.5 mb-3">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-100 bg-slate-100 shrink-0 relative shadow-xs">
                            <img
                              src={dish.imageUrl || PRESET_DISH_IMAGES[0].url}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {dish.dietaryTag && (
                              <div className="absolute top-1 left-1 bg-[#24126E]/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                                {dish.dietaryTag}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="font-extrabold text-sm text-[#24126E] leading-snug truncate">
                                {dish.name}
                              </h4>
                            </div>

                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {dish.description}
                            </p>

                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-black text-xs text-[#D70096] bg-pink-50 px-2 py-0.5 rounded-md">
                                {dish.price || '€ 4,00'}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                {dish.category || 'hoofdgerecht'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quota & Live Stock Counter */}
                        <div className="bg-[#F7F5FA] rounded-xl p-3 border border-slate-200/70 mb-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Reeds besteld vandaag:</span>
                            <span className="font-black text-[#24126E]">{orderedCount} porties</span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Keuken capaciteit (Max):</span>
                            <span className="font-black text-slate-700">{dish.maxDailyPortions} porties</span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isSoldOut 
                                  ? 'bg-red-500' 
                                  : remainingCount <= 3 
                                  ? 'bg-amber-500' 
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.round((orderedCount / dish.maxDailyPortions) * 100))}%` }}
                            ></div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                              Resterend voor bestelling:
                            </span>
                            <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                              isSoldOut
                                ? 'bg-red-100 text-red-700'
                                : remainingCount <= 3
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isSoldOut ? 'Uitverkocht' : `Nog ${remainingCount} beschikbaar`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(dish.id)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            dish.active 
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {dish.active ? 'Actief op menu' : 'Niet actief'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(dish)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Gerecht & Porties bewerken"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDish(dish.id, dish.name)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title="Gerecht verwijderen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Wijzigingen worden direct overal in het systeem en voor de aanvragers live bijgewerkt.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#24126E] hover:bg-[#1A0D52] text-white font-bold text-xs rounded-xl shadow-xs ml-auto cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
