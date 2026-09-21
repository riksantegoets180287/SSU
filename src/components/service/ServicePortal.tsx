import React, { useState, useMemo, useRef } from 'react';
import { Wrench, Plus, Search, ListFilter as Filter, CircleCheck as CheckCircle2, Clock, CircleAlert as AlertCircle, TriangleAlert as AlertTriangle, MapPin, User, Calendar, Layers, Tv, Building2, Armchair, Sparkles, Send, X, ArrowLeft, MessageSquare, ChevronRight, LayoutGrid, List as ListIcon, Circle as HelpCircle, Tag, Phone, Mail, ShieldCheck, Check, Camera, Image as ImageIcon, Users, GraduationCap, Briefcase, Eye, Download, Link2, Lock, Archive, Clock as Unlock, KeyRound, FileDown, Utensils, ChefHat } from 'lucide-react';
import { ServiceTicket, TicketCategory, TicketPriority, TicketStatus, StudentWorker, SupervisingTeacher, MenuItem } from '../../types';
import { generateTicketReceiptPdf } from '../../utils/ticketReceiptPdf';
import { formatDutchDate, formatDutchDateTime, getStoredMenuItems, saveMenuItems } from '../../lib/storage';
import { compressImageFile } from '../../lib/barcode';
import { ShareLinkModal } from './ShareLinkModal';
import { ServiceAdminView } from './ServiceAdminView';
import { MenuManagementModal } from './MenuManagementModal';
import { verifyAdminPin } from '../../lib/verifyAdminPin';
import type { AdminSessionState } from '../../lib/useAdminSession';

interface ServicePortalProps {
  tickets: ServiceTicket[];
  students?: StudentWorker[];
  teachers?: SupervisingTeacher[];
  menuItems?: MenuItem[];
  onSaveMenuItems?: (items: MenuItem[]) => void;
  onAddTicket: (ticket: Omit<ServiceTicket, 'id' | 'ticketNumber' | 'createdAt' | 'createdAtFormatted'>) => ServiceTicket;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus, notes?: string, assignedTo?: string, assignedStudent?: string, assignedTeacher?: string) => void;
  onArchiveTicket?: (ticketId: string) => void;
  onUnarchiveTicket?: (ticketId: string) => void;
  onDeleteTicket?: (ticketId: string) => void;
  onAddStudent?: (student: Omit<StudentWorker, 'id'>) => void;
  onDeleteStudent?: (studentId: string) => void;
  onToggleStudentActive?: (studentId: string) => void;
  onAddTeacher?: (teacher: Omit<SupervisingTeacher, 'id'>) => void;
  onDeleteTeacher?: (teacherId: string) => void;
  onToggleTeacherActive?: (teacherId: string) => void;
  onBackToPortal: () => void;
  onOpenPublicLinkView?: () => void;
  adminSession: AdminSessionState;
}

