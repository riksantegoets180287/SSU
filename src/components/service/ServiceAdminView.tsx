import React, { useState, useMemo } from 'react';
import { 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Search, 
  Filter, 
  Users, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  Tv, 
  Building2, 
  Armchair, 
  Wrench, 
  Sparkles, 
  Tag, 
  Plus, 
  ShieldCheck, 
  ArrowLeft,
  Calendar,
  MapPin,
  User,
  Eye,
  RefreshCw,
  FileDown,
  Utensils
} from 'lucide-react';
import { ServiceTicket, StudentWorker, SupervisingTeacher, TicketCategory, TicketPriority, TicketStatus, MenuItem } from '../../types';
import { formatDutchDate, formatDutchDateTime } from '../../lib/storage';
import { StudentManagementTab } from '../admin/StudentManagementTab';
import { TeacherManagementTab } from '../admin/TeacherManagementTab';
import { AdminMenuManagementTab } from '../admin/AdminMenuManagementTab';
import { generateTicketReceiptPdf } from '../../utils/ticketReceiptPdf';

interface ServiceAdminViewProps {
  tickets: ServiceTicket[];
  students: StudentWorker[];
  teachers: SupervisingTeacher[];
  menuItems?: MenuItem[];
  onSaveMenuItems?: (items: MenuItem[]) => void;
  onArchiveTicket: (ticketId: string) => void;
  onUnarchiveTicket: (ticketId: string) => void;
  onDeleteTicket: (ticketId: string) => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus, notes?: string, assignedTo?: string, assignedStudent?: string) => void;
  onAddStudent: (student: Omit<StudentWorker, 'id'>) => void;
  onDeleteStudent: (studentId: string) => void;
  onToggleStudentActive: (studentId: string) => void;
  onAddTeacher: (teacher: Omit<SupervisingTeacher, 'id'>) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onToggleTeacherActive: (teacherId: string) => void;
  onSwitchToDesk: () => void;
  onBackToPortal: () => void;
}

