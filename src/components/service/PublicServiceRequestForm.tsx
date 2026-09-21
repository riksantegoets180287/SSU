import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, 
  Send, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  User, 
  Building2, 
  Tv, 
  Armchair, 
  Sparkles, 
  Tag, 
  Clock, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  HelpCircle, 
  ChevronRight, 
  Phone, 
  Mail, 
  AlertCircle, 
  Camera, 
  Image as ImageIcon, 
  X, 
  UploadCloud,
  FileDown,
  Coffee,
  Users,
  Layers,
  FileText,
  Utensils,
  Plus,
  Minus,
  ShoppingBag,
  Flame
} from 'lucide-react';
import { ServiceTicket, TicketCategory, TicketPriority, MenuItem, MealOrderItem } from '../../types';
import { compressImageFile } from '../../lib/barcode';
import { generateTicketReceiptPdf } from '../../utils/ticketReceiptPdf';
import { getStoredMenuItems, getStoredTickets, calculateRemainingPortions } from '../../lib/storage';

interface PublicServiceRequestFormProps {
  onAddTicket: (ticket: Omit<ServiceTicket, 'id' | 'ticketNumber' | 'createdAt' | 'createdAtFormatted'>) => ServiceTicket;
  onGoToInternalSystem?: () => void;
  menuItems?: MenuItem[];
  tickets?: ServiceTicket[];
}

type FormMode = 'standard' | 'meeting_room' | 'meal_order';

const ROOM_LAYOUT_PRESETS = [
  'U-vorm',
  'Kring / Cirkel',
  'Blokopstelling',
  'Schoolopstelling',
  'Examen / Rijen',
  'Theater / Bioscoop',
  'Anders (zie bijzonderheden)'
];

const PICKUP_TIME_PRESETS = [
  '11:45',
  '12:00',
  '12:15',
  '12:30',
  '12:45',
  '13:00'
];