export const ServicePortal: React.FC<ServicePortalProps> = ({
  tickets,
  students = [],
  teachers = [],
  menuItems: propMenuItems,
  onSaveMenuItems,
  onAddTicket,
  onUpdateTicketStatus,
  onArchiveTicket,
  onUnarchiveTicket,
  onDeleteTicket,
  onAddStudent,
  onDeleteStudent,
  onToggleStudentActive,
  onAddTeacher,
  onDeleteTeacher,
  onToggleTeacherActive,
  onBackToPortal,
  onOpenPublicLinkView,
  adminSession,
}) => {
  // Mode: Desk (Baliemedewerker) vs Admin (Beheerder)
  const [serviceRoleMode, setServiceRoleMode] = useState<'desk' | 'admin'>('desk');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [pinVerifying, setPinVerifying] = useState(false);
  const isAdminAuthenticated = adminSession.isAuthenticated;

  // Desk State
  const [activeTab, setActiveTab] = useState<'overview' | 'new_ticket'>('overview');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'horeca' | 'klusjes'>('all');
  const [currentMenuItems, setCurrentMenuItems] = useState<MenuItem[]>(() => propMenuItems && propMenuItems.length > 0 ? propMenuItems : getStoredMenuItems());

  const handleUpdateMenuItems = (items: MenuItem[]) => {
    setCurrentMenuItems(items);
    saveMenuItems(items);
    if (onSaveMenuItems) {
      onSaveMenuItems(items);
    }
  };

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selected Ticket for Modal View / Action
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const [statusUpdateNotes, setStatusUpdateNotes] = useState<string>('');
  const [assignedTeacher, setAssignedTeacher] = useState<string>('');
  const [assignedStudent, setAssignedStudent] = useState<string>('');
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  // Form State for new ticket
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState<TicketPriority>('normaal');
  const [formRoomLocation, setFormRoomLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRequesterFirstName, setFormRequesterFirstName] = useState('');
  const [formRequesterTeam, setFormRequesterTeam] = useState('');
  const [formDesiredDate, setFormDesiredDate] = useState('');
  const [formDesiredTime, setFormDesiredTime] = useState('');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [formAssignedStudent, setFormAssignedStudent] = useState('');
  const [formAssignedTeacher, setFormAssignedTeacher] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Submission success popup
  const [submittedTicket, setSubmittedTicket] = useState<ServiceTicket | null>(null);

  // Handle Admin PIN verification
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinVerifying) return;
    if (pinInput.length !== 6) {
      setPinError('Ongeldige code.');
      return;
    }
    setPinVerifying(true);
    setPinError('');
    const result = await verifyAdminPin(pinInput);
    setPinVerifying(false);
    if (result.success && result.sessionToken) {
      adminSession.login(result.sessionToken);
      setShowPinModal(false);
      setServiceRoleMode('admin');
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Ongeldige code.');
      setPinInput('');
    }
  };

  const handleSwitchToAdmin = () => {
    if (isAdminAuthenticated) {
      setServiceRoleMode('admin');
    } else {
      setShowPinModal(true);
      setPinInput('');
      setPinError('');
    }
  };

  // Photo uploader in form
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
      setFormPhotos(prev => [...prev, ...newPhotoUrls].slice(0, 4));
    } catch {
      // ignore
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    setFormPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Categories helper
  const getCategoryLabel = (category: TicketCategory) => {
    switch (category) {
      case 'ict_av': return 'ICT & Digiborden / AV';
      case 'facilitair': return 'Facilitair & Gebouw';
      case 'meubilair': return 'Meubilair & Verhuizing';
      case 'reparatie': return 'Reparatie & Onderhoud';
      case 'evenement': return 'Evenement & Klaarzetten';
      case 'overig': return 'Overig';
      default: return category;
    }
  };

  const getCategoryIcon = (category: TicketCategory) => {
    switch (category) {
      case 'ict_av': return <Tv className="w-4 h-4" />;
      case 'facilitair': return <Building2 className="w-4 h-4" />;
      case 'meubilair': return <Armchair className="w-4 h-4" />;
      case 'reparatie': return <Wrench className="w-4 h-4" />;
      case 'evenement': return <Sparkles className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'spoed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3" /> Spoed
          </span>
        );
      case 'hoog':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3" /> Hoog
          </span>
        );
      case 'normaal':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-[#24126E]">
            Normaal
          </span>
        );
      case 'laag':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Laag
          </span>
        );
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-pink-100 text-[#D70096] border border-pink-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D70096]"></span>
            Nieuw / Open
          </span>
        );
      case 'in_behandeling':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-indigo-100 text-[#24126E] border border-indigo-200">
            <Clock className="w-3 h-3" />
            In behandeling
          </span>
        );
      case 'wacht_op_onderdelen':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            <AlertCircle className="w-3 h-3" />
            Wacht op onderdelen
          </span>
        );
      case 'wachtlijst':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
            <Clock className="w-3 h-3 text-purple-700" />
            Wachtlijst
          </span>
        );
      case 'afgerond':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Afgerond
          </span>
        );
      case 'geannuleerd':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
            Geannuleerd
          </span>
        );
    }
  };

  // Only non-archived tickets appear on the active desk dashboard
  const activeTickets = useMemo(() => tickets.filter(t => !t.archived), [tickets]);
  const archivedTicketsCount = useMemo(() => tickets.filter(t => t.archived).length, [tickets]);

  // KPIs for active desk tickets
  const openCount = activeTickets.filter(t => t.status === 'open').length;
  const inProgressCount = activeTickets.filter(t => t.status === 'in_behandeling').length;
  const waitingCount = activeTickets.filter(t => t.status === 'wacht_op_onderdelen').length;
  const waitlistCount = activeTickets.filter(t => t.status === 'wachtlijst').length;
  const completedCount = activeTickets.filter(t => t.status === 'afgerond').length;

  const horecaTicketsCount = useMemo(() => {
    return activeTickets.filter(t => t.category === 'horeca' || (t.mealOrderItems && t.mealOrderItems.length > 0)).length;
  }, [activeTickets]);

  // Filtered Active Tickets for Desk
  const filteredTickets = useMemo(() => {
    return activeTickets.filter(ticket => {
      // Category / Type filter
      if (categoryFilter === 'horeca') {
        const isHoreca = ticket.category === 'horeca' || (ticket.mealOrderItems && ticket.mealOrderItems.length > 0);
        if (!isHoreca) return false;
      } else if (categoryFilter === 'klusjes') {
        const isHoreca = ticket.category === 'horeca' || (ticket.mealOrderItems && ticket.mealOrderItems.length > 0);
        if (isHoreca) return false;
      }

      // Status
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
      // Priority
      if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
      // Teacher Filter
      if (teacherFilter !== 'all') {
        const tName = ticket.assignedTeacher || ticket.assignedTo;
        if (teacherFilter === 'unassigned' && tName) return false;
        if (teacherFilter !== 'unassigned' && tName !== teacherFilter) return false;
      }
      // Student Filter
      if (studentFilter !== 'all') {
        if (studentFilter === 'unassigned' && ticket.assignedStudent) return false;
        if (studentFilter !== 'unassigned' && ticket.assignedStudent !== studentFilter) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ticket.title.toLowerCase().includes(q);
        const matchDesc = ticket.description.toLowerCase().includes(q);
        const matchNumber = ticket.ticketNumber.toLowerCase().includes(q);
        const matchReq = ticket.requesterName.toLowerCase().includes(q);
        const matchTeam = ticket.requesterTeam.toLowerCase().includes(q);
        const matchLoc = ticket.location.toLowerCase().includes(q);
        const matchStudent = ticket.assignedStudent?.toLowerCase().includes(q);
        const matchTeacher = (ticket.assignedTeacher || ticket.assignedTo)?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchNumber || matchReq || matchTeam || matchLoc || matchStudent || matchTeacher;
      }
      return true;
    });
  }, [activeTickets, statusFilter, priorityFilter, studentFilter, teacherFilter, searchQuery, categoryFilter]);

  const handleOpenDetailModal = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setStatusUpdateNotes(ticket.resolutionNotes || '');
    setAssignedTeacher(ticket.assignedTeacher || ticket.assignedTo || '');
    setAssignedStudent(ticket.assignedStudent || '');
  };

  const handleSaveStatusChange = (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    onUpdateTicketStatus(selectedTicket.id, newStatus, statusUpdateNotes, assignedTeacher, assignedStudent, assignedTeacher);
    setSelectedTicket({
      ...selectedTicket,
      status: newStatus,
      resolutionNotes: statusUpdateNotes,
      assignedTo: assignedTeacher,
      assignedTeacher: assignedTeacher,
      assignedStudent: assignedStudent,
      completedAt: newStatus === 'afgerond' ? new Date().toISOString() : selectedTicket.completedAt,
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formTitle.trim()) errors.title = 'Vul een korte titel of omschrijving in';
    if (!formRoomLocation.trim()) errors.location = 'Vul het lokaal of de ruimte in';
    if (!formDescription.trim()) errors.description = 'Geef een toelichting op het probleem of de taak';
    if (!formRequesterFirstName.trim()) errors.name = 'Vul de voornaam van de aanvrager in';
    if (!formRequesterTeam.trim()) errors.team = 'Vul het team of de opleiding in';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const formattedDesiredDateTime = formDesiredDate.trim()
      ? (formDesiredTime.trim() ? `${formDesiredDate.trim()} om ${formDesiredTime.trim()} uur` : formDesiredDate.trim())
      : (formDesiredTime.trim() ? `Om ${formDesiredTime.trim()} uur` : undefined);

    const newTicket = onAddTicket({
      title: formTitle.trim(),
      description: formDescription.trim(),
      priority: formPriority,
      location: formRoomLocation.trim(),
      requesterName: formRequesterFirstName.trim(),
      requesterTeam: formRequesterTeam.trim(),
      desiredDate: formattedDesiredDateTime,
      photos: formPhotos.length > 0 ? formPhotos : undefined,
      assignedStudent: formAssignedStudent.trim() || undefined,
      assignedTeacher: formAssignedTeacher.trim() || undefined,
      assignedTo: formAssignedTeacher.trim() || undefined,
      status: 'open',
    });

    setSubmittedTicket(newTicket);
    // Reset form
    setFormTitle('');
    setFormDescription('');
    setFormRoomLocation('');
    setFormRequesterFirstName('');
    setFormRequesterTeam('');
    setFormDesiredDate('');
    setFormDesiredTime('');
    setFormPhotos([]);
    setFormAssignedStudent('');
    setFormAssignedTeacher('');
    setFormErrors({});
  };

  // IF ADMIN VIEW IS SELECTED
  if (serviceRoleMode === 'admin') {
    return (
      <ServiceAdminView
        tickets={tickets}
        students={students}
        teachers={teachers}
        menuItems={currentMenuItems}
        onSaveMenuItems={handleUpdateMenuItems}
        onArchiveTicket={onArchiveTicket || (() => {})}
        onUnarchiveTicket={onUnarchiveTicket || (() => {})}
        onDeleteTicket={onDeleteTicket || (() => {})}
        onUpdateTicketStatus={onUpdateTicketStatus}
        onAddStudent={onAddStudent || (() => {})}
        onDeleteStudent={onDeleteStudent || (() => {})}
        onToggleStudentActive={onToggleStudentActive || (() => {})}
        onAddTeacher={onAddTeacher || (() => {})}
        onDeleteTeacher={onDeleteTeacher || (() => {})}
        onToggleTeacherActive={onToggleTeacherActive || (() => {})}
        onSwitchToDesk={() => setServiceRoleMode('desk')}
        onBackToPortal={onBackToPortal}
      />
    );
  }

  // BALIEMEDEWERKER (DESK) VIEW
  return (
    <div className="flex flex-col flex-1 min-h-[calc(100vh-4rem-3rem)]">
      {/* Top Banner Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onBackToPortal}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#24126E] bg-[#F7F5FA] hover:bg-slate-200/80 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Hoofdmenu</span>
          </button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>
          
          {/* Module & Role Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D70096]">Summa Plus</span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs font-bold text-[#24126E]">Servicesysteem</span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-50 text-[#24126E] px-2.5 py-0.5 rounded-full border border-indigo-100">
              <User className="w-3 h-3 text-[#D70096]" />
              Baliemedewerker
            </span>
          </div>
        </div>

        {/* View Switcher Tabs & Role Toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          {/* Weekmenu & Portiebeheer Knop (Admin beveiligd) */}
          <button
            onClick={() => {
              if (isAdminAuthenticated) {
                setIsMenuModalOpen(true);
              } else {
                handleSwitchToAdmin();
              }
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200/90 text-amber-950 border border-amber-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Beheer het weekmenu, foto's en de maximale portiecapaciteit van de keuken (Beveiligd voor beheerders)"
          >
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Weekmenu & Porties (Admin)</span>
            <span className="sm:hidden">Weekmenu (Admin)</span>
          </button>

          {/* Share Link Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-[#24126E] border border-indigo-200/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Deel een directe link met collega's om een klusje of maaltijd in te voeren zonder beheerdersrechten"
          >
            <Link2 className="w-3.5 h-3.5 text-[#D70096]" />
            <span className="hidden sm:inline">Aanvraaglink voor collega&apos;s</span>
            <span className="sm:hidden">Aanvraaglink</span>
          </button>

          {/* Desk Tabs */}
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#24126E] text-white shadow-xs'
                : 'bg-[#F7F5FA] text-slate-600 hover:text-[#24126E] hover:bg-slate-200/80'
            }`}
          >
            Dashboard ({activeTickets.length})
          </button>
          
          <button
            onClick={() => setActiveTab('new_ticket')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'new_ticket'
                ? 'bg-[#D70096] text-white shadow-md shadow-[#D70096]/20'
                : 'bg-pink-50 text-[#D70096] hover:bg-pink-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Klusje aanmelden</span>
          </button>

          <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

          {/* Mode Switcher: Baliemedewerker vs Admin */}
          <button
            onClick={handleSwitchToAdmin}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Schakel over naar het Beheerder (Admin) dashboard voor archiveren en docent/student beheer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Beheer (Admin)</span>
            {archivedTicketsCount > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {archivedTicketsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'new_ticket' ? (
        /* ================= SUBMIT TICKET VIEW ================= */
        <div className="max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-xs">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-pink-50 text-[#D70096] text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                <Wrench className="w-3.5 h-3.5" />
                <span>Nieuwe Servicemelding (Balie)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#24126E] tracking-tight">
                Klusje of storing registreren
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Meld een storing, ICT-vraag of facilitaire taak aan. Het serviceteam wijst dit toe aan een student en begeleidend docent.
              </p>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Snel sjabloon:</span>
              <button
                type="button"
                onClick={() => {
                  setFormTitle('Vergaderruimte klaarzetten');
                  setFormPriority('normaal');
                  setFormDescription('Taak: Vergaderruimte klaarzetten\nOpstelling: U-vorm\nKoffie & Thee: Ja, graag klaarzetten\nTijd: 09:00 uur\nBijzonderheden: ');
                }}
                className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-[#D70096] text-xs font-bold transition-colors cursor-pointer border border-pink-200"
              >
                ☕ Vergaderruimte klaarzetten
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Titel */}
              <div>
                <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                  Wat is de taak of het probleem? <span className="text-[#D70096]">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (formErrors.title) setFormErrors(prev => ({ ...prev, title: '' }));
                  }}
                  placeholder="bijv. Digibord scherm blijft zwart / 10 extra stoelen plaatsen in 3.12"
                  className={`w-full px-4 py-3 bg-[#F7F5FA] rounded-xl border ${
                    formErrors.title ? 'border-red-500' : 'border-slate-200/80 focus:ring-2 focus:ring-[#D70096]'
                  } text-sm text-slate-800 focus:outline-none transition-all placeholder:text-slate-400`}
                />
                {formErrors.title && (
                  <p className="text-xs text-red-600 mt-1.5">{formErrors.title}</p>
                )}
              </div>

              {/* Prioriteit, Gewenste Datum & Gewenste Tijd */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                    Prioriteit / Urgentie <span className="text-[#D70096]">*</span>
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TicketPriority)}
                    className="w-full px-4 py-3 bg-[#F7F5FA] rounded-xl border border-slate-200/80 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] transition-all cursor-pointer"
                  >
                    <option value="laag">Laag (geen haast)</option>
                    <option value="normaal">Normaal (binnen 2-3 dagen)</option>
                    <option value="hoog">Hoog (vandaag / morgen)</option>
                    <option value="spoed">Spoed (lesverstoring / direct)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                    Gewenste datum (optioneel)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="date"
                      value={formDesiredDate}
                      onChange={(e) => setFormDesiredDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#F7F5FA] rounded-xl border border-slate-200/80 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                    Gewenste tijd (optioneel)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="time"
                      value={formDesiredTime}
                      onChange={(e) => setFormDesiredTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#F7F5FA] rounded-xl border border-slate-200/80 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] transition-all cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Locatie: Vaste vestiging Blécourtstraat + Ruimte/Lokaal */}
              <div>
                <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                  Locatie <span className="text-[#D70096]">*</span>
                </label>
                <div className="bg-[#F7F5FA] rounded-2xl border border-slate-200/80 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#24126E] bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <Building2 className="w-4 h-4 text-[#D70096] shrink-0" />
                    <span>Vestiging: <strong>Blécourtstraat</strong></span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Lokaal of ruimte <span className="text-[#D70096]">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={formRoomLocation}
                        onChange={(e) => {
                          setFormRoomLocation(e.target.value);
                          if (formErrors.location) setFormErrors(prev => ({ ...prev, location: '' }));
                        }}
                        placeholder="bijv. Lokaal 2.14, Docentenkamer, Aula, Magazijn..."
                        className={`w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border ${
                          formErrors.location ? 'border-red-500' : 'border-slate-200 focus:ring-2 focus:ring-[#D70096]'
                        } text-xs text-slate-800 focus:outline-none transition-all placeholder:text-slate-400`}
                      />
                    </div>
                    {formErrors.location && (
                      <p className="text-xs text-red-600 mt-1">{formErrors.location}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Omschrijving */}
              <div>
                <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                  Omschrijving van het klusje <span className="text-[#D70096]">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formDescription}
                  onChange={(e) => {
                    setFormDescription(e.target.value);
                    if (formErrors.description) setFormErrors(prev => ({ ...prev, description: '' }));
                  }}
                  placeholder="Beschrijf duidelijk wat er moet gebeuren, wat het defect is, of wat er klaar moet staan..."
                  className={`w-full px-4 py-3 bg-[#F7F5FA] rounded-xl border ${
                    formErrors.description ? 'border-red-500' : 'border-slate-200/80 focus:ring-2 focus:ring-[#D70096]'
                  } text-sm text-slate-800 focus:outline-none transition-all placeholder:text-slate-400 leading-relaxed`}
                />
                {formErrors.description && (
                  <p className="text-xs text-red-600 mt-1.5">{formErrors.description}</p>
                )}
              </div>

              {/* Toewijzen aan Begeleidend Docent & Student */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F7F5FA] p-5 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#24126E]" />
                    <span>Begeleidend Docent toewijzen</span>
                  </label>
                  <select
                    value={formAssignedTeacher}
                    onChange={(e) => setFormAssignedTeacher(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] cursor-pointer"
                  >
                    <option value="">-- Nog geen docent toegewezen --</option>
                    {teachers.filter(t => t.active).map(teacher => (
                      <option key={teacher.id} value={teacher.name}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#D70096]" />
                    <span>Student toewijzen</span>
                  </label>
                  <select
                    value={formAssignedStudent}
                    onChange={(e) => setFormAssignedStudent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] cursor-pointer"
                  >
                    <option value="">-- Nog geen student toegewezen --</option>
                    {students.filter(s => s.active).map(student => (
                      <option key={student.id} value={student.name}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Foto Bijlagen */}
              <div>
                <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
                  Foto&apos;s / Bijlagen toevoegen (optioneel)
                </label>
                
                <div className="space-y-3">
                  {formPhotos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formPhotos.map((photo, index) => (
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

                  {formPhotos.length < 4 && (
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
                        {isUploadingPhoto ? 'Afbeelding verwerken...' : 'Foto toevoegen of maken'}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Voeg een foto toe van het defect of de situatie (max. 4)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Aanvrager Gegevens Box */}
              <div className="bg-[#F7F5FA] p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <span className="text-[11px] font-bold text-[#24126E] uppercase tracking-wider block">
                  Gegevens van de aanvrager
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Voornaam aanvrager <span className="text-[#D70096]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formRequesterFirstName}
                      onChange={(e) => {
                        setFormRequesterFirstName(e.target.value);
                        if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                      }}
                      placeholder="bijv. Marlies"
                      className={`w-full px-3.5 py-2.5 bg-white rounded-xl border ${
                        formErrors.name ? 'border-red-500' : 'border-slate-200'
                      } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]`}
                    />
                    {formErrors.name && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Team / Opleiding <span className="text-[#D70096]">*</span>
                    </label>
                    <input
                      type="text"
                      list="portal-team-suggestions"
                      value={formRequesterTeam}
                      onChange={(e) => {
                        setFormRequesterTeam(e.target.value);
                        if (formErrors.team) setFormErrors(prev => ({ ...prev, team: '' }));
                      }}
                      placeholder="Entree, VIA, VOAT, OOP"
                      className={`w-full px-3.5 py-2.5 bg-white rounded-xl border ${
                        formErrors.team ? 'border-red-500' : 'border-slate-200'
                      } text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]`}
                    />
                    <datalist id="portal-team-suggestions">
                      <option value="Entree" />
                      <option value="VIA" />
                      <option value="VOAT" />
                      <option value="OOP" />
                    </datalist>
                    {formErrors.team && (
                      <p className="text-[11px] text-red-600 mt-1">{formErrors.team}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-5 py-3 rounded-xl bg-[#F7F5FA] hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-6 rounded-xl bg-[#D70096] hover:bg-[#b5007e] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D70096]/20 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Klusje indienen & Ticket aanmaken</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ================= TICKETS OVERVIEW VIEW ================= */
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 bg-white border-b lg:border-b-0 lg:border-r border-indigo-100 p-6 flex flex-col gap-6 shrink-0">
            {/* Search Input */}
            <div>
              <label className="block text-[10px] font-bold text-indigo-900/50 uppercase tracking-widest mb-3">
                Zoeken in actieve tickets
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Klus, lokaal, student, docent..."
                  className="w-full bg-[#F7F5FA] border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#D70096] focus:border-transparent placeholder:text-slate-400 text-slate-800 transition-all"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Supervising Teacher Filter */}
            {teachers.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-indigo-900/50 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-[#24126E]" />
                  <span>Begeleidend docent</span>
                </label>
                <select
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F5FA] border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D70096] cursor-pointer"
                >
                  <option value="all">Alle docenten</option>
                  <option value="unassigned">⚠️ Nog niet toegewezen</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.name}>
                      👨‍🏫 {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Student Assignment Filter */}
            {students.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-indigo-900/50 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-[#D70096]" />
                  <span>Toegewezen student</span>
                </label>
                <select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F5FA] border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#D70096] cursor-pointer"
                >
                  <option value="all">Alle studenten</option>
                  <option value="unassigned">⚠️ Nog niet toegewezen</option>
                  {students.map(s => (
                    <option key={s.id} value={s.name}>
                      👤 {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Type Melding Filter */}
            <div>
              <label className="block text-[10px] font-bold text-indigo-900/50 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#24126E]" />
                <span>Soort Melding</span>
              </label>
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-indigo-50 text-[#24126E] shadow-xs'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span>Alle meldingen</span>
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px]">{activeTickets.length}</span>
                </button>

                <button
                  onClick={() => setCategoryFilter('horeca')}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    categoryFilter === 'horeca'
                      ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 shadow-xs'
                      : 'hover:bg-amber-50/50 text-slate-700 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>Horeca & Maaltijden</span>
                  </span>
                  <span className="bg-amber-200 text-amber-950 font-black px-1.5 py-0.2 rounded text-[10px]">
                    {horecaTicketsCount}
                  </span>
                </button>

                <button
                  onClick={() => setCategoryFilter('klusjes')}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                    categoryFilter === 'klusjes'
                      ? 'bg-indigo-50 text-[#24126E] font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-slate-500" />
                    <span>Klusjes & Storingen</span>
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px]">
                    {activeTickets.length - horecaTicketsCount}
                  </span>
                </button>
              </nav>
            </div>

            {/* Status Filters */}
            <div>
              <label className="block text-[10px] font-bold text-indigo-900/50 uppercase tracking-widest mb-3">
                Status filter
              </label>
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-indigo-50 text-[#24126E] shadow-xs'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span>Alle actieve tickets</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px]">{activeTickets.length}</span>
                </button>

                <button
                  onClick={() => setStatusFilter('open')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    statusFilter === 'open'
                      ? 'bg-pink-50 text-[#D70096] font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D70096]"></span>
                    Nieuw / Open
                  </span>
                  <span className="bg-pink-100 text-[#D70096] font-bold px-2 py-0.5 rounded text-[10px]">{openCount}</span>
                </button>

                <button
                  onClick={() => setStatusFilter('in_behandeling')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    statusFilter === 'in_behandeling'
                      ? 'bg-indigo-100 text-[#24126E] font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#24126E]" />
                    In behandeling
                  </span>
                  <span className="bg-indigo-200/70 text-[#24126E] font-bold px-2 py-0.5 rounded text-[10px]">{inProgressCount}</span>
                </button>

                <button
                  onClick={() => setStatusFilter('wacht_op_onderdelen')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    statusFilter === 'wacht_op_onderdelen'
                      ? 'bg-amber-100 text-amber-900 font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    Wacht op onderdelen
                  </span>
                  <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">{waitingCount}</span>
                </button>

                <button
                  onClick={() => setStatusFilter('wachtlijst')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    statusFilter === 'wachtlijst'
                      ? 'bg-purple-100 text-purple-950 font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-700" />
                    Wachtlijst
                  </span>
                  <span className="bg-purple-200 text-purple-950 font-bold px-2 py-0.5 rounded text-[10px]">{waitlistCount}</span>
                </button>

                <button
                  onClick={() => setStatusFilter('afgerond')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    statusFilter === 'afgerond'
                      ? 'bg-emerald-100 text-emerald-900 font-bold shadow-xs'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Afgerond
                  </span>
                  <span className="bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px]">{completedCount}</span>
                </button>
              </nav>
            </div>

            {/* Admin archive promotion box */}
            {archivedTicketsCount > 0 && (
              <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 text-xs space-y-2 mt-auto">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Archive className="w-4 h-4 text-amber-700" />
                  <span>Archief ({archivedTicketsCount})</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Gearchiveerde tickets worden apart bewaard in het Beheerpaneel.
                </p>
                <button
                  onClick={handleSwitchToAdmin}
                  className="w-full py-1.5 px-3 bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-bold text-[11px] rounded-lg transition-colors cursor-pointer text-center"
                >
                  Naar beheerpaneel &rarr;
                </button>
              </div>
            )}
          </aside>

          {/* Main Tickets Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#F7F5FA] overflow-y-auto">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#24126E] flex items-center gap-2">
                  <span>Actieve Klussen & Tickets ({filteredTickets.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Klik op een ticket om de status bij te werken, notities toe te voegen of studenten en docenten toe te wijzen.
                </p>
              </div>

              {/* View Switcher: Grid vs List */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs self-start sm:self-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#24126E] text-white' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Rasterweergave"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list' ? 'bg-[#24126E] text-white' : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Lijstweergave"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Empty State */}
            {filteredTickets.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 max-w-md mx-auto my-8">
                <div className="w-14 h-14 bg-pink-50 text-[#D70096] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-[#24126E] mb-1">Geen actieve tickets gevonden</h4>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Er zijn geen servicetickets die voldoen aan de huidige filters of zoekopdracht.
                </p>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setStudentFilter('all');
                    setTeacherFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-[#24126E] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Alle filters wissen
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleOpenDetailModal(ticket)}
                    className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Top Bar: Ticket # & Status & Priority */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-mono font-bold text-[#24126E] bg-[#F7F5FA] px-2.5 py-1 rounded-lg border border-slate-100">
                          {ticket.ticketNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {getPriorityBadge(ticket.priority)}
                          {getStatusBadge(ticket.status)}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-base text-[#24126E] mb-2 line-clamp-2">
                        {ticket.title}
                      </h3>

                      {/* Horeca meal highlights */}
                      {(ticket.category === 'horeca' || (ticket.mealOrderItems && ticket.mealOrderItems.length > 0)) && (
                        <div className="mb-3 p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-950">
                            <span className="flex items-center gap-1">
                              <Utensils className="w-3 h-3 text-amber-600" />
                              <span>Horeca ({ticket.totalPortions || ticket.mealOrderItems?.reduce((s, i) => s + i.portions, 0)} porties)</span>
                            </span>
                            <span className="bg-amber-200/80 text-amber-950 px-1.5 py-0.2 rounded font-black text-[9px]">
                              {ticket.mealPickupTime ? `⏰ ${ticket.mealPickupTime}` : 'Balie'}
                            </span>
                          </div>
                          {ticket.mealOrderItems && ticket.mealOrderItems.length > 0 && (
                            <p className="text-[11px] font-bold text-amber-950 truncate">
                              {ticket.mealOrderItems.map(i => `${i.portions}x ${i.name}`).join(' • ')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                        {ticket.description}
                      </p>

                      {/* Photos thumbnail preview tag if present */}
                      {ticket.photos && ticket.photos.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D70096] bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                            <Camera className="w-3 h-3" />
                            {ticket.photos.length} foto(&apos;s) bijgevoegd
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="pt-3.5 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#D70096] shrink-0" />
                          <span className="truncate">
                            {ticket.location.toLowerCase().includes('blécourt') || ticket.location.toLowerCase().includes('blecourt')
                              ? ticket.location
                              : `Blécourtstraat • ${ticket.location}`}
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {ticket.createdAtFormatted}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 truncate">
                          Aanvrager: <strong className="text-[#24126E]">{ticket.requesterName}</strong> ({ticket.requesterTeam})
                        </span>
                        {ticket.desiredDate && (
                          <span className="text-[#D70096] font-semibold text-[10px]">
                            {formatDutchDate(ticket.desiredDate)}
                          </span>
                        )}
                      </div>

                      {/* Begeleidend Docent & Student Badges */}
                      <div className="space-y-1 pt-1">
                        {(ticket.assignedTeacher || ticket.assignedTo) && (
                          <div className="text-[10px] bg-slate-100 text-[#24126E] font-medium px-2 py-1 rounded-md flex items-center justify-between">
                            <div className="flex items-center gap-1 truncate">
                              <Briefcase className="w-3 h-3 text-[#24126E] shrink-0" />
                              <span className="truncate">
                                Docent: <strong>{ticket.assignedTeacher || ticket.assignedTo}</strong>
                              </span>
                            </div>
                          </div>
                        )}

                        {ticket.assignedStudent && (
                          <div className="text-[10px] bg-indigo-50/70 text-[#24126E] font-medium px-2 py-1 rounded-md flex items-center justify-between">
                            <div className="flex items-center gap-1 truncate">
                              <GraduationCap className="w-3 h-3 text-[#D70096] shrink-0" />
                              <span className="truncate">
                                Student: <strong>{ticket.assignedStudent}</strong>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => handleOpenDetailModal(ticket)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#24126E] shrink-0 mt-0.5">
                        <Wrench className="w-5 h-5 text-[#24126E]" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-[#24126E] bg-[#F7F5FA] px-2 py-0.5 rounded">
                            {ticket.ticketNumber}
                          </span>
                          <span className="font-bold text-sm sm:text-base text-[#24126E]">
                            {ticket.title}
                          </span>
                          {getPriorityBadge(ticket.priority)}
                          {ticket.photos && ticket.photos.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D70096] bg-pink-50 px-2 py-0.5 rounded">
                              <Camera className="w-3 h-3" /> {ticket.photos.length}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#D70096]" />
                            {ticket.location.toLowerCase().includes('blécourt') || ticket.location.toLowerCase().includes('blecourt')
                              ? ticket.location
                              : `Blécourtstraat • ${ticket.location}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {ticket.requesterName} ({ticket.requesterTeam})
                          </span>
                          {(ticket.assignedTeacher || ticket.assignedTo) && (
                            <span className="flex items-center gap-1 font-semibold text-[#24126E]">
                              <Briefcase className="w-3.5 h-3.5 text-[#24126E]" />
                              Docent: {ticket.assignedTeacher || ticket.assignedTo}
                            </span>
                          )}
                          {ticket.assignedStudent && (
                            <span className="flex items-center gap-1 font-semibold text-[#24126E]">
                              <GraduationCap className="w-3.5 h-3.5 text-[#D70096]" />
                              Student: {ticket.assignedStudent}
                            </span>
                          )}
                          <span className="text-slate-400 text-[11px]">
                            {ticket.createdAtFormatted}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {getStatusBadge(ticket.status)}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* TICKET DETAIL & STATUS MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-[#1F1735]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-black text-[#24126E] bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {selectedTicket.ticketNumber}
                  </span>
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <h3 className="text-xl font-bold text-[#24126E] tracking-tight">
                  {selectedTicket.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-download-bon-detail"
                  onClick={() => generateTicketReceiptPdf(selectedTicket)}
                  title="Bewaar aanvraagbon als PDF"
                  className="px-3 py-1.5 bg-[#D70096]/10 hover:bg-[#D70096] text-[#D70096] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-[#D70096]/20 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bewaar aanvraagbon</span>
                </button>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-8 h-8 rounded-full bg-[#F7F5FA] hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Details Card */}
            <div className="space-y-4">
              {/* Horeca meal order breakdown if present */}
              {selectedTicket.mealOrderItems && selectedTicket.mealOrderItems.length > 0 && (
                <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-amber-600" />
                      <span>Bestelde Gerechten ({selectedTicket.totalPortions || selectedTicket.mealOrderItems.reduce((s, i) => s + i.portions, 0)} porties)</span>
                    </span>
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                      📍 Uitgifte bij DV Balie
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {selectedTicket.mealOrderItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-amber-200/80 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                            {item.portions}x
                          </span>
                          <span className="font-bold text-slate-800">{item.name}</span>
                        </div>
                        {item.price && <span className="font-bold text-amber-900">{item.price}</span>}
                      </div>
                    ))}
                  </div>

                  {selectedTicket.mealPickupTime && (
                    <div className="text-xs text-amber-950 font-medium flex items-center gap-1.5 pt-1">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Gewenst afhaaltijdstip aan de balie: <strong>{selectedTicket.mealPickupTime}</strong></span>
                    </div>
                  )}

                  {selectedTicket.mealDietaryNotes && (
                    <div className="text-xs text-slate-700 bg-white/90 p-2.5 rounded-xl border border-amber-200/80">
                      <span className="font-bold text-amber-950 block text-[11px] mb-0.5">Dieetwensen / Opmerkingen:</span>
                      {selectedTicket.mealDietaryNotes}
                    </div>
                  )}
                </div>
              )}

              {/* Omschrijving block */}
              <div className="bg-[#F7F5FA] p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Omschrijving van het klusje
                </span>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Photos Gallery if any */}
              {selectedTicket.photos && selectedTicket.photos.length > 0 && (
                <div className="bg-[#F7F5FA] p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-[#24126E] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#D70096]" />
                    <span>Bijgevoegde foto&apos;s ({selectedTicket.photos.length})</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedTicket.photos.map((photo, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedPhotoPreview(photo)}
                        className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video group bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#F7F5FA] rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Locatie</span>
                  <span className="font-bold text-[#24126E] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D70096]" />
                    {selectedTicket.location.toLowerCase().includes('blécourt') || selectedTicket.location.toLowerCase().includes('blecourt')
                      ? selectedTicket.location
                      : `Blécourtstraat • ${selectedTicket.location}`}
                  </span>
                </div>

                <div className="p-3 bg-[#F7F5FA] rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Aanvrager & Team</span>
                  <span className="font-bold text-[#24126E]">{selectedTicket.requesterName}</span>
                  <span className="text-slate-500 block text-[11px]">{selectedTicket.requesterTeam}</span>
                </div>

                <div className="p-3 bg-[#F7F5FA] rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Aangemaakt op</span>
                  <span className="font-bold text-[#24126E]">{selectedTicket.createdAtFormatted}</span>
                  {selectedTicket.desiredDate && (
                    <span className="text-[#D70096] block text-[11px] font-medium mt-0.5">
                      Gewenste datum: {formatDutchDate(selectedTicket.desiredDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Action Workflow Buttons */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2.5">
                  Status bijwerken:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveStatusChange('in_behandeling')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedTicket.status === 'in_behandeling'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-50 text-[#24126E] hover:bg-indigo-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>In behandeling nemen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveStatusChange('wacht_op_onderdelen')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedTicket.status === 'wacht_op_onderdelen'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Wacht op onderdelen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveStatusChange('wachtlijst')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedTicket.status === 'wachtlijst'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Wachtlijst</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveStatusChange('afgerond')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedTicket.status === 'afgerond'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Afronden (Gereed)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveStatusChange('open')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      selectedTicket.status === 'open'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'bg-pink-50 text-[#D70096] hover:bg-pink-100'
                    }`}
                  >
                    <span>Heropenen als nieuw</span>
                  </button>
                </div>
              </div>

              {/* Toewijzing aan Begeleidend Docent & Student */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Begeleidend Docent Select */}
                  <div>
                    <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-[#24126E]" />
                      <span>Begeleidend docent:</span>
                    </label>
                    <select
                      value={assignedTeacher}
                      onChange={(e) => setAssignedTeacher(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] cursor-pointer"
                    >
                      <option value="">-- Geen docent gekoppeld --</option>
                      {teachers.filter(t => t.active).map(t => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student Select */}
                  <div>
                    <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-[#D70096]" />
                      <span>Toegewezen aan student:</span>
                    </label>
                    <select
                      value={assignedStudent}
                      onChange={(e) => setAssignedStudent(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096] cursor-pointer"
                    >
                      <option value="">-- Geen student gekoppeld --</option>
                      {students.filter(s => s.active).map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1">
                    Servicenotities / Oplossing
                  </label>
                  <textarea
                    rows={3}
                    value={statusUpdateNotes}
                    onChange={(e) => setStatusUpdateNotes(e.target.value)}
                    placeholder="Voeg eventuele opmerkingen, bevindingen of details van de reparatie/klus toe..."
                    className="w-full px-3.5 py-2 bg-[#F7F5FA] rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2.5 rounded-xl bg-[#F7F5FA] hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Sluiten
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedTicket) {
                    onUpdateTicketStatus(selectedTicket.id, selectedTicket.status, statusUpdateNotes, assignedTeacher, assignedStudent, assignedTeacher);
                    setSelectedTicket(null);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Gegevens opslaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {selectedPhotoPreview && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] p-2" onClick={e => e.stopPropagation()}>
            <img
              src={selectedPhotoPreview}
              alt="Vergrootte weergave"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* SUBMISSION SUCCESS MODAL */}
      {submittedTicket && (
        <div className="fixed inset-0 z-50 bg-[#1F1735]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="inline-block text-xs font-bold text-[#D70096] uppercase tracking-wider bg-pink-50 px-3 py-1 rounded-full mb-2">
              Klusje succesvol geregistreerd
            </span>

            <h3 className="text-2xl font-bold text-[#24126E] mb-2">
              Ticket {submittedTicket.ticketNumber} aangemaakt!
            </h3>

            <div className="bg-[#F7F5FA] border border-slate-100 rounded-2xl p-4 my-4 text-left space-y-2 text-xs">
              <p className="font-semibold text-[#24126E]">
                Aanvraag ingediend door <span className="text-[#D70096]">{submittedTicket.requesterName}</span> van <span className="text-[#D70096]">{submittedTicket.requesterTeam}</span>.
              </p>
              <div className="pt-2 border-t border-slate-200/80 text-slate-500">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Locatie</span>
                <span className="font-bold text-[#24126E]">
                  {submittedTicket.location.toLowerCase().includes('blécourt') || submittedTicket.location.toLowerCase().includes('blecourt')
                    ? submittedTicket.location
                    : `Blécourtstraat • ${submittedTicket.location}`}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Het serviceteam van Summa Plus heeft jouw ticket ontvangen en neemt de klus zo spoedig mogelijk in behandeling.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                id="btn-download-bon-submit-modal"
                onClick={() => generateTicketReceiptPdf(submittedTicket)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#D70096] hover:bg-[#B5007E] active:scale-95 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Bewaar aanvraagbon</span>
              </button>
              <button
                onClick={() => {
                  setSubmittedTicket(null);
                  setActiveTab('overview');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] active:scale-95 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Bekijk in overzicht
              </button>
              <button
                onClick={() => setSubmittedTicket(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F7F5FA] hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors border border-slate-200/80 cursor-pointer"
              >
                Nog een klusje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PIN SCREEN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-60 bg-[#1F1735]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-[#24126E] mb-1">
              Beheerder Toegang
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Voer de 6-cijferige pincode in om naar het Service Beheerpaneel te gaan.
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-4" autoComplete="off">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  placeholder="••••••"
                  className="w-full text-center text-2xl tracking-widest font-mono font-bold py-3 bg-[#F7F5FA] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                />
                {pinError ? (
                  <p className="text-xs text-red-600 mt-2 font-medium">{pinError}</p>
                ) : pinVerifying ? (
                  <p className="text-[11px] text-slate-400 mt-2">Controleren...</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-2">&nbsp;</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                    setPinError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#F7F5FA] hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={pinVerifying}
                  className="flex-1 py-2.5 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  Inloggen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Link Modal for Colleagues */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onOpenPublicView={() => {
          if (onOpenPublicLinkView) {
            onOpenPublicLinkView();
          }
        }}
      />

      {/* Weekmenu & Portiebeheer Modal */}
      <MenuManagementModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        menuItems={currentMenuItems}
        tickets={tickets}
        onSaveMenuItems={handleUpdateMenuItems}
      />
    </div>
  );
};