export const ServiceAdminView: React.FC<ServiceAdminViewProps> = ({
  tickets,
  students,
  teachers,
  menuItems,
  onSaveMenuItems,
  onArchiveTicket,
  onUnarchiveTicket,
  onDeleteTicket,
  onAddStudent,
  onDeleteStudent,
  onToggleStudentActive,
  onAddTeacher,
  onDeleteTeacher,
  onToggleTeacherActive,
  onSwitchToDesk,
  onBackToPortal,
}) => {
  const [adminTab, setAdminTab] = useState<'tickets_archive' | 'students' | 'teachers' | 'menu'>('tickets_archive');
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');

  const activeTicketsCount = tickets.filter(t => !t.archived).length;
  const archivedTicketsCount = tickets.filter(t => t.archived).length;
  const completedUnarchivedCount = tickets.filter(t => !t.archived && t.status === 'afgerond').length;

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Archive filter
      if (archiveFilter === 'active' && ticket.archived) return false;
      if (archiveFilter === 'archived' && !ticket.archived) return false;

      // Status filter
      if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;

      // Teacher filter
      if (teacherFilter !== 'all') {
        const tName = ticket.assignedTeacher || ticket.assignedTo;
        if (teacherFilter === 'unassigned' && tName) return false;
        if (teacherFilter !== 'unassigned' && tName !== teacherFilter) return false;
      }

      // Student filter
      if (studentFilter !== 'all') {
        if (studentFilter === 'unassigned' && ticket.assignedStudent) return false;
        if (studentFilter !== 'unassigned' && ticket.assignedStudent !== studentFilter) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ticket.title.toLowerCase().includes(q);
        const matchDesc = ticket.description.toLowerCase().includes(q);
        const matchNum = ticket.ticketNumber.toLowerCase().includes(q);
        const matchReq = ticket.requesterName.toLowerCase().includes(q);
        const matchLoc = ticket.location.toLowerCase().includes(q);
        const matchTeacher = (ticket.assignedTeacher || ticket.assignedTo)?.toLowerCase().includes(q);
        const matchStudent = ticket.assignedStudent?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchNum || matchReq || matchLoc || matchTeacher || matchStudent;
      }

      return true;
    });
  }, [tickets, archiveFilter, statusFilter, teacherFilter, studentFilter, searchQuery]);

  const getCategoryIcon = (category: TicketCategory) => {
    switch (category) {
      case 'ict_av': return <Tv className="w-3.5 h-3.5" />;
      case 'facilitair': return <Building2 className="w-3.5 h-3.5" />;
      case 'meubilair': return <Armchair className="w-3.5 h-3.5" />;
      case 'reparatie': return <Wrench className="w-3.5 h-3.5" />;
      case 'evenement': return <Sparkles className="w-3.5 h-3.5" />;
      default: return <Tag className="w-3.5 h-3.5" />;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'spoed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">Spoed</span>;
      case 'hoog':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">Hoog</span>;
      case 'normaal':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-[#24126E]">Normaal</span>;
      case 'laag':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">Laag</span>;
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-pink-50 text-[#D70096] border border-pink-200">Open</span>;
      case 'in_behandeling':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-[#24126E]">In behandeling</span>;
      case 'wacht_op_onderdelen':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900">Onderdelen</span>;
      case 'wachtlijst':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-900">Wachtlijst</span>;
      case 'afgerond':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">Afgerond</span>;
      case 'geannuleerd':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">Geannuleerd</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#24126E] bg-indigo-50 px-3 py-1 rounded-full mb-2 border border-indigo-100 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D70096]" />
            Servicesysteem Beheer &bull; Admin Paneel
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#24126E] tracking-tight">
            Servicebeheer, Archief & Begeleiding
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Archiveer voltooide tickets van het baliedashboard en beheer nieuwe studenten en begeleidende docenten.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onSwitchToDesk}
            className="text-xs font-bold text-slate-700 hover:text-[#24126E] bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Naar Baliemedewerker Kant</span>
          </button>
          <button
            onClick={onBackToPortal}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white hover:bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/80 transition-colors cursor-pointer"
            title="Naar Hoofdmenu"
          >
            Hoofdmenu
          </button>
        </div>
      </div>

      {/* Quick KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
            Actief op Balie
          </span>
          <div className="text-2xl font-black text-[#24126E] flex items-baseline gap-1.5">
            {activeTicketsCount}
            <span className="text-xs font-semibold text-slate-400">tickets</span>
          </div>
          {completedUnarchivedCount > 0 && (
            <span className="text-[11px] text-amber-600 font-semibold block mt-1">
              {completedUnarchivedCount} afgerond (klaar voor archief)
            </span>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
            Gearchiveerd
          </span>
          <div className="text-2xl font-black text-slate-600 flex items-baseline gap-1.5">
            {archivedTicketsCount}
            <span className="text-xs font-semibold text-slate-400">tickets</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Niet op actieve balie</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
            Studenten
          </span>
          <div className="text-2xl font-black text-[#D70096] flex items-baseline gap-1.5">
            {students.length}
            <span className="text-xs font-semibold text-slate-400">actief</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">In praktijktraject</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
            Begeleidend Docenten
          </span>
          <div className="text-2xl font-black text-[#24126E] flex items-baseline gap-1.5">
            {teachers.length}
            <span className="text-xs font-semibold text-slate-400">docenten</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Vakgroepen & toezicht</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setAdminTab('tickets_archive')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'tickets_archive'
              ? 'border-[#24126E] text-[#24126E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Archive className="w-4 h-4 text-[#D70096]" />
          <span>Tickets & Archiefbeheer ({tickets.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('teachers')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'teachers'
              ? 'border-[#24126E] text-[#24126E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4 text-[#24126E]" />
          <span>Begeleidende Docenten ({teachers.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('students')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            adminTab === 'students'
              ? 'border-[#24126E] text-[#24126E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-[#D70096]" />
          <span>Studenten ({students.length})</span>
        </button>

        {menuItems && onSaveMenuItems && (
          <button
            onClick={() => setAdminTab('menu')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              adminTab === 'menu'
                ? 'border-[#24126E] text-[#24126E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-600" />
            <span>Weekmenu & Porties</span>
          </button>
        )}
      </div>

      {/* TAB CONTENT: TICKETS & ARCHIVE */}
      {adminTab === 'tickets_archive' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Controls bar */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Archive View Pills */}
              <div className="inline-flex p-1 bg-[#F7F5FA] rounded-2xl border border-slate-200/80 self-start">
                <button
                  onClick={() => setArchiveFilter('active')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    archiveFilter === 'active'
                      ? 'bg-[#24126E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#24126E]'
                  }`}
                >
                  Actief op Balie ({activeTicketsCount})
                </button>
                <button
                  onClick={() => setArchiveFilter('archived')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    archiveFilter === 'archived'
                      ? 'bg-[#24126E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#24126E]'
                  }`}
                >
                  📦 Gearchiveerd ({archivedTicketsCount})
                </button>
                <button
                  onClick={() => setArchiveFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    archiveFilter === 'all'
                      ? 'bg-[#24126E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#24126E]'
                  }`}
                >
                  Alle ({tickets.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek op nummer, titel, aanvrager, lokaal..."
                  className="w-full pl-9 pr-4 py-2.5 bg-[#F7F5FA] rounded-2xl border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#24126E]"
                />
              </div>
            </div>

            {/* Dropdown filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#F7F5FA] px-3 py-2 rounded-xl border border-slate-200/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#24126E]"
              >
                <option value="all">Alle statussen</option>
                <option value="open">Nieuw / Open</option>
                <option value="in_behandeling">In behandeling</option>
                <option value="wacht_op_onderdelen">Wacht op onderdelen</option>
                <option value="wachtlijst">Wachtlijst</option>
                <option value="afgerond">Afgerond</option>
                <option value="geannuleerd">Geannuleerd</option>
              </select>

              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="bg-[#F7F5FA] px-3 py-2 rounded-xl border border-slate-200/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#24126E]"
              >
                <option value="all">Alle begeleidend docenten</option>
                <option value="unassigned">Geen docent toegewezen</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>

              <select
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                className="bg-[#F7F5FA] px-3 py-2 rounded-xl border border-slate-200/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#24126E]"
              >
                <option value="all">Alle studenten</option>
                <option value="unassigned">Geen student gekoppeld</option>
                {students.map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tickets List Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center">
                <Archive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 mb-1">Geen tickets gevonden</h3>
                <p className="text-xs text-slate-400">
                  {archiveFilter === 'archived'
                    ? 'Er staan momenteel geen gearchiveerde tickets in het archief.'
                    : 'Geen tickets die voldoen aan de huidige zoekfilters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-[#F7F5FA] text-[#24126E] font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Ticket</th>
                      <th className="py-3.5 px-4">Klus / Beschrijving</th>
                      <th className="py-3.5 px-4">Locatie & Aanvrager</th>
                      <th className="py-3.5 px-4">Begeleidend Docent</th>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Archief Acties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTickets.map(ticket => {
                      const teacherName = ticket.assignedTeacher || ticket.assignedTo;
                      return (
                        <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Ticket Number */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <div className="font-mono font-extrabold text-[#24126E] text-xs">
                              {ticket.ticketNumber}
                            </div>
                            <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
                          </td>

                          {/* Title & Desc */}
                          <td className="py-3.5 px-4 align-top max-w-xs">
                            <div className="font-bold text-slate-900 text-xs line-clamp-1 mb-1">
                              {ticket.title}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              {ticket.description}
                            </div>
                            {ticket.resolutionNotes && (
                              <div className="mt-1.5 p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-800">
                                <strong>Oplossing:</strong> {ticket.resolutionNotes}
                              </div>
                            )}
                          </td>

                          {/* Location & Requester */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <MapPin className="w-3.5 h-3.5 text-[#D70096]" />
                              <span>
                                {ticket.location.toLowerCase().includes('blécourt') || ticket.location.toLowerCase().includes('blecourt')
                                  ? ticket.location
                                  : `Blécourtstraat • ${ticket.location}`}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1 font-semibold">
                              {ticket.requesterName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {ticket.requesterTeam}
                            </div>
                          </td>

                          {/* Supervising Teacher */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            {teacherName ? (
                              <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-[#24126E] px-2.5 py-1 rounded-xl text-[11px] font-bold border border-indigo-100">
                                <Briefcase className="w-3 h-3 text-[#24126E]" />
                                <span>{teacherName}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Geen docent</span>
                            )}
                          </td>

                          {/* Student */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            {ticket.assignedStudent ? (
                              <div className="inline-flex items-center gap-1.5 bg-pink-50 text-[#D70096] px-2.5 py-1 rounded-xl text-[11px] font-bold border border-pink-100">
                                <GraduationCap className="w-3 h-3 text-[#D70096]" />
                                <span>{ticket.assignedStudent}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Geen student</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <div>{getStatusBadge(ticket.status)}</div>
                            <div className="text-[10px] text-slate-400 mt-1.5">
                              {ticket.createdAtFormatted}
                            </div>
                            {ticket.archived && (
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1">
                                <Archive className="w-2.5 h-2.5" /> Gearchiveerd
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => generateTicketReceiptPdf(ticket)}
                                className="p-1.5 text-[#D70096] hover:text-[#B5007E] hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
                                title="Bewaar aanvraagbon (PDF download)"
                              >
                                <FileDown className="w-4 h-4" />
                              </button>

                              {!ticket.archived ? (
                                <button
                                  onClick={() => onArchiveTicket(ticket.id)}
                                  className="px-3 py-1.5 bg-[#24126E] hover:bg-[#1a0c52] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                  title="Ticket verplaatsen naar het archief (verdwijnt van actieve baliedashboard)"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  <span>Archiveren</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onUnarchiveTicket(ticket.id)}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                  title="Ticket terughalen naar het actieve baliedashboard"
                                >
                                  <ArchiveRestore className="w-3.5 h-3.5" />
                                  <span>Terugzetten</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  if (confirm(`Weet je zeker dat je ticket ${ticket.ticketNumber} definitief wilt verwijderen?`)) {
                                    onDeleteTicket(ticket.id);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                title="Definitief verwijderen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SUPERVISING TEACHERS */}
      {adminTab === 'teachers' && (
        <TeacherManagementTab
          teachers={teachers}
          tickets={tickets}
          onAddTeacher={onAddTeacher}
          onDeleteTeacher={onDeleteTeacher}
          onToggleTeacherActive={onToggleTeacherActive}
        />
      )}

      {/* TAB CONTENT: STUDENTS */}
      {adminTab === 'students' && (
        <StudentManagementTab
          students={students}
          tickets={tickets}
          onAddStudent={onAddStudent}
          onDeleteStudent={onDeleteStudent}
          onToggleStudentActive={onToggleStudentActive}
        />
      )}

      {/* TAB CONTENT: WEEKMENU & PORTIES */}
      {adminTab === 'menu' && menuItems && onSaveMenuItems && (
        <AdminMenuManagementTab
          menuItems={menuItems}
          onSaveMenuItems={onSaveMenuItems}
          tickets={tickets}
        />
      )}
    </div>
  );
};