export const PublicServiceRequestForm: React.FC<PublicServiceRequestFormProps> = ({
  onAddTicket,
  onGoToInternalSystem,
  menuItems: propMenuItems,
  tickets: propTickets,
}) => {
  const [formMode, setFormMode] = useState<FormMode>('standard');

  // Standard Form State
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normaal');
  const [roomLocation, setRoomLocation] = useState('');
  const [description, setDescription] = useState('');
  const [requesterFirstName, setRequesterFirstName] = useState('');
  const [requesterTeam, setRequesterTeam] = useState('');
  const [desiredDate, setDesiredDate] = useState('');
  const [desiredTime, setDesiredTime] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Meeting Room Quick Form State
  const [meetingRequesterName, setMeetingRequesterName] = useState('');
  const [meetingRequesterTeam, setMeetingRequesterTeam] = useState('');
  const [meetingRoom, setMeetingRoom] = useState('');
  const [meetingLayout, setMeetingLayout] = useState('U-vorm');
  const [meetingCustomLayout, setMeetingCustomLayout] = useState('');
  const [meetingCoffeeTea, setMeetingCoffeeTea] = useState<boolean>(true);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [meetingNotes, setMeetingNotes] = useState('');

  // Horeca / Meal Order State
  const [mealSelections, setMealSelections] = useState<Record<string, number>>({});
  const [mealRequesterName, setMealRequesterName] = useState('');
  const [mealRequesterTeam, setMealRequesterTeam] = useState('');
  const [mealDate, setMealDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [mealTime, setMealTime] = useState('12:15');
  const [mealNotes, setMealNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Success state
  const [createdTicket, setCreatedTicket] = useState<ServiceTicket | null>(null);

  // Available dishes & current tickets for quota calculation
  const dishes = propMenuItems && propMenuItems.length > 0 ? propMenuItems : getStoredMenuItems();
  const currentTickets = propTickets && propTickets.length > 0 ? propTickets : getStoredTickets();

  // URL search parameter detection on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (
        search.includes('form=horeca') || 
        search.includes('form=maaltijd') || 
        search.includes('mode=horeca') || 
        search.includes('mode=maaltijd') || 
        search.includes('view=horeca') || 
        hash.includes('horeca') || 
        hash.includes('maaltijd')
      ) {
        setFormMode('meal_order');
      } else if (
        search.includes('form=vergadering') || 
        search.includes('mode=vergadering') || 
        search.includes('meeting') || 
        hash.includes('vergadering')
      ) {
        setFormMode('meeting_room');
      }
    }
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const newPhotoUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const compressed = await compressImageFile(file, 900, 900, 0.75);
          newPhotoUrls.push(compressed);
        }
      }
      setPhotos(prev => [...prev, ...newPhotoUrls].slice(0, 4)); // max 4 photos
    } catch {
      // Fallback
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Standard Form Submit
  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Vul een korte titel of omschrijving in';
    if (!roomLocation.trim()) newErrors.location = 'Vul het lokaal of de ruimte in';
    if (!description.trim()) newErrors.description = 'Geef een toelichting op het probleem of de taak';
    if (!requesterFirstName.trim()) newErrors.name = 'Vul jouw voornaam in';
    if (!requesterTeam.trim()) newErrors.team = 'Vul jouw team of opleiding in';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formattedDesiredDateTime = desiredDate.trim()
      ? (desiredTime.trim() ? `${desiredDate.trim()} om ${desiredTime.trim()} uur` : desiredDate.trim())
      : (desiredTime.trim() ? `Om ${desiredTime.trim()} uur` : undefined);

    const ticket = onAddTicket({
      title: title.trim(),
      description: description.trim(),
      priority,
      location: roomLocation.trim(),
      requesterName: requesterFirstName.trim(),
      requesterTeam: requesterTeam.trim(),
      desiredDate: formattedDesiredDateTime,
      photos: photos.length > 0 ? photos : undefined,
      status: 'open',
    });

    setCreatedTicket(ticket);
    setTitle('');
    setDescription('');
    setRoomLocation('');
    setDesiredDate('');
    setDesiredTime('');
    setPhotos([]);
    setErrors({});
  };

  // Meeting Room Submit
  const handleMeetingRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!meetingRequesterName.trim()) newErrors.meetingName = 'Vul de naam van de aanvrager in';
    if (!meetingRoom.trim()) newErrors.meetingRoom = 'Vul het lokaal of de vergaderruimte in';
    if (!meetingDate.trim()) newErrors.meetingDate = 'Selecteer een gewenste datum';
    if (!meetingTime.trim()) newErrors.meetingTime = 'Vul de aanvangstijd in';

    const selectedLayout = meetingLayout === 'Anders (zie bijzonderheden)' && meetingCustomLayout.trim()
      ? meetingCustomLayout.trim()
      : meetingLayout;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formattedDescription = [
      `📋 TAAK: Vergaderruimte klaarzetten`,
      `📍 Lokaal / Ruimte: ${meetingRoom.trim()}`,
      `📐 Gewenste Opstelling: ${selectedLayout}`,
      `☕ Koffie & Thee: ${meetingCoffeeTea ? 'JA, graag klaarzetten met kannen/bekers' : 'NEE, niet nodig'}`,
      `🗓 Datum & Tijd: ${meetingDate.trim()} om ${meetingTime.trim()} uur`,
      meetingNotes.trim() ? `📝 Bijzonderheden / Wensen:\n${meetingNotes.trim()}` : '📝 Bijzonderheden: Geen'
    ].join('\n\n');

    const ticket = onAddTicket({
      title: `Vergaderruimte klaarzetten: ${meetingRoom.trim()} (${selectedLayout})`,
      description: formattedDescription,
      priority: 'normaal',
      location: meetingRoom.trim(),
      requesterName: meetingRequesterName.trim(),
      requesterTeam: meetingRequesterTeam.trim() || 'Vergadering / Overleg',
      desiredDate: `${meetingDate.trim()} om ${meetingTime.trim()} uur`,
      status: 'open',
    });

    setCreatedTicket(ticket);
    setMeetingRequesterName('');
    setMeetingRequesterTeam('');
    setMeetingRoom('');
    setMeetingLayout('U-vorm');
    setMeetingCustomLayout('');
    setMeetingCoffeeTea(true);
    setMeetingDate('');
    setMeetingTime('09:00');
    setMeetingNotes('');
    setErrors({});
  };

  // Portion Change handler
  const handlePortionChange = (dish: MenuItem, delta: number) => {
    const current = mealSelections[dish.id] || 0;
    const remaining = calculateRemainingPortions(dish, currentTickets);
    const next = Math.max(0, Math.min(remaining, current + delta));

    setMealSelections(prev => {
      const copy = { ...prev };
      if (next === 0) {
        delete copy[dish.id];
      } else {
        copy[dish.id] = next;
      }
      return copy;
    });

    if (errors.portions) {
      setErrors(prev => ({ ...prev, portions: '' }));
    }
  };

  // Total portions and selected items
  const activeDishes = dishes.filter(d => d.active);
  const totalPortionsSelected = (Object.values(mealSelections) as number[]).reduce((sum: number, q: number) => sum + q, 0);

  // Meal Order Submit
  const handleMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (totalPortionsSelected === 0) {
      newErrors.portions = 'Selecteer minimaal 1 portie van een gerecht om te bestellen.';
    }
    if (!mealRequesterName.trim()) {
      newErrors.mealName = 'Vul jouw voornaam in voor het afhalen.';
    }
    if (!mealRequesterTeam.trim()) {
      newErrors.mealTeam = 'Vul jouw team of opleiding in.';
    }
    if (!mealDate.trim()) {
      newErrors.mealDate = 'Kies de gewenste afhaaldag.';
    }
    if (!mealTime.trim()) {
      newErrors.mealTime = 'Kies het gewenste afhaaltijdstip aan de balie.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build ordered items
    const orderItems: MealOrderItem[] = [];
    activeDishes.forEach(dish => {
      const qty = mealSelections[dish.id] || 0;
      if (qty > 0) {
        orderItems.push({
          menuItemId: dish.id,
          name: dish.name,
          portions: qty,
          price: dish.price,
        });
      }
    });

    const summaryText = orderItems.map(item => `${item.portions}x ${item.name}`).join(', ');
    const formattedDesc = [
      `🍽️ HORECA BESTELLING (AFHALEN BIJ DV BALIE)`,
      `👥 Besteld voor: ${mealRequesterName.trim()} (${mealRequesterTeam.trim()})`,
      `📦 Totaal aantal porties: ${totalPortionsSelected} portie(s)`,
      `\n📋 Bestelde gerechten:`,
      ...orderItems.map(item => `  • ${item.portions}x ${item.name} (${item.price || 'Prijs op rekening'})`),
      `\n⏰ Afhaaltijdstip: ${mealDate} om ${mealTime} uur`,
      `📍 Afhaallocatie: Summa Plus Balie (Blécourtstraat)`,
      mealNotes.trim() ? `\n📝 Dieetwensen / Opmerkingen:\n${mealNotes.trim()}` : '\n📝 Geen dieetwensen opgegeven'
    ].join('\n');

    const ticket = onAddTicket({
      title: `🍽️ Horeca (${totalPortionsSelected}x): ${summaryText}`,
      description: formattedDesc,
      category: 'horeca',
      priority: 'normaal',
      location: 'Summa Plus Balie (Blécourtstraat)',
      requesterName: mealRequesterName.trim(),
      requesterTeam: mealRequesterTeam.trim(),
      desiredDate: `${mealDate} om ${mealTime} uur`,
      status: 'open',
      mealOrderItems: orderItems,
      mealPickupTime: `${mealTime} uur`,
      mealDietaryNotes: mealNotes.trim() || undefined,
      totalPortions: totalPortionsSelected,
    });

    setCreatedTicket(ticket);
    // Reset state
    setMealSelections({});
    setMealRequesterName('');
    setMealRequesterTeam('');
    setMealNotes('');
    setErrors({});
  };

  const handleResetForNewTicket = () => {
    setCreatedTicket(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F5FA] flex flex-col selection:bg-[#D70096] selection:text-white">
      {/* Top Standalone Header */}
      <header className="h-16 bg-[#24126E] text-white flex items-center justify-between px-4 sm:px-8 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D70096] rounded-lg flex items-center justify-center font-bold text-base text-white shadow-sm">
            S
          </div>
          <div>
            <span className="text-lg font-semibold tracking-tight text-white block leading-none">
              Summa Plus
            </span>
            <span className="text-[10px] text-white/70 font-medium tracking-wider uppercase">
              Service Aanvraagportaal &bull; Blécourtstraat
            </span>
          </div>
        </div>

        {onGoToInternalSystem && (
          <button
            onClick={onGoToInternalSystem}
            className="text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl transition-colors border border-white/10 flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#D70096]" />
            <span>Naar Behandelaars Systeem</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        {createdTicket ? (
          /* ================= SUCCESS CONFIRMATION CARD ================= */
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-xs text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3.5 py-1 rounded-full mb-3">
              <Check className="w-3.5 h-3.5" />
              <span>
                {createdTicket.category === 'horeca' 
                  ? 'Horeca bestelling succesvol geplaatst' 
                  : 'Aanvraag succesvol ontvangen'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#24126E] mb-2 tracking-tight">
              Bedankt, {createdTicket.requesterName}!
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
              {createdTicket.category === 'horeca' ? (
                <>
                  Jouw maaltijdbestelling staat nu direct in de keuken van het Dienstverlening (DV) team.
                  We zorgen dat je maaltijd vers bereid voor je klaarstaat bij de balie.
                </>
              ) : (
                <>
                  Jouw aanvraag is direct doorgestuurd naar het serviceteam van Summa Plus aan de Blécourtstraat. We gaan er zo snel mogelijk mee aan de slag.
                </>
              )}
            </p>

            {/* Ticket Card Details */}
            <div className="bg-[#F7F5FA] rounded-2xl p-5 sm:p-6 border border-slate-200/80 text-left max-w-md mx-auto mb-8 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <span className="text-xs text-slate-400 font-bold uppercase">Bestel / Ticketnummer</span>
                <span className="font-mono font-black text-sm text-[#24126E] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {createdTicket.ticketNumber}
                </span>
              </div>

              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Onderwerp:</span>
                  <span className="font-bold text-[#24126E] text-right truncate max-w-[240px]">{createdTicket.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Afhaallocatie:</span>
                  <span className="font-semibold text-slate-800">{createdTicket.location}</span>
                </div>
                {createdTicket.desiredDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Afhaaldatum / tijd:</span>
                    <span className="font-bold text-[#D70096]">{createdTicket.desiredDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Aanvrager / Afhaler:</span>
                  <span className="font-medium text-slate-700">{createdTicket.requesterName} ({createdTicket.requesterTeam})</span>
                </div>

                {/* Horeca Itemized Breakdown */}
                {createdTicket.mealOrderItems && createdTicket.mealOrderItems.length > 0 && (
                  <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 mt-2 space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                      🍽️ Bestelde gerechten:
                    </span>
                    {createdTicket.mealOrderItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-amber-950">
                        <span className="font-bold">{item.portions}x {item.name}</span>
                        {item.price && <span className="font-bold text-amber-900">{item.price}</span>}
                      </div>
                    ))}
                    <div className="text-[11px] text-amber-800 font-bold pt-1.5 border-t border-amber-200 flex items-center justify-between">
                      <span>Afhalen bij DV Balie</span>
                      <span>{createdTicket.mealPickupTime || createdTicket.desiredDate}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => generateTicketReceiptPdf(createdTicket)}
                className="w-full sm:w-auto px-5 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-[#D70096]" />
                <span>Download Bevestiging (PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleResetForNewTicket}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#24126E] hover:bg-[#1A0D52] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
              >
                Nog een aanvraag of bestelling indienen
              </button>
            </div>
          </div>
        ) : (
          /* ================= PUBLIC SERVICE FORM ================= */
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-xs">
            {/* Header / Intro */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D70096] bg-pink-50 px-3 py-1 rounded-full inline-block">
                  Summa Plus Dienstverlening &bull; Blécourtstraat
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#24126E] tracking-tight">
                Waarmee kunnen we je helpen?
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Meld een klusje aan, laat een vergaderruimte klaarzetten of bestel een verse maaltijd van het weekmenu bij ons Dienstverlening team.
              </p>
            </div>

            {/* Quick Snelknop Tabs: Duidelijke Keuze uit 3 Knoppen */}
            <div className="mb-8 p-1.5 bg-[#F7F5FA] rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {/* Knop 1: Klusje */}
              <button
                type="button"
                onClick={() => {
                  setFormMode('standard');
                  setErrors({});
                }}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
                  formMode === 'standard'
                    ? 'bg-[#24126E] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <Wrench className="w-4 h-4 text-emerald-400" />
                <span>1. Klusje / Storing</span>
              </button>

              {/* Knop 2: Vergadering */}
              <button
                type="button"
                onClick={() => {
                  setFormMode('meeting_room');
                  setErrors({});
                }}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
                  formMode === 'meeting_room'
                    ? 'bg-[#D70096] text-white shadow-sm ring-2 ring-[#D70096]/20'
                    : 'bg-pink-50/70 text-[#D70096] hover:bg-pink-100/80'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>2. Vergadering klaarzetten</span>
              </button>

              {/* Knop 3: Maaltijd / Horeca */}
              <button
                type="button"
                onClick={() => {
                  setFormMode('meal_order');
                  setErrors({});
                }}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
                  formMode === 'meal_order'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/20'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100/80'
                }`}
              >
                <Utensils className="w-4 h-4 text-amber-500" />
                <span className="flex items-center gap-1.5">
                  <span>3. Maaltijd bestellen</span>
                  <span className="text-[9px] bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded-full font-black">
                    Horeca
                  </span>
                </span>
              </button>
            </div>

            {/* ================= FORM MODE ROUTING ================= */}
            {formMode === 'meal_order' ? (
              /* ================= 🍽️ DEDICATED MEAL ORDER FORM ================= */
              <form onSubmit={handleMealSubmit} className="space-y-6 animate-in fade-in duration-200">
                {/* Intro Banner */}
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-amber-950">
                        Summa Plus Weekmenu &bull; DV Keuken
                      </h3>
                      <p className="text-xs text-amber-900/80 mt-0.5 leading-relaxed">
                        Vers bereid door het Dienstverlening team. Haal je bestelling warm of vers af bij onze balie aan de Blécourtstraat!
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 px-3 py-1.5 rounded-full shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-amber-700" />
                    <span>Afhalen bij DV Balie</span>
                  </div>
                </div>

                {/* Error message on portions */}
                {errors.portions && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.portions}</span>
                  </div>
                )}

                {/* DISHES LIST WITH IMAGES AND PORTION COUNTERS */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider">
                    Gerechten van deze week (Kies je porties) <span className="text-[#D70096]">*</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDishes.map((dish) => {
                      const selectedCount = mealSelections[dish.id] || 0;
                      const remainingCount = calculateRemainingPortions(dish, currentTickets);
                      const isSoldOut = remainingCount === 0;

                      return (
                        <div
                          key={dish.id}
                          className={`bg-white rounded-2xl border transition-all p-3.5 sm:p-4 flex flex-col justify-between shadow-xs ${
                            selectedCount > 0
                              ? 'border-amber-500 ring-2 ring-amber-400/20 bg-amber-50/20'
                              : isSoldOut
                              ? 'border-slate-200 bg-slate-50/70 opacity-70'
                              : 'border-slate-200/80 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            {/* Dish image with badge */}
                            <div className="relative rounded-xl overflow-hidden aspect-[16/10] mb-3 bg-slate-100 border border-slate-200/80 shadow-inner">
                              <img
                                src={dish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                                alt={dish.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              {dish.dietaryTag && (
                                <div className="absolute top-2 left-2 bg-[#24126E]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                                  {dish.dietaryTag}
                                </div>
                              )}

                              {/* Price tag */}
                              <div className="absolute bottom-2 right-2 bg-white/95 text-slate-900 font-black text-xs px-2.5 py-1 rounded-lg shadow-sm border border-slate-200">
                                {dish.price || '€ 4,00'}
                              </div>
                            </div>

                            {/* Dish Title & Description */}
                            <h4 className="font-extrabold text-sm text-[#24126E] leading-snug">
                              {dish.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {dish.description}
                            </p>
                          </div>

                          {/* Stock Counter & Multi-Portion Selector */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            {/* Available Counter Badge */}
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                                Beschikbaarheid:
                              </span>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                                isSoldOut
                                  ? 'bg-red-100 text-red-700'
                                  : remainingCount <= 3
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isSoldOut 
                                  ? 'Uitverkocht' 
                                  : `Nog ${remainingCount} beschikbaar`}
                              </span>
                            </div>

                            {/* Quantity Controls */}
                            {isSoldOut ? (
                              <span className="text-xs font-bold text-red-500 py-1.5 px-3 bg-red-50 rounded-xl">
                                Niet meer te bestellen
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 bg-[#F7F5FA] p-1 rounded-xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => handlePortionChange(dish, -1)}
                                  disabled={selectedCount === 0}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                                    selectedCount > 0
                                      ? 'bg-white text-slate-700 hover:bg-slate-200 shadow-xs'
                                      : 'text-slate-300 cursor-not-allowed'
                                  }`}
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>

                                <span className={`w-8 text-center text-xs font-black ${
                                  selectedCount > 0 ? 'text-[#D70096]' : 'text-slate-500'
                                }`}>
                                  {selectedCount}x
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handlePortionChange(dish, 1)}
                                  disabled={selectedCount >= remainingCount}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
                                    selectedCount < remainingCount
                                      ? 'bg-[#D70096] text-white hover:bg-[#b5007e] shadow-xs'
                                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Summary Live Bar */}
                {totalPortionsSelected > 0 && (
                  <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-md flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                        {totalPortionsSelected}x
                      </div>
                      <div className="text-xs">
                        <span className="font-bold block">Geselecteerde porties voor deze bestelling:</span>
                        <span className="text-amber-100">
                          {Object.entries(mealSelections).map(([id, qty]) => {
                            const dish = activeDishes.find(d => d.id === id);
                            return `${qty}x ${dish?.name}`;
                          }).join(' • ')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Afhaaldetails: Datum en Tijd */}
                <div className="bg-[#F7F5FA] p-5 sm:p-6 rounded-2xl border border-slate-200/80 space-y-4">
                  <span className="text-[11px] font-bold text-[#24126E] uppercase tracking-wider block">
                    Afhaaltijdstip aan de DV Balie
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Afhaaldag */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#24126E]" />
                        <span>Gewenste afhaaldag <span className="text-[#D70096]">*</span></span>
                      </label>
                      <input
                        type="date"
                        required
                        value={mealDate}
                        onChange={(e) => {
                          setMealDate(e.target.value);
                          if (errors.mealDate) setErrors(prev => ({ ...prev, mealDate: '' }));
                        }}
                        className={`w-full px-3.5 py-2.5 bg-white rounded-xl border ${
                          errors.mealDate ? 'border-red-500' : 'border-slate-200'
                        } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold`}
                      />
                      {errors.mealDate && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.mealDate}</p>
                      )}
                    </div>

                    {/* Afhaaltijd */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Gewenst afhaaltijdstip <span className="text-[#D70096]">*</span></span>
                      </label>
                      <div className="space-y-2">
                        {/* Quick Preset Buttons */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                          {PICKUP_TIME_PRESETS.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setMealTime(t);
                                if (errors.mealTime) setErrors(prev => ({ ...prev, mealTime: '' }));
                              }}
                              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mealTime === t
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Custom Time */}
                        <input
                          type="time"
                          value={mealTime}
                          onChange={(e) => {
                            setMealTime(e.target.value);
                            if (errors.mealTime) setErrors(prev => ({ ...prev, mealTime: '' }));
                          }}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aanvrager Gegevens: Naam & Team */}
                <div className="bg-[#F7F5FA] p-5 sm:p-6 rounded-2xl border border-slate-200/80 space-y-4">
                  <span className="text-[11px] font-bold text-[#24126E] uppercase tracking-wider block">
                    Gegevens van de afhaler
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Voornaam / Naam afhaler <span className="text-[#D70096]">*</span>
                      </label>
                      <input
                        type="text"
                        value={mealRequesterName}
                        onChange={(e) => {
                          setMealRequesterName(e.target.value);
                          if (errors.mealName) setErrors(prev => ({ ...prev, mealName: '' }));
                        }}
                        placeholder="bijv. Daan"
                        className={`w-full px-3.5 py-2.5 bg-white rounded-xl border ${
                          errors.mealName ? 'border-red-500' : 'border-slate-200'
                        } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                      {errors.mealName && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.mealName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Team of Opleiding <span className="text-[#D70096]">*</span>
                      </label>
                      <input
                        type="text"
                        list="meal-team-suggestions"
                        value={mealRequesterTeam}
                        onChange={(e) => {
                          setMealRequesterTeam(e.target.value);
                          if (errors.mealTeam) setErrors(prev => ({ ...prev, mealTeam: '' }));
                        }}
                        placeholder="Entree, VIA, VOAT, OOP"
                        className={`w-full px-3.5 py-2.5 bg-white rounded-xl border ${
                          errors.mealTeam ? 'border-red-500' : 'border-slate-200'
                        } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500`}
                      />
                      <datalist id="meal-team-suggestions">
                        <option value="Entree" />
                        <option value="VIA" />
                        <option value="VOAT" />
                        <option value="OOP" />
                      </datalist>
                      {errors.mealTeam && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.mealTeam}</p>
                      )}
                    </div>
                  </div>

                  {/* Dieetwensen / Opmerkingen */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      Dieetwensen, allergieën of bijzondere opmerkingen (optioneel)
                    </label>
                    <textarea
                      rows={2}
                      value={mealNotes}
                      onChange={(e) => setMealNotes(e.target.value)}
                      placeholder="bijv. Graag de jus apart, 1x vegetarische worst, of bestelling wordt opgehaald door collega..."
                      className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Submit Bestelling Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>
                      {totalPortionsSelected > 0 
                        ? `Bestelling Bevestigen (${totalPortionsSelected} portie${totalPortionsSelected > 1 ? 's' : ''})` 
                        : 'Selecteer eerst porties om te bestellen'}
                    </span>
                  </button>
                  <span className="text-[11px] text-slate-400 text-center block mt-2">
                    Na verzending ontvang je direct een bevestiging en ticketnummer voor bij de afhaalbalie.
                  </span>
                </div>
              </form>
            ) : formMode === 'meeting_room' ? (
              /* ================= ☕ DEDICATED MEETING ROOM FORM ================= */
              <form onSubmit={handleMeetingRoomSubmit} className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D70096] text-white flex items-center justify-center shrink-0">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#24126E]">
                      Snelformulier: Vergaderruimte klaarzetten
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Geef direct aan welk lokaal, welke opstelling en of er koffie/thee nodig is.
                    </p>
                  </div>
                </div>

                {/* Ruimte & Datum Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#24126E]" />
                      <span>Welk lokaal of vergaderruimte? <span className="text-[#D70096]">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={meetingRoom}
                      onChange={(e) => {
                        setMeetingRoom(e.target.value);
                        if (errors.meetingRoom) setErrors(prev => ({ ...prev, meetingRoom: '' }));
                      }}
                      placeholder="bijv. Lokaal 2.14, Vergaderruimte A"
                      className={`w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border ${
                        errors.meetingRoom ? 'border-red-500' : 'border-slate-200'
                      } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] font-medium`}
                    />
                    {errors.meetingRoom && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.meetingRoom}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#24126E]" />
                      <span>Datum bijeenkomst <span className="text-[#D70096]">*</span></span>
                    </label>
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => {
                        setMeetingDate(e.target.value);
                        if (errors.meetingDate) setErrors(prev => ({ ...prev, meetingDate: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border ${
                        errors.meetingDate ? 'border-red-500' : 'border-slate-200'
                      } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] font-medium`}
                    />
                    {errors.meetingDate && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.meetingDate}</p>
                    )}
                  </div>
                </div>

                {/* Tijd & Koffie/Thee Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#24126E]" />
                      <span>Aanvangstijd <span className="text-[#D70096]">*</span></span>
                    </label>
                    <input
                      type="time"
                      value={meetingTime}
                      onChange={(e) => {
                        setMeetingTime(e.target.value);
                        if (errors.meetingTime) setErrors(prev => ({ ...prev, meetingTime: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border ${
                        errors.meetingTime ? 'border-red-500' : 'border-slate-200'
                      } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] font-medium`}
                    />
                    {errors.meetingTime && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.meetingTime}</p>
                    )}
                  </div>

                  {/* Koffie / Thee Toggle */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                      <Coffee className="w-3.5 h-3.5 text-[#D70096]" />
                      <span>Koffie & Thee klaarzetten?</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMeetingCoffeeTea(true)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          meetingCoffeeTea
                            ? 'bg-[#24126E] text-white border-[#24126E] shadow-xs'
                            : 'bg-[#F7F5FA] text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ✓ Ja, graag
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetingCoffeeTea(false)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          !meetingCoffeeTea
                            ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                            : 'bg-[#F7F5FA] text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ✕ Nee, niet nodig
                      </button>
                    </div>
                  </div>
                </div>

                {/* Gewenste Opstelling */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Gewenste Zaalopstelling
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ROOM_LAYOUT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setMeetingLayout(preset)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                          meetingLayout === preset
                            ? 'bg-pink-50 border-[#D70096] text-[#D70096] shadow-xs ring-1 ring-[#D70096]'
                            : 'bg-[#F7F5FA] border-slate-200 text-slate-700 hover:bg-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {meetingLayout === 'Anders (zie bijzonderheden)' && (
                    <input
                      type="text"
                      value={meetingCustomLayout}
                      onChange={(e) => setMeetingCustomLayout(e.target.value)}
                      placeholder="Beschrijf de gewenste afwijkende opstelling..."
                      className="mt-2 w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                    />
                  )}
                </div>

                {/* Bijzonderheden */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Bijzonderheden & Wensen (optioneel)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="bijv. Extra flipover, microfoon klaarleggen, aantal personen (20), etc."
                    className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                  />
                </div>

                {/* Aanvrager Gegevens Box */}
                <div className="bg-[#F7F5FA] p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  <span className="text-[11px] font-bold text-[#24126E] uppercase tracking-wider block">
                    Aanvrager gegevens
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Naam aanvrager <span className="text-[#D70096]">*</span>
                      </label>
                      <input
                        type="text"
                        value={meetingRequesterName}
                        onChange={(e) => {
                          setMeetingRequesterName(e.target.value);
                          if (errors.meetingName) setErrors(prev => ({ ...prev, meetingName: '' }));
                        }}
                        placeholder="bijv. Sanne Jansen"
                        className={`w-full px-3.5 py-2.5 bg-white rounded-xl border ${
                          errors.meetingName ? 'border-red-500' : 'border-slate-200'
                        } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]`}
                      />
                      {errors.meetingName && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.meetingName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Team / Opleiding
                      </label>
                      <input
                        type="text"
                        list="meeting-team-suggestions"
                        value={meetingRequesterTeam}
                        onChange={(e) => setMeetingRequesterTeam(e.target.value)}
                        placeholder="Entree, VIA, VOAT, OOP"
                        className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                      />
                      <datalist id="meeting-team-suggestions">
                        <option value="Entree" />
                        <option value="VIA" />
                        <option value="VOAT" />
                        <option value="OOP" />
                      </datalist>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-2xl bg-[#D70096] hover:bg-[#b5007e] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#D70096]/25 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <Coffee className="w-5 h-5" />
                    <span>Vergaderruimte Aanvraag Verzenden</span>
                  </button>
                </div>
              </form>
            ) : (
              /* ================= 🔧 STANDARD SERVICE TICKET FORM ================= */
              <form onSubmit={handleStandardSubmit} className="space-y-6 animate-in fade-in duration-200">
                {/* Titel / Korte Omschrijving */}
                <div>
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                    Wat is er aan de hand of wat moet er gebeuren? <span className="text-[#D70096]">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                    }}
                    placeholder="bijv. Digibord start niet op, bureaustoel kapot, lokaal verhuizen..."
                    className={`w-full px-4 py-3 bg-[#F7F5FA] rounded-2xl border ${
                      errors.title ? 'border-red-500' : 'border-slate-200'
                    } text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] transition-all font-medium`}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.title}</span>
                    </p>
                  )}
                </div>

                {/* Locatie & Gewenste Datum/Tijd Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lokaal of Ruimte */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#24126E]" />
                      <span>Welk lokaal of ruimte? <span className="text-[#D70096]">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={roomLocation}
                      onChange={(e) => {
                        setRoomLocation(e.target.value);
                        if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
                      }}
                      placeholder="bijv. Lokaal 2.14, Docentenkamer, Hal"
                      className={`w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border ${
                        errors.location ? 'border-red-500' : 'border-slate-200'
                      } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]`}
                    />
                    {errors.location && (
                      <p className="text-[11px] text-red-600 mt-1">{errors.location}</p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Locatie is altijd Blécourtstraat
                    </span>
                  </div>

                  {/* Gewenste Datum & Tijd */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#24126E]" />
                      <span>Gewenste datum & tijd (optioneel)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={desiredDate}
                        onChange={(e) => setDesiredDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                      />
                      <input
                        type="time"
                        value={desiredTime}
                        onChange={(e) => setDesiredTime(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Laat leeg voor &apos;zo spoedig mogelijk&apos;
                    </span>
                  </div>
                </div>

                {/* Urgentie / Prioriteit Selectie */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Prioriteit / Urgentie
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'laag', label: 'Laag', desc: 'Geen haast' },
                      { id: 'normaal', label: 'Normaal', desc: 'Reguliere taak' },
                      { id: 'hoog', label: 'Hoog', desc: 'Binnen 24u' },
                      { id: 'spoed', label: 'Spoed', desc: 'Direct / lesverstoring' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id as TicketPriority)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          priority === p.id
                            ? p.id === 'spoed'
                              ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                              : 'bg-indigo-50 border-[#24126E] text-[#24126E] shadow-xs'
                            : 'bg-[#F7F5FA] border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <span className="font-bold text-xs block">{p.label}</span>
                        <span className="text-[10px] text-slate-400">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Uitgebreide Toelichting */}
                <div>
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                    Toelichting op de situatie <span className="text-[#D70096]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
                    }}
                    placeholder="Geef zoveel mogelijk relevante details. Bijv: Welk kabeltje ontbreekt, welke foutmelding geeft de beamer, om hoeveel tafels gaat het, etc."
                    className={`w-full px-4 py-3 bg-[#F7F5FA] rounded-2xl border ${
                      errors.description ? 'border-red-500' : 'border-slate-200'
                    } text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] leading-relaxed`}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.description}</span>
                    </p>
                  )}
                </div>

                {/* Foto toevoegen */}
                <div>
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                    Foto toevoegen (optioneel)
                  </label>

                  <div className="space-y-3">
                    {photos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {photos.map((photo, index) => (
                          <div key={index} className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video group bg-slate-100">
                            <img src={photo} alt={`Bijlage ${index + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-110"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {photos.length < 4 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-[#D70096] bg-[#F7F5FA] hover:bg-pink-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-[#D70096] flex items-center justify-center">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-[#24126E]">
                          {isUploadingPhoto ? 'Afbeelding verwerken...' : 'Foto maken of bestand kiezen'}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Voeg eventueel een duidelijke foto toe (max. 4 foto&apos;s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Aanvrager Gegevens Box */}
                <div className="bg-[#F7F5FA] p-5 sm:p-6 rounded-2xl border border-slate-200/80 space-y-4">
                  <span className="text-[11px] font-bold text-[#24126E] uppercase tracking-wider block">
                    Aanvrager gegevens
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Voornaam aanvrager <span className="text-[#D70096]">*</span>
                      </label>
                      <input
                        type="text"
                        value={requesterFirstName}
                        onChange={(e) => {
                          setRequesterFirstName(e.target.value);
                          if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="bijv. Marlies"
                        className={`w-full px-3.5 py-2.5 bg-white rounded-xl border ${
                          errors.name ? 'border-red-500' : 'border-slate-200'
                        } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]`}
                      />
                      {errors.name && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Team of Opleiding <span className="text-[#D70096]">*</span>
                      </label>
                      <input
                        type="text"
                        list="team-suggestions"
                        value={requesterTeam}
                        onChange={(e) => {
                          setRequesterTeam(e.target.value);
                          if (errors.team) setErrors(prev => ({ ...prev, team: '' }));
                        }}
                        placeholder="Entree, VIA, VOAT, OOP"
                        className={`w-full px-3.5 py-2.5 bg-white rounded-xl border ${
                          errors.team ? 'border-red-500' : 'border-slate-200'
                        } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]`}
                      />
                      <datalist id="team-suggestions">
                        <option value="Entree" />
                        <option value="VIA" />
                        <option value="VOAT" />
                        <option value="OOP" />
                      </datalist>
                      {errors.team && (
                        <p className="text-[11px] text-red-600 mt-1">{errors.team}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-2xl bg-[#D70096] hover:bg-[#b5007e] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#D70096]/25 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Klusje direct versturen</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
