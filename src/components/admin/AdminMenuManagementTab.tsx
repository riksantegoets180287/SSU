import React, { useState, useMemo, useRef } from 'react';
import { 
  Utensils, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  Sparkles, 
  Upload, 
  Tag, 
  RotateCcw,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Flame,
  Search,
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  ChefHat,
  ShoppingBag
} from 'lucide-react';
import { MenuItem, ServiceTicket } from '../../types';
import { calculateOrderedPortions, calculateRemainingPortions } from '../../lib/storage';
import { compressImageFile } from '../../lib/barcode';

interface AdminMenuManagementTabProps {
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

export const AdminMenuManagementTab: React.FC<AdminMenuManagementTabProps> = ({
  menuItems,
  onSaveMenuItems,
  tickets,
}) => {
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('€ 4,00');
  const [category, setCategory] = useState<MenuItem['category']>('hoofdgerecht');
  const [imageUrl, setImageUrl] = useState('');
  const [maxDailyPortions, setMaxDailyPortions] = useState<number>(20);
  const [dietaryTag, setDietaryTag] = useState('Specialiteit vd Week');
  const [active, setActive] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // KPIs
  const activeDishes = useMemo(() => menuItems.filter(m => m.active), [menuItems]);
  const totalCapacity = useMemo(() => activeDishes.reduce((sum, d) => sum + (d.maxDailyPortions || 0), 0), [activeDishes]);
  const totalOrdered = useMemo(() => {
    return activeDishes.reduce((sum, d) => sum + calculateOrderedPortions(d.id, tickets), 0);
  }, [activeDishes, tickets]);
  const totalRemaining = Math.max(0, totalCapacity - totalOrdered);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesTag = item.dietaryTag?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesTag) return false;
      }
      return true;
    });
  }, [menuItems, categoryFilter, searchQuery]);

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
    setDescription(dish.description || '');
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
        maxDailyPortions: Number(maxDailyPortions) > 0 ? Number(maxDailyPortions) : 15,
        dietaryTag: dietaryTag.trim(),
        active,
      };
      const updated = [...menuItems, newDish];
      onSaveMenuItems(updated);
      showToast(`Gerecht "${newDish.name}" toegevoegd aan het weekmenu!`);
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
        const nextActive = !item.active;
        showToast(`Gerecht "${item.name}" ${nextActive ? 'geactiveerd op het menu' : 'gedeactiveerd'}.`);
        return { ...item, active: nextActive };
      }
      return item;
    });
    onSaveMenuItems(updated);
  };

  const handleQuickAdjustPortions = (dishId: string, delta: number) => {
    const updated = menuItems.map(item => {
      if (item.id === dishId) {
        const next = Math.max(1, (item.maxDailyPortions || 20) + delta);
        return { ...item, maxDailyPortions: next };
      }
      return item;
    });
    onSaveMenuItems(updated);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top KPI Cards for Portion Capacity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Gerechten op Menu
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#24126E]">
            {activeDishes.length}
            <span className="text-xs font-normal text-slate-400 ml-1">/ {menuItems.length} totaal</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Actief voor bestellingen</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Keukencapaciteit
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-600">
            {totalCapacity}
            <span className="text-xs font-normal text-slate-400 ml-1">porties</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Max te bereiden vandaag</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Besteld Vandaag
          </span>
          <div className="text-2xl sm:text-3xl font-black text-[#D70096]">
            {totalOrdered}
            <span className="text-xs font-normal text-slate-400 ml-1">porties</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Gereserveerd door collega&apos;s</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Nog Beschikbaar
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {totalRemaining}
            <span className="text-xs font-normal text-slate-400 ml-1">porties</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Vrij voor nieuwe bestellingen</p>
        </div>
      </div>

      {/* Action & Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Categorie Filter & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {['all', 'hoofdgerecht', 'soep', 'broodje', 'dessert', 'overig'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer capitalize ${
                  categoryFilter === cat
                    ? 'bg-white text-[#24126E] shadow-xs'
                    : 'text-slate-600 hover:text-[#24126E]'
                }`}
              >
                {cat === 'all' ? 'Alles' : cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Zoek gerecht..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#D70096] outline-hidden"
            />
          </div>
        </div>

        {/* Right: Add new dish button */}
        <button
          onClick={handleStartCreate}
          className="px-4 py-2.5 bg-[#D70096] hover:bg-[#b5007e] active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuw Gerecht Toevoegen</span>
        </button>
      </div>

      {/* CREATE OR EDIT FORM DRAWER */}
      {(isCreatingNew || editingDish) && (
        <div className="bg-white border-2 border-[#D70096]/40 rounded-3xl p-5 sm:p-6 shadow-md space-y-5 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="font-black text-base text-[#24126E] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D70096]" />
              <span>{isCreatingNew ? 'Nieuw gerecht toevoegen aan het weekmenu' : `Gerecht bewerken: ${editingDish?.name}`}</span>
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
                  <option value="hoofdgerecht">🍲 Warm Hoofdgerecht</option>
                  <option value="soep">🥣 Soep vd Dag</option>
                  <option value="broodje">🥪 Luxe Broodje / Lunch</option>
                  <option value="dessert">🍰 Toetje / Gebak</option>
                  <option value="overig">🥗 Salade / Overig</option>
                </select>
              </div>

              {/* Max dagelijkse porties */}
              <div>
                <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1">
                  Max porties per dag (quotum)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={maxDailyPortions}
                  onChange={(e) => setMaxDailyPortions(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Bestellingen stoppen zodra dit aantal is bereikt.</span>
              </div>

              {/* Dieet/Highlight label */}
              <div>
                <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1">
                  Label / Dieetkenmerk
                </label>
                <input
                  type="text"
                  placeholder="bijv. Vegetarisch, Halal, Tip!"
                  value={dietaryTag}
                  onChange={(e) => setDietaryTag(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                />
              </div>
            </div>

            {/* Omschrijving */}
            <div>
              <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1">
                Korte toelichting / ingrediënten
              </label>
              <textarea
                rows={2}
                placeholder="bijv. Stamppot boerenkool met jus, geserveerd met een ambachtelijke slagersrookworst."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
              />
            </div>

            {/* Afbeelding & Foto Selectie */}
            <div>
              <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                Foto of Gerechtflyer
              </label>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {imageUrl && (
                  <div className="relative w-28 h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                    <img src={imageUrl} alt="Voorbeeld" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPresetPicker(!showPresetPicker)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#24126E] text-xs font-bold rounded-xl border border-indigo-100 transition-colors cursor-pointer"
                    >
                      🖼️ Kies uit beeldbank ({PRESET_DISH_IMAGES.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-3 py-1.5 bg-[#F7F5FA] hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#D70096]" />
                      <span>{isUploading ? 'Verwerken...' : 'Eigen foto uploaden'}</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </div>

                  {showPresetPicker && (
                    <div className="p-3 bg-[#F7F5FA] rounded-2xl border border-slate-200 grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                      {PRESET_DISH_IMAGES.map((preset, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setImageUrl(preset.url);
                            setShowPresetPicker(false);
                          }}
                          className={`group relative rounded-xl overflow-hidden aspect-square cursor-pointer border-2 transition-all ${
                            imageUrl === preset.url ? 'border-[#D70096] ring-2 ring-[#D70096]/20' : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                            <span className="text-[9px] font-bold text-white leading-tight">{preset.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actief Vinkje */}
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#24126E]"></div>
              </label>
              <span className="text-xs font-bold text-[#24126E]">
                Direct beschikbaar op de menukaart voor collega&apos;s
              </span>
            </div>

            {/* Knoppen */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Annuleren
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-[#24126E] hover:bg-[#1a0c52] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#D70096]" />
                <span>{isCreatingNew ? 'Gerecht Toevoegen' : 'Wijzigingen Opslaan'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dish List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredMenuItems.map((dish) => {
          const ordered = calculateOrderedPortions(dish.id, tickets);
          const remaining = calculateRemainingPortions(dish, tickets);
          const isSoldOut = remaining <= 0;

          return (
            <div
              key={dish.id}
              className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                !dish.active
                  ? 'border-slate-200 opacity-60 bg-slate-50/50'
                  : isSoldOut
                  ? 'border-amber-300/80 ring-1 ring-amber-300/30'
                  : 'border-slate-200 hover:border-[#24126E]/40'
              }`}
            >
              <div>
                {/* Image & Badges */}
                <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                  {dish.imageUrl ? (
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                      <Utensils className="w-8 h-8" />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/95 text-[#24126E] shadow-xs backdrop-blur-xs">
                      {dish.category}
                    </span>
                    {dish.dietaryTag && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D70096] text-white shadow-xs">
                        {dish.dietaryTag}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                      dish.active ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'
                    }`}>
                      {dish.active ? 'Actief' : 'Verborgen'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-[#24126E] leading-snug line-clamp-1">
                      {dish.name}
                    </h4>
                    <span className="text-xs font-black text-amber-700 shrink-0 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {dish.price || '€ 4,00'}
                    </span>
                  </div>

                  {dish.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                  )}

                  {/* Live Portie Balans Box */}
                  <div className="p-3 bg-[#F7F5FA] rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Portiecapaciteit:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickAdjustPortions(dish.id, -1)}
                          title="1 portie minder"
                          className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 font-black hover:bg-slate-100 flex items-center justify-center cursor-pointer text-xs"
                        >
                          -
                        </button>
                        <span className="font-black text-[#24126E] px-1 text-sm">{dish.maxDailyPortions || 20}</span>
                        <button
                          onClick={() => handleQuickAdjustPortions(dish.id, 1)}
                          title="1 portie meer"
                          className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 font-black hover:bg-slate-100 flex items-center justify-center cursor-pointer text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500">Besteld: <strong>{ordered}</strong></span>
                      <span className={`font-bold ${isSoldOut ? 'text-red-600' : 'text-emerald-700'}`}>
                        {isSoldOut ? 'Uitverkocht' : `Nog ${remaining} beschikbaar`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Controls */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleActive(dish.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    dish.active
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                  title={dish.active ? 'Verberg van de menukaart' : 'Maak zichtbaar op het weekmenu'}
                >
                  {dish.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{dish.active ? 'Verbergen' : 'Activeren'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(dish)}
                    className="p-1.5 rounded-xl text-slate-600 hover:text-[#24126E] hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-200"
                    title="Gerecht en foto bewerken"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteDish(dish.id, dish.name)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    title="Gerecht definitief verwijderen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
