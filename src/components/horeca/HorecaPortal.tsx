import React, { useState, useMemo } from 'react';
import { Utensils, Clock, Calendar, User, Users, MapPin, Plus, Minus, ShoppingBag, CircleCheck as CheckCircle2, ArrowLeft, Share2, FileDown, Search, CircleAlert as AlertCircle, Flame, Sparkles, ChevronRight, Check, Phone, Mail, Building2, ListFilter as Filter, ChefHat, Layers, RotateCcw, Copy, ExternalLink, Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { 
  ServiceTicket, 
  StudentWorker, 
  SupervisingTeacher, 
  MenuItem, 
  MealOrderItem, 
  TicketStatus 
} from '../../types';
import { 
  calculateRemainingPortions, 
  calculateOrderedPortions, 
  formatDutchDate, 
  formatDutchDateTime 
} from '../../lib/storage';
import { generateTicketReceiptPdf } from '../../utils/ticketReceiptPdf';
import { MenuManagementModal } from '../service/MenuManagementModal';
import { AdminMenuManagementTab } from '../admin/AdminMenuManagementTab';

interface HorecaPortalProps {
  tickets: ServiceTicket[];
  students?: StudentWorker[];
  teachers?: SupervisingTeacher[];
  menuItems: MenuItem[];
  onSaveMenuItems: (items: MenuItem[]) => void;
  onAddTicket: (ticket: Omit<ServiceTicket, 'id' | 'ticketNumber' | 'createdAt' | 'createdAtFormatted'>) => ServiceTicket;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus, notes?: string, assignedTo?: string, assignedStudent?: string, assignedTeacher?: string) => void;
  onArchiveTicket?: (ticketId: string) => void;
  onUnarchiveTicket?: (ticketId: string) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onBackToPortal: () => void;
}

export const HorecaPortal: React.FC<HorecaPortalProps> = ({
  tickets,
  students = [],
  teachers = [],
  menuItems,
  onSaveMenuItems,
  onAddTicket,
  onUpdateTicketStatus,
  onBackToPortal,
}) => {
  // Main Tab: 'order' (customer ordering), 'kitchen' (DV team kitchen & pickup desk), or 'admin' (weekmenu & portion management)
  const [activeTab, setActiveTab] = useState<'order' | 'kitchen' | 'admin'>('order');
  
  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingAdminAction, setPendingAdminAction] = useState<'open_modal' | 'switch_tab'>('switch_tab');

  // Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);

  // Admin access request handler
  const handleRequestAdmin = (action: 'open_modal' | 'switch_tab') => {
    if (isAdminAuthenticated) {
      if (action === 'open_modal') {
        setIsMenuModalOpen(true);
      } else {
        setActiveTab('admin');
      }
    } else {
      setPendingAdminAction(action);
      setPinInput('');
      setPinError('');
      setShowPinModal(true);
    }
  };

  const handleVerifyAdminPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput === '102938') {
      setIsAdminAuthenticated(true);
      setShowPinModal(false);
      setPinError('');
      if (pendingAdminAction === 'open_modal') {
        setIsMenuModalOpen(true);
      } else {
        setActiveTab('admin');
      }
      setPinInput('');
    } else {
      setPinError('Onjuiste pincode. Gebruik standaard pincode 102938.');
    }
  };

  // -------------------------------------------------------------
  // ORDER VIEW STATE (Gasten / Bestelformulier)
  // -------------------------------------------------------------
  const [mealSelections, setMealSelections] = useState<Record<string, number>>({});
  const [requesterName, setRequesterName] = useState('');
  const [requesterTeam, setRequesterTeam] = useState('');
  const [desiredDate, setDesiredDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mealPickupTime, setMealPickupTime] = useState('12:15');
  const [mealDietaryNotes, setMealDietaryNotes] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [createdOrderTicket, setCreatedOrderTicket] = useState<ServiceTicket | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // KITCHEN VIEW STATE (DV Team)
  // -------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today'>('today');

  // Filter only tickets that are Horeca orders
  const horecaTickets = useMemo(() => {
    return tickets.filter(t => t.category === 'horeca' || (t.mealOrderItems && t.mealOrderItems.length > 0));
  }, [tickets]);

  // Today's date string ISO format
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered tickets for the kitchen
  const filteredKitchenTickets = useMemo(() => {
    return horecaTickets.filter(ticket => {
      // Date filter
      if (dateFilter === 'today') {
        const ticketDate = ticket.desiredDate || ticket.createdAt.split('T')[0];
        if (ticketDate !== todayStr) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && ticket.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNum = ticket.ticketNumber.toLowerCase().includes(q);
        const matchesName = ticket.requesterName.toLowerCase().includes(q);
        const matchesTeam = ticket.requesterTeam.toLowerCase().includes(q);
        const matchesDish = ticket.mealOrderItems?.some(item => item.name.toLowerCase().includes(q));
        if (!matchesNum && !matchesName && !matchesTeam && !matchesDish) {
          return false;
        }
      }

      return true;
    });
  }, [horecaTickets, dateFilter, todayStr, statusFilter, searchQuery]);

  // Kitchen Metrics
  const todayOrders = useMemo(() => {
    return horecaTickets.filter(t => {
      const d = t.desiredDate || t.createdAt.split('T')[0];
      return d === todayStr;
    });
  }, [horecaTickets, todayStr]);

  const todayPortionsCount = useMemo(() => {
    return todayOrders.reduce((sum, t) => {
      if (t.totalPortions) return sum + t.totalPortions;
      if (t.mealOrderItems) return sum + t.mealOrderItems.reduce((s, i) => s + i.portions, 0);
      return sum;
    }, 0);
  }, [todayOrders]);

  const openKitchenCount = todayOrders.filter(t => t.status === 'open').length;
  const inPrepKitchenCount = todayOrders.filter(t => t.status === 'in_behandeling').length;
  const completedKitchenCount = todayOrders.filter(t => t.status === 'afgerond').length;

  // Active dishes on the menu
  const activeDishes = useMemo(() => {
    return menuItems.filter(m => m.active);
  }, [menuItems]);

  const filteredDishes = useMemo(() => {
    if (categoryFilter === 'all') return activeDishes;
    return activeDishes.filter(d => d.category === categoryFilter);
  }, [activeDishes, categoryFilter]);

  // Calculate total portions selected in checkout cart
  const totalPortionsSelected = useMemo(() => {
    return (Object.values(mealSelections) as number[]).reduce((sum, count) => sum + (count || 0), 0);
  }, [mealSelections]);

  const handleUpdatePortion = (dishId: string, delta: number) => {
    setMealSelections(prev => {
      const current = prev[dishId] || 0;
      const nextVal = Math.max(0, current + delta);
      const targetDish = menuItems.find(d => d.id === dishId);
      if (!targetDish) return prev;

      const remaining = calculateRemainingPortions(targetDish, tickets);
      if (delta > 0 && nextVal > remaining) {
        return prev;
      }

      if (nextVal === 0) {
        const copy = { ...prev };
        delete copy[dishId];
        return copy;
      }
      return { ...prev, [dishId]: nextVal };
    });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    if (totalPortionsSelected <= 0) {
      setOrderError('Selecteer minimaal 1 portie van een gerecht om te bestellen.');
      return;
    }
    if (!requesterName.trim() || !requesterTeam.trim()) {
      setOrderError('Vul alstublieft uw naam en afdeling/team in.');
      return;
    }

    // Prepare order items
    const orderItems: MealOrderItem[] = [];
    for (const [dishId, rawPortions] of Object.entries(mealSelections)) {
      const portions = Number(rawPortions) || 0;
      if (portions > 0) {
        const dish = menuItems.find(d => d.id === dishId);
        if (dish) {
          orderItems.push({
            menuItemId: dish.id,
            name: dish.name,
            portions,
            price: dish.price,
            category: dish.category
          });
        }
      }
    }

    const dishSummary = orderItems.map(i => `${i.portions}x ${i.name}`).join(', ');
    const title = `Horeca Bestelling: ${dishSummary}`;
    const description = `Maaltijdbestelling geplaatst voor afhalen om ${mealPickupTime} aan de DV Balie.\nBestelde gerechten: ${dishSummary}\nDieetwensen: ${mealDietaryNotes.trim() || 'Geen'}`;

    const newTicket = onAddTicket({
      title,
      description,
      category: 'horeca',
      priority: 'gemiddeld',
      location: 'Summa Plus DV Balie (Blécourtstraat)',
      requesterName: requesterName.trim(),
      requesterTeam: requesterTeam.trim(),
      desiredDate,
      status: 'open',
      mealOrderItems: orderItems,
      mealPickupTime,
      mealDietaryNotes: mealDietaryNotes.trim() || undefined,
      totalPortions: totalPortionsSelected
    });

    setCreatedOrderTicket(newTicket);
    // Reset order inputs
    setMealSelections({});
    setMealDietaryNotes('');
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?module=horeca`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={onBackToPortal}
              className="text-xs font-bold text-slate-500 hover:text-[#24126E] flex items-center gap-1 transition-colors cursor-pointer mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Portaal</span>
            </button>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
              <ChefHat className="w-3 h-3 text-amber-700" />
              <span>Dienstverlening (DV) Horeca</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#24126E] tracking-tight flex items-center gap-2.5">
            <Utensils className="w-7 h-7 text-amber-600" />
            <span>Horeca & Catering</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Wekelijks vers menu door onze studenten Dienstverlening. Bestel vooraf maaltijden en haal ze stipt af aan de DV Balie.
          </p>
        </div>

        {/* Top Actions & Perspective Switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Main Perspective Switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold shadow-xs">
            <button
              onClick={() => setActiveTab('order')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'order'
                  ? 'bg-white text-[#24126E] shadow-sm'
                  : 'text-slate-600 hover:text-[#24126E]'
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span>Menukaart & Bestellen</span>
            </button>

            <button
              onClick={() => setActiveTab('kitchen')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === 'kitchen'
                  ? 'bg-[#24126E] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#24126E]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5 text-amber-400" />
              <span>Keuken & Uitgifte</span>
              {openKitchenCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => handleRequestAdmin('switch_tab')}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-sm'
                  : 'text-slate-600 hover:text-[#24126E]'
              }`}
              title="Weekmenu en porties beheren (Beveiligd met beheerderscode)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Weekmenu Beheer (Admin)</span>
            </button>
          </div>

          {/* Snel beheer of Admin indicator */}
          {isAdminAuthenticated ? (
            <div className="flex items-center gap-1.5 bg-amber-50 p-1 rounded-2xl border border-amber-200">
              <button
                onClick={() => setIsMenuModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-200 text-amber-950 flex items-center gap-1.5 hover:bg-amber-300 transition-all cursor-pointer"
                title="Open Weekmenu & Portiebeheer Modal"
              >
                <ChefHat className="w-3.5 h-3.5 text-amber-800" />
                <span className="hidden sm:inline">Portiebeheer Modal</span>
                <span className="sm:hidden">Modal</span>
              </button>
              <div className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 rounded-lg">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                <span>Admin</span>
              </div>
              <button
                onClick={() => {
                  setIsAdminAuthenticated(false);
                  if (activeTab === 'admin') setActiveTab('order');
                }}
                title="Beheerderssessie vergrendelen / uitloggen"
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleRequestAdmin('open_modal')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200/90 text-amber-950 border border-amber-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Beheer het weekmenu, foto's en de portiecapaciteit van de keuken (Beveiligd voor beheerders)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Weekmenu & Porties (Admin)</span>
              <span className="sm:hidden">Menu (Admin)</span>
            </button>
          )}

          {/* Deel link knop */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-[#24126E] border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Deel directe bestellink met collega's"
          >
            <Share2 className="w-3.5 h-3.5 text-[#D70096]" />
            <span className="hidden sm:inline">Deel Link</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PERSPECTIVE 1: MENUKAART & BESTELLEN (VOOR GASTEN / COLLEGA'S) */}
      {/* ========================================================================= */}
      {activeTab === 'order' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Linkerkolom: Het Menu */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Dag/Week Informatiebalk */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-3xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Vers Weekmenu van de Dag
                  </h3>
                  <p className="text-xs text-slate-600">
                    Gerechten worden dagelijks vers bereid. Afhalen mogelijk aan de DV Balie (Blécourtstraat).
                  </p>
                </div>
              </div>

              {/* Live beschikbare categorie-filter */}
              <div className="flex flex-wrap items-center gap-1.5 self-stretch sm:self-auto">
                {['all', 'hoofdgerecht', 'soep', 'broodje', 'dessert'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    {cat === 'all' ? 'Alles' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            {filteredDishes.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <Utensils className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">Geen actieve gerechten in deze categorie</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Het DV team heeft momenteel geen gerechten in deze categorie geactiveerd. Bekijk alle gerechten of beheer het menu.
                </p>
                <button
                  onClick={() => handleRequestAdmin('open_modal')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 mx-auto"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Weekmenu Aanvullen (Admin)</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {filteredDishes.map((dish) => {
                  const remaining = calculateRemainingPortions(dish, tickets);
                  const isSoldOut = remaining <= 0;
                  const currentSelected = mealSelections[dish.id] || 0;

                  return (
                    <div
                      key={dish.id}
                      className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                        currentSelected > 0 
                          ? 'border-amber-400 ring-2 ring-amber-400/20' 
                          : isSoldOut 
                          ? 'border-slate-200 opacity-75' 
                          : 'border-slate-200/90 hover:border-amber-300'
                      }`}
                    >
                      {/* Dish Photo */}
                      {dish.imageUrl ? (
                        <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${
                              isSoldOut ? 'grayscale contrast-75' : ''
                            }`}
                          />
                          <div className="absolute top-3 left-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/95 text-[#24126E] shadow-sm backdrop-blur-xs">
                              {dish.category}
                            </span>
                          </div>

                          <div className="absolute top-3 right-3">
                            {isSoldOut ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-sm animate-pulse">
                                Uitverkocht
                              </span>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider shadow-sm ${
                                remaining <= 3 
                                  ? 'bg-amber-500 text-white animate-bounce' 
                                  : 'bg-emerald-600 text-white'
                              }`}>
                                Nog {remaining} porties
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 pb-0 flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-[#24126E]">
                            {dish.category}
                          </span>
                          {isSoldOut ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700">
                              Uitverkocht
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider bg-emerald-100 text-emerald-800">
                              Nog {remaining} porties
                            </span>
                          )}
                        </div>
                      )}

                      {/* Dish Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="text-base font-bold text-slate-900 leading-snug">
                              {dish.name}
                            </h4>
                            {dish.price && (
                              <span className="text-sm font-black text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-lg shrink-0">
                                {dish.price}
                              </span>
                            )}
                          </div>

                          {dish.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                              {dish.description}
                            </p>
                          )}

                          {/* Dietary Tags */}
                          {dish.dietaryInfo && dish.dietaryInfo.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {dish.dietaryInfo.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Controls Bottom */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-500">
                            Aantal porties:
                          </span>

                          {isSoldOut ? (
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-xl">
                              Geen voorraad meer
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdatePortion(dish.id, -1)}
                                disabled={currentSelected <= 0}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                  currentSelected > 0
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <span className="w-8 text-center text-sm font-black text-slate-900">
                                {currentSelected}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleUpdatePortion(dish.id, 1)}
                                disabled={currentSelected >= remaining}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                  currentSelected < remaining
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rechterkolom: Winkelmand & Bestelformulier */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-4">
            <form
              onSubmit={handlePlaceOrder}
              className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Uw Maaltijdbestelling
                  </h3>
                </div>
                <span className="text-xs font-black bg-amber-500 text-white px-2.5 py-0.5 rounded-full">
                  {totalPortionsSelected} {totalPortionsSelected === 1 ? 'portie' : 'porties'}
                </span>
              </div>

              {/* Selected Dishes Overview */}
              {totalPortionsSelected === 0 ? (
                <div className="p-5 rounded-2xl bg-[#F7F5FA] border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  <Utensils className="w-5 h-5 mx-auto mb-1.5 text-slate-400" />
                  <p className="font-semibold text-slate-700">Uw mandje is nog leeg</p>
                  <p className="text-[11px] mt-0.5">Kies één of meer gerechten uit de menukaart hiernaast.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {Object.entries(mealSelections).map(([dishId, rawPortions]) => {
                    const portions = Number(rawPortions) || 0;
                    if (portions <= 0) return null;
                    const dish = menuItems.find(d => d.id === dishId);
                    if (!dish) return null;

                    return (
                      <div
                        key={dishId}
                        className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {portions}x
                          </span>
                          <span className="font-bold text-slate-900 truncate">
                            {dish.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {dish.price && (
                            <span className="font-bold text-amber-950">
                              {dish.price}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdatePortion(dish.id, -portions)}
                            className="text-slate-400 hover:text-red-600 cursor-pointer p-1"
                            title="Verwijderen"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bestelgegevens Velden */}
              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Uw Naam *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="bijv. Marleen Jansen"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Team of Opleiding *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      list="horeca-team-suggestions"
                      placeholder="Entree, VIA, VOAT, OOP"
                      value={requesterTeam}
                      onChange={(e) => setRequesterTeam(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                    />
                    <datalist id="horeca-team-suggestions">
                      <option value="Entree" />
                      <option value="VIA" />
                      <option value="VOAT" />
                      <option value="OOP" />
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Afhaaldatum *
                    </label>
                    <input
                      type="date"
                      required
                      value={desiredDate}
                      onChange={(e) => setDesiredDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Afhaaltijd Balie *
                    </label>
                    <select
                      value={mealPickupTime}
                      onChange={(e) => setMealPickupTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                    >
                      <option value="11:45">11:45 uur</option>
                      <option value="12:00">12:00 uur</option>
                      <option value="12:15">12:15 uur</option>
                      <option value="12:30">12:30 uur</option>
                      <option value="12:45">12:45 uur</option>
                      <option value="13:00">13:00 uur</option>
                      <option value="13:15">13:15 uur</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dieetwensen of Allergieën
                  </label>
                  <textarea
                    rows={2}
                    placeholder="bijv. glutenvrij, zonder noten, extra bestek..."
                    value={mealDietaryNotes}
                    onChange={(e) => setMealDietaryNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden resize-none"
                  />
                </div>
              </div>

              {orderError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={totalPortionsSelected <= 0}
                className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  totalPortionsSelected > 0
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 hover:scale-[1.01]'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Bestelling Plaatsen ({totalPortionsSelected} porties)</span>
              </button>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 text-[11px] text-amber-950 flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>Afhalen bij de <strong>Summa Plus DV Balie</strong> aan de Blécourtstraat op het gekozen tijdstip.</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSPECTIVE 2: KEUKEN & BALIE UITGIFTE (DV TEAM DASHBOARD) */}
      {/* ========================================================================= */}
      {activeTab === 'kitchen' && (
        <div className="space-y-6">
          {/* Top Live Counters for Kitchen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Totaal Bestellingen Vandaag
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#24126E]">
                  {todayOrders.length}
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  {todayPortionsCount} porties
                </span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block mb-1">
                Open / Te Bereiden
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-amber-600">
                  {openKitchenCount}
                </span>
                <span className="text-[10px] font-bold text-slate-500">Wachtrij</span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 block mb-1">
                In Behandeling
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#24126E]">
                  {inPrepKitchenCount}
                </span>
                <span className="text-[10px] font-bold text-indigo-600">In de keuken</span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block mb-1">
                Afgerond / Uitgegeven
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                  {completedKitchenCount}
                </span>
                <span className="text-[10px] font-bold text-emerald-600">Klaar</span>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dateFilter === 'today'
                      ? 'bg-white text-[#24126E] shadow-xs'
                      : 'text-slate-600 hover:text-[#24126E]'
                  }`}
                >
                  📅 Vandaag ({todayOrders.length})
                </button>
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    dateFilter === 'all'
                      ? 'bg-white text-[#24126E] shadow-xs'
                      : 'text-slate-600 hover:text-[#24126E]'
                  }`}
                >
                  Alle Datums ({horecaTickets.length})
                </button>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
              >
                <option value="all">Alle Statussen</option>
                <option value="open">Openstaand</option>
                <option value="in_behandeling">In Bereiding</option>
                <option value="afgerond">Afgerond / Afgehaald</option>
              </select>
            </div>

            {/* Search Bar */}
            <div className="relative min-w-[240px] max-w-sm w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Zoek op naam, gerecht, team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
            </div>
          </div>

          {/* Kitchen Tickets Grid */}
          {filteredKitchenTickets.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
              <ChefHat className="w-8 h-8 mx-auto text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800">Geen horecabestellingen gevonden</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Er zijn geen maaltijdbestellingen die overeenkomen met de geselecteerde filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredKitchenTickets.map((ticket) => {
                const totalPortions = ticket.totalPortions || ticket.mealOrderItems?.reduce((s, i) => s + i.portions, 0) || 0;

                return (
                  <div
                    key={ticket.id}
                    className={`bg-white rounded-3xl border transition-all duration-200 p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                      ticket.status === 'afgerond'
                        ? 'border-slate-200 opacity-80'
                        : ticket.status === 'in_behandeling'
                        ? 'border-indigo-300 ring-2 ring-indigo-100'
                        : 'border-amber-300 ring-2 ring-amber-100/60'
                    }`}
                  >
                    <div>
                      {/* Top Header of Slip */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#24126E] bg-indigo-50 px-2 py-0.5 rounded-md">
                            {ticket.ticketNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {ticket.createdAtFormatted.split(' ')[0]}
                          </span>
                        </div>

                        {/* Afhaaltijdstip Highlight */}
                        <div className="flex items-center gap-1 bg-amber-100 text-amber-950 font-black px-2.5 py-1 rounded-xl text-xs border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>{ticket.mealPickupTime || '12:15'}</span>
                        </div>
                      </div>

                      {/* Requester Info */}
                      <div className="mb-3">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {ticket.requesterName}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ticket.requesterTeam}</span>
                        </p>
                      </div>

                      {/* Dishes List */}
                      <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200/80 mb-3 space-y-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block mb-1">
                          Te Bereiden ({totalPortions} {totalPortions === 1 ? 'portie' : 'porties'}):
                        </span>
                        {ticket.mealOrderItems && ticket.mealOrderItems.length > 0 ? (
                          ticket.mealOrderItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-xl border border-amber-200">
                              <div className="flex items-center gap-2 font-bold text-slate-800">
                                <span className="w-5 h-5 rounded-md bg-amber-500 text-white font-black text-[11px] flex items-center justify-center">
                                  {item.portions}x
                                </span>
                                <span>{item.name}</span>
                              </div>
                              {item.price && <span className="text-[11px] font-bold text-amber-900">{item.price}</span>}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-600 italic">
                            {ticket.description}
                          </p>
                        )}
                      </div>

                      {/* Dietary / Allergies Alert */}
                      {ticket.mealDietaryNotes && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-3 text-xs text-red-800">
                          <span className="font-bold block text-[10px] uppercase tracking-wider text-red-900 mb-0.5">
                            ⚠️ Dieetwensen / Allergie:
                          </span>
                          <span>{ticket.mealDietaryNotes}</span>
                        </div>
                      )}

                      {/* Assigned Student Worker */}
                      {ticket.assignedStudent && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 mb-3 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#24126E]" />
                          <span>Toegewezen aan: <strong>{ticket.assignedStudent}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Workflow Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        {ticket.status === 'open' && (
                          <button
                            onClick={() => onUpdateTicketStatus(ticket.id, 'in_behandeling')}
                            className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>In Bereiding Nemen</span>
                          </button>
                        )}

                        {ticket.status === 'in_behandeling' && (
                          <button
                            onClick={() => onUpdateTicketStatus(ticket.id, 'afgerond')}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Markeer als Afgehaald</span>
                          </button>
                        )}

                        {ticket.status === 'afgerond' && (
                          <div className="flex-1 flex flex-wrap items-center gap-2">
                            <span className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center border border-emerald-200 flex items-center justify-center gap-1 min-w-[120px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Afgehaald</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateTicketStatus(ticket.id, 'in_behandeling')}
                              className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 hover:border-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              title="Zet ticket terug naar 'In behandeling'"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                              <span>Terug naar &apos;In behandeling&apos;</span>
                            </button>
                          </div>
                        )}

                        {/* PDF Receipt Print Button */}
                        <button
                          onClick={() => generateTicketReceiptPdf(ticket)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                          title="Download Afhaalbon (PDF)"
                        >
                          <FileDown className="w-4 h-4 text-[#D70096]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PERSPECTIVE 3: ADMIN & WEEKMENU BEHEER (BEVEILIGD) */}
      {/* ========================================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-100 px-3 py-1 rounded-full mb-2 border border-amber-200 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                Horeca & Catering &bull; Beheerderskant
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#24126E] tracking-tight">
                Weekmenu, Prijzen & Portiecapaciteit Beheren
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Beheer de actieve gerechten, foto&apos;s, prijzen en de maximale dagelijkse bereidingscapaciteit van het keukenteam.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMenuModalOpen(true)}
                className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold rounded-xl border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ChefHat className="w-4 h-4 text-amber-700" />
                <span>Modal Weergave Openen</span>
              </button>
            </div>
          </div>

          <AdminMenuManagementTab
            menuItems={menuItems}
            onSaveMenuItems={onSaveMenuItems}
            tickets={tickets}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* ORDER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {createdOrderTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#D70096] block mb-1">
                Bestelling Succesvol Ontvangen
              </span>
              <h3 className="text-2xl font-black text-[#24126E] tracking-tight">
                Smakelijk eten!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Uw bestelling is geregistreerd onder ticketnummer <strong>{createdOrderTicket.ticketNumber}</strong> en doorgestuurd naar de DV keuken.
              </p>
            </div>

            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-amber-950 font-bold">
                <span>📍 Afhaallocatie:</span>
                <span>Summa Plus DV Balie (Blécourtstraat)</span>
              </div>
              <div className="flex justify-between items-center text-amber-950 font-bold">
                <span>⏰ Gewenst afhaaltijdstip:</span>
                <span className="bg-amber-200 px-2 py-0.5 rounded text-amber-950">{createdOrderTicket.mealPickupTime || '12:15 uur'}</span>
              </div>
              <div className="flex justify-between items-center text-amber-950 font-bold">
                <span>🍽️ Aantal gerechten:</span>
                <span>{createdOrderTicket.totalPortions} {createdOrderTicket.totalPortions === 1 ? 'portie' : 'porties'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => generateTicketReceiptPdf(createdOrderTicket)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#24126E] hover:bg-[#1a0c52] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-[#D70096]" />
                <span>Download Afhaalbon (PDF)</span>
              </button>

              <button
                onClick={() => setCreatedOrderTicket(null)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MENU MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      <MenuManagementModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        menuItems={menuItems}
        tickets={tickets}
        onSaveMenuItems={onSaveMenuItems}
      />

      {/* ========================================================================= */}
      {/* SHARE LINK MODAL */}
      {/* ========================================================================= */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Deel Menukaart & Bestellink
                </h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Deel deze directe link met collega&apos;s binnen het Summa College om rechtstreeks maaltijden te reserveren:
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-700 truncate">
                {window.location.origin}{window.location.pathname}?module=horeca
              </span>
              <button
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 rounded-xl bg-[#24126E] text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer hover:bg-[#1b0d56] transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Gekopieerd!' : 'Kopiëren'}</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADMIN PIN VERIFICATION MODAL */}
      {/* ========================================================================= */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-pink-50 text-[#D70096] rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#24126E]">
                Beheerder Toegang (Admin)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Voer de 6-cijferige beheerderscode in om toegang te krijgen tot het weekmenu en de porties.
              </p>
            </div>

            <form onSubmit={handleVerifyAdminPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  placeholder="••••••"
                  className="w-full py-3 text-center tracking-[0.6em] text-2xl font-bold bg-[#F7F5FA] border-2 border-slate-200 rounded-2xl text-[#24126E] focus:outline-none focus:border-[#D70096] transition-all"
                />
                {pinError && (
                  <p className="text-xs text-red-600 font-bold mt-2 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              {/* Quick Digit Pad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => {
                      if (btn === 'C') {
                        setPinInput('');
                        setPinError('');
                      } else if (btn === '✓') {
                        if (pinInput === '102938') {
                          setIsAdminAuthenticated(true);
                          setShowPinModal(false);
                          if (pendingAdminAction === 'open_modal') {
                            setIsMenuModalOpen(true);
                          } else {
                            setActiveTab('admin');
                          }
                          setPinInput('');
                          setPinError('');
                        } else {
                          setPinError('Onjuiste pincode. Gebruik standaard pincode 102938.');
                        }
                      } else if (pinInput.length < 6) {
                        const next = pinInput + btn;
                        setPinInput(next);
                        setPinError('');
                        if (next.length === 6) {
                          if (next === '102938') {
                            setIsAdminAuthenticated(true);
                            setShowPinModal(false);
                            if (pendingAdminAction === 'open_modal') {
                              setIsMenuModalOpen(true);
                            } else {
                              setActiveTab('admin');
                            }
                            setPinInput('');
                            setPinError('');
                          } else {
                            setPinError('Onjuiste pincode. Gebruik standaard pincode 102938.');
                          }
                        }
                      }
                    }}
                    className={`py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                      btn === '✓'
                        ? 'bg-[#24126E] text-white hover:bg-[#1b0d56]'
                        : btn === 'C'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-[#F7F5FA] hover:bg-indigo-50 text-[#24126E] border border-slate-100'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Standaard pincode: <strong>102938</strong></span>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
