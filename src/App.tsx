import React, { useState, useEffect } from 'react';
import { 
  AppView, 
  Category, 
  Material, 
  Loan, 
  BorrowerSession, 
  ServiceTicket, 
  MainSystemModule, 
  TicketStatus,
  StudentWorker,
  SupervisingTeacher,
  LoanReturnCondition,
  MenuItem
} from './types';
import { 
  getStoredCategories, 
  saveCategories, 
  getStoredMaterials, 
  saveMaterials, 
  getStoredLoans, 
  saveLoans, 
  getStoredTickets, 
  saveTickets, 
  getStoredStudents,
  saveStudents,
  getStoredTeachers,
  saveTeachers,
  getStoredMenuItems,
  saveMenuItems,
  getStoredSession, 
  saveSession, 
  calculateAvailableQuantity, 
  getDutchCurrentDateTime, 
  formatDutchDateTime, 
  resetToSeedData, 
  INITIAL_CATEGORIES, 
  INITIAL_MATERIALS, 
  INITIAL_TICKETS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS
} from './lib/storage';
import { Header } from './components/Header';
import { MainPortal } from './components/MainPortal';
import { RoleSelect } from './components/RoleSelect';
import { UserRegister } from './components/UserRegister';
import { UserCatalog } from './components/UserCatalog';
import { BalieLendingView } from './components/desk/BalieLendingView';
import { AdminPinScreen } from './components/AdminPinScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { ServicePortal } from './components/service/ServicePortal';
import { PublicServiceRequestForm } from './components/service/PublicServiceRequestForm';
import { HorecaPortal } from './components/horeca/HorecaPortal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState<MainSystemModule>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (search.includes('module=horeca') || hash.includes('horeca')) return 'horeca';
      if (search.includes('module=service') || hash.includes('service')) return 'service';
      if (search.includes('module=uitleen') || hash.includes('uitleen')) return 'uitleen';
    }
    return 'portal';
  });
  const [currentView, setCurrentView] = useState<AppView>('role_select');
  const [userSession, setUserSession] = useState<BorrowerSession | null>(null);
  
  // Public request mode for colleagues opening via external link
  const [isPublicRequestMode, setIsPublicRequestMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      return search.includes('form=klusje') || search.includes('mode=aanvragen') || search.includes('view=service_form') || hash.includes('klusje') || hash.includes('aanvragen');
    }
    return false;
  });
  
  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [students, setStudents] = useState<StudentWorker[]>([]);
  const [teachers, setTeachers] = useState<SupervisingTeacher[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Initialize from storage on mount
  useEffect(() => {
    const loadedCategories = getStoredCategories();
    const loadedMaterials = getStoredMaterials();
    const loadedLoans = getStoredLoans();
    const loadedTickets = getStoredTickets();
    const loadedStudents = getStoredStudents();
    const loadedTeachers = getStoredTeachers();
    const loadedMenuItems = getStoredMenuItems();
    const loadedSession = getStoredSession();

    setCategories(loadedCategories);
    setMaterials(loadedMaterials);
    setLoans(loadedLoans);
    setTickets(loadedTickets);
    setStudents(loadedStudents);
    setTeachers(loadedTeachers);
    setMenuItems(loadedMenuItems);
    if (loadedSession) {
      setUserSession(loadedSession);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Switch between Portal, Uitleen, and Service
  const handleSwitchModule = (module: MainSystemModule) => {
    setActiveModule(module);
    if (module === 'uitleen') {
      setCurrentView('role_select');
    }
  };

  // User Registration Flow in Uitleensysteem
  const handleUserRegisterComplete = (session: BorrowerSession) => {
    setUserSession(session);
    saveSession(session);
    setCurrentView('user_catalog');
  };

  const handleResetUserSession = () => {
    setUserSession(null);
    saveSession(null);
    setCurrentView('user_register');
  };

  // Borrow Action
  const handleBorrow = (
    material: Material, 
    quantity: number
  ): { success: boolean; loan?: Loan; error?: string } => {
    if (!userSession) {
      return { success: false, error: 'Geen actieve gebruiker geregistreerd.' };
    }

    const available = calculateAvailableQuantity(material, loans);
    if (quantity <= 0) {
      return { success: false, error: 'Aantal moet minimaal 1 zijn.' };
    }
    if (quantity > available) {
      return { success: false, error: `Er zijn slechts ${available} stuks beschikbaar.` };
    }

    const category = categories.find(c => c.id === material.categoryId);
    const { dateStr, timeStr } = getDutchCurrentDateTime();

    const newLoan: Loan = {
      id: `loan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      materialId: material.id,
      materialName: material.name,
      categoryName: category?.name || 'Onbekend',
      borrowerName: userSession.name,
      borrowerTeam: userSession.team,
      quantity,
      borrowedAtDate: dateStr,
      borrowedAtTime: timeStr,
      status: 'uitgeleend',
    };

    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    return { success: true, loan: newLoan };
  };

  // Balie Desk Borrow Action (Direct checkout by Baliemedewerker)
  const handleDeskBorrow = (
    material: Material,
    quantity: number,
    borrowerName: string,
    borrowerTeam: string
  ): { success: boolean; loan?: Loan; error?: string } => {
    const available = calculateAvailableQuantity(material, loans);
    if (quantity <= 0) {
      return { success: false, error: 'Aantal moet minimaal 1 zijn.' };
    }
    if (quantity > available) {
      return { success: false, error: `Er zijn slechts ${available} stuks beschikbaar.` };
    }

    const category = categories.find(c => c.id === material.categoryId);
    const { dateStr, timeStr } = getDutchCurrentDateTime();

    const newLoan: Loan = {
      id: `loan-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      materialId: material.id,
      materialName: material.name,
      categoryName: category?.name || 'Onbekend',
      borrowerName: borrowerName.trim(),
      borrowerTeam: borrowerTeam.trim(),
      quantity,
      borrowedAtDate: dateStr,
      borrowedAtTime: timeStr,
      status: 'uitgeleend',
    };

    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);
    saveLoans(updatedLoans);
    showToast(`${quantity}x "${material.name}" uitgeleend aan ${borrowerName}.`, 'success');

    return { success: true, loan: newLoan };
  };

  // Return Loan Action with Condition & Partial Return Support
  const handleReturnLoan = (
    loanId: string, 
    condition: LoanReturnCondition = 'goed', 
    notes?: string,
    createServiceTicket?: boolean,
    returnQuantity?: number
  ) => {
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    const qtyToReturn = returnQuantity && returnQuantity > 0 ? Math.min(returnQuantity, targetLoan.quantity) : targetLoan.quantity;
    const isPartial = qtyToReturn < targetLoan.quantity;

    let updatedLoans: Loan[];

    if (isPartial) {
      // Create a returned entry for the partial amount
      const returnedLoanRecord: Loan = {
        ...targetLoan,
        id: `loan-${Date.now()}-ret-${Math.random().toString(36).substr(2, 4)}`,
        quantity: qtyToReturn,
        status: 'teruggebracht' as const,
        returnedAt: new Date().toISOString(),
        conditionAtReturn: condition,
        returnNotes: notes ? `[Deelinname ${qtyToReturn}x] ${notes}` : `[Deelinname ${qtyToReturn}x]`,
      };

      // Keep original loan with reduced remaining quantity
      updatedLoans = loans.map((loan) => {
        if (loan.id === loanId) {
          return {
            ...loan,
            quantity: loan.quantity - qtyToReturn,
          };
        }
        return loan;
      });

      updatedLoans = [returnedLoanRecord, ...updatedLoans];
    } else {
      // Full return of this loan item
      updatedLoans = loans.map((loan) => {
        if (loan.id === loanId) {
          return {
            ...loan,
            status: 'teruggebracht' as const,
            returnedAt: new Date().toISOString(),
            conditionAtReturn: condition,
            returnNotes: notes,
          };
        }
        return loan;
      });
    }

    setLoans(updatedLoans);
    saveLoans(updatedLoans);

    // If defect and automatically creating a service ticket
    if (createServiceTicket) {
      handleAddTicket({
        title: `Defect geretourneerd (${qtyToReturn}x): ${targetLoan.materialName}`,
        description: `Ingenomen van lener ${targetLoan.borrowerName} (${targetLoan.borrowerTeam}). Aantal: ${qtyToReturn}x. Conditie: ${condition}. Toelichting: ${notes || 'Geen toelichting'}.`,
        category: 'reparatie',
        priority: 'hoog',
        location: 'Summa Plus Balie & Uitgiftelocatie',
        requesterName: targetLoan.borrowerName,
        requesterTeam: targetLoan.borrowerTeam,
        status: 'open',
      });
      showToast(`${qtyToReturn}x "${targetLoan.materialName}" ingenomen met status "${condition}". Serviceticket aangemaakt!`, 'info');
    } else {
      if (isPartial) {
        showToast(`${qtyToReturn}x "${targetLoan.materialName}" ingenomen (${targetLoan.quantity - qtyToReturn}x blijft nog uitgeleend).`, 'success');
      } else {
        showToast(`${qtyToReturn}x "${targetLoan.materialName}" succesvol ingenomen.`, 'success');
      }
    }
  };

  // Admin Materials Management
  const handleAddMaterial = (data: Omit<Material, 'id' | 'createdAt'>) => {
    const newMaterial: Material = {
      ...data,
      id: `mat-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...materials, newMaterial];
    setMaterials(updated);
    saveMaterials(updated);
    showToast(`Materiaal "${newMaterial.name}" succesvol toegevoegd.`, 'success');
  };

  const handleEditMaterial = (updatedMaterial: Material) => {
    const updated = materials.map(m => m.id === updatedMaterial.id ? updatedMaterial : m);
    setMaterials(updated);
    saveMaterials(updated);
    showToast(`Materiaal "${updatedMaterial.name}" succesvol bijgewerkt.`, 'success');
  };

  const handleUpdateMaterialBarcode = (materialId: string, barcode: string) => {
    const updated = materials.map(m => m.id === materialId ? { ...m, optionalBarcode: barcode } : m);
    setMaterials(updated);
    saveMaterials(updated);
    showToast('Barcode succesvol bijgewerkt.', 'success');
  };

  const handleDeleteMaterial = (materialId: string) => {
    const target = materials.find(m => m.id === materialId);
    const updated = materials.filter(m => m.id !== materialId);
    setMaterials(updated);
    saveMaterials(updated);
    showToast(`Materiaal "${target?.name || 'Item'}" verwijderd.`, 'info');
  };

  const handleResetToStandardMaterials = () => {
    setMaterials(INITIAL_MATERIALS);
    saveMaterials(INITIAL_MATERIALS);
    setCategories(INITIAL_CATEGORIES);
    saveCategories(INITIAL_CATEGORIES);
    setLoans([]);
    saveLoans([]);
    showToast('Uitleensysteem succesvol gereset naar de 19 producten.', 'success');
  };

  // Admin Categories Management
  const handleAddCategory = (name: string) => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategories(updated);
    showToast(`Categorie "${name}" aangemaakt.`, 'success');
  };

  const handleEditCategory = (updatedCategory: Category) => {
    const updated = categories.map(c => c.id === updatedCategory.id ? updatedCategory : c);
    setCategories(updated);
    saveCategories(updated);
    showToast(`Categorie "${updatedCategory.name}" bijgewerkt.`, 'success');
  };

  const handleDeleteCategory = (categoryId: string) => {
    const linked = materials.filter(m => m.categoryId === categoryId);
    if (linked.length > 0) {
      showToast(`Kan categorie niet verwijderen: ${linked.length} materialen gekoppeld.`, 'error');
      return;
    }
    const updated = categories.filter(c => c.id !== categoryId);
    setCategories(updated);
    saveCategories(updated);
    showToast('Categorie verwijderd.', 'info');
  };

  // Students Management
  const handleAddStudent = (studentData: Omit<StudentWorker, 'id'>) => {
    const newStudent: StudentWorker = {
      ...studentData,
      id: `std-${Date.now()}`,
    };
    const updated = [...students, newStudent];
    setStudents(updated);
    saveStudents(updated);
    showToast(`Student "${newStudent.name}" toegevoegd aan leerteam.`, 'success');
  };

  const handleDeleteStudent = (studentId: string) => {
    const updated = students.filter(s => s.id !== studentId);
    setStudents(updated);
    saveStudents(updated);
    showToast('Student verwijderd.', 'info');
  };

  const handleToggleStudentActive = (studentId: string) => {
    const updated = students.map(s => s.id === studentId ? { ...s, active: !s.active } : s);
    setStudents(updated);
    saveStudents(updated);
  };

  // Supervising Teachers Management
  const handleAddTeacher = (teacherData: Omit<SupervisingTeacher, 'id'>) => {
    const newTeacher: SupervisingTeacher = {
      ...teacherData,
      id: `tch-${Date.now()}`,
    };
    const updated = [...teachers, newTeacher];
    setTeachers(updated);
    saveTeachers(updated);
    showToast(`Begeleidend docent "${newTeacher.name}" toegevoegd.`, 'success');
  };

  const handleDeleteTeacher = (teacherId: string) => {
    const updated = teachers.filter(t => t.id !== teacherId);
    setTeachers(updated);
    saveTeachers(updated);
    showToast('Begeleidend docent verwijderd.', 'info');
  };

  const handleToggleTeacherActive = (teacherId: string) => {
    const updated = teachers.map(t => t.id === teacherId ? { ...t, active: !t.active } : t);
    setTeachers(updated);
    saveTeachers(updated);
  };

  // Service Tickets Management
  const handleAddTicket = (
    ticketData: Omit<ServiceTicket, 'id' | 'ticketNumber' | 'createdAt' | 'createdAtFormatted'>
  ): ServiceTicket => {
    const nextNumber = 1045 + tickets.length;
    const now = new Date();
    const formatted = formatDutchDateTime(now.toISOString());

    const newTicket: ServiceTicket = {
      ...ticketData,
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-${nextNumber}`,
      createdAt: now.toISOString(),
      createdAtFormatted: formatted,
      archived: false,
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    saveTickets(updated);
    showToast(`Klusje aangemeld als ticket #${newTicket.ticketNumber}!`, 'success');
    return newTicket;
  };

  const handleUpdateTicketStatus = (
    ticketId: string, 
    newStatus: TicketStatus, 
    notes?: string, 
    assignedTo?: string,
    assignedStudent?: string,
    assignedTeacher?: string
  ) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        const teacherVal = assignedTeacher !== undefined ? assignedTeacher : (assignedTo !== undefined ? assignedTo : t.assignedTeacher || t.assignedTo);
        return {
          ...t,
          status: newStatus,
          resolutionNotes: notes !== undefined ? notes : t.resolutionNotes,
          assignedTo: teacherVal,
          assignedTeacher: teacherVal,
          assignedStudent: assignedStudent !== undefined ? assignedStudent : t.assignedStudent,
          completedAt: newStatus === 'afgerond' ? new Date().toISOString() : t.completedAt,
        };
      }
      return t;
    });

    setTickets(updated);
    saveTickets(updated);
    showToast('Ticketstatus succesvol bijgewerkt.', 'success');
  };

  const handleArchiveTicket = (ticketId: string) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          archived: true,
          archivedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    setTickets(updated);
    saveTickets(updated);
    showToast('Ticket gearchiveerd en van actief dashboard verwijderd.', 'info');
  };

  const handleUnarchiveTicket = (ticketId: string) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          archived: false,
          archivedAt: undefined,
        };
      }
      return t;
    });
    setTickets(updated);
    saveTickets(updated);
    showToast('Ticket hersteld naar actief dashboard.', 'success');
  };

  const handleDeleteTicket = (ticketId: string) => {
    const updated = tickets.filter(t => t.id !== ticketId);
    setTickets(updated);
    saveTickets(updated);
    showToast('Ticket definitief verwijderd.', 'info');
  };

  const handleSaveMenuItems = (newItems: MenuItem[]) => {
    setMenuItems(newItems);
    saveMenuItems(newItems);
    showToast('Weekmenu en portielimieten succesvol opgeslagen.', 'success');
  };

  // Categorization helpers for tickets
  const isHorecaTicket = (ticket: ServiceTicket) => {
    return ticket.category === 'horeca' || (Array.isArray(ticket.mealOrderItems) && ticket.mealOrderItems.length > 0);
  };

  const isMeetingTicket = (ticket: ServiceTicket) => {
    if (isHorecaTicket(ticket)) return false;
    const title = (ticket.title || '').toLowerCase();
    const desc = (ticket.description || '').toLowerCase();
    return (
      ticket.category === 'evenement' ||
      title.includes('vergader') ||
      desc.includes('vergaderruimte') ||
      desc.includes('gewenste opstelling') ||
      title.includes('klaarzetten')
    );
  };

  const isServiceKlusTicket = (ticket: ServiceTicket) => {
    return !isHorecaTicket(ticket) && !isMeetingTicket(ticket);
  };

  // 1. Uitleningen
  const loansStats = {
    total: loans.length,
    active: loans.filter(l => l.status === 'uitgeleend').length,
  };

  // 2. Serviceklussen
  const serviceTicketsList = tickets.filter(isServiceKlusTicket);
  const serviceKlussenStats = {
    total: serviceTicketsList.length,
    unhandled: serviceTicketsList.filter(t => t.status === 'open' || t.status === 'in_behandeling' || t.status === 'wacht_op_onderdelen' || t.status === 'wachtlijst').length,
    newCount: serviceTicketsList.filter(t => t.status === 'open').length,
  };

  // 3. Vergaderverzoeken
  const meetingTicketsList = tickets.filter(isMeetingTicket);
  const vergaderStats = {
    total: meetingTicketsList.length,
    unhandled: meetingTicketsList.filter(t => t.status === 'open' || t.status === 'in_behandeling' || t.status === 'wacht_op_onderdelen' || t.status === 'wachtlijst').length,
    newCount: meetingTicketsList.filter(t => t.status === 'open').length,
  };

  // 4. Bestelde bestellingen
  const horecaTicketsList = tickets.filter(isHorecaTicket);
  const horecaStats = {
    total: horecaTicketsList.length,
    unhandled: horecaTicketsList.filter(t => t.status === 'open' || t.status === 'in_behandeling').length,
    newCount: horecaTicketsList.filter(t => t.status === 'open').length,
  };

  const activeLoansCount = loansStats.active;
  const openTicketsCount = serviceKlussenStats.unhandled + vergaderStats.unhandled + horecaStats.unhandled;

  // If colleague opened the standalone request link (e.g. ?form=klusje)
  if (isPublicRequestMode) {
    return (
      <PublicServiceRequestForm
        onAddTicket={handleAddTicket}
        onGoToInternalSystem={() => setIsPublicRequestMode(false)}
        menuItems={menuItems}
        tickets={tickets}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5FA] flex flex-col selection:bg-[#D70096] selection:text-white">
      {/* Sticky Top Header */}
      <Header
        currentView={currentView}
        activeModule={activeModule}
        onNavigateView={setCurrentView}
        onSwitchModule={handleSwitchModule}
        userSession={userSession}
        onLogoutAdmin={() => setCurrentView('role_select')}
        onResetUserSession={handleResetUserSession}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg border text-xs font-semibold ${
            toast.type === 'success' 
              ? 'bg-[#24126E] text-white border-[#24126E]' 
              : toast.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-white text-[#24126E] border-slate-200'
          }`}>
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#D70096]" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#24126E]" />}
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="ml-2 opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* VIEW 1: Main Portal Selection (Choice between Uitleensysteem, Servicesysteem & Horeca) */}
        {activeModule === 'portal' && (
          <MainPortal
            onSelectModule={handleSwitchModule}
            loansStats={loansStats}
            serviceKlussenStats={serviceKlussenStats}
            vergaderStats={vergaderStats}
            horecaStats={horecaStats}
            materialsCount={materials.length}
            activeLoansCount={activeLoansCount}
            openTicketsCount={openTicketsCount}
            totalTicketsCount={tickets.length}
            horecaDishesCount={menuItems.filter(m => m.active).length}
          />
        )}

        {/* VIEW 2: Servicesysteem (Ticketsysteem - Afhandelaars Systeem) */}
        {activeModule === 'service' && (
          <ServicePortal
            tickets={tickets}
            students={students}
            teachers={teachers}
            menuItems={menuItems}
            onSaveMenuItems={handleSaveMenuItems}
            onAddTicket={handleAddTicket}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onArchiveTicket={handleArchiveTicket}
            onUnarchiveTicket={handleUnarchiveTicket}
            onDeleteTicket={handleDeleteTicket}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onToggleStudentActive={handleToggleStudentActive}
            onAddTeacher={handleAddTeacher}
            onDeleteTeacher={handleDeleteTeacher}
            onToggleTeacherActive={handleToggleTeacherActive}
            onBackToPortal={() => setActiveModule('portal')}
            onOpenPublicLinkView={() => setIsPublicRequestMode(true)}
          />
        )}

        {/* VIEW 3: Horeca & Catering (Weekmenu, Maaltijden Bestellen & Keukendashboard) */}
        {activeModule === 'horeca' && (
          <HorecaPortal
            tickets={tickets}
            students={students}
            teachers={teachers}
            menuItems={menuItems}
            onSaveMenuItems={handleSaveMenuItems}
            onAddTicket={handleAddTicket}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onArchiveTicket={handleArchiveTicket}
            onUnarchiveTicket={handleUnarchiveTicket}
            onDeleteTicket={handleDeleteTicket}
            onBackToPortal={() => setActiveModule('portal')}
          />
        )}

        {/* VIEW 3: Uitleensysteem (Balie Personeel & Admin) */}
        {activeModule === 'uitleen' && (
          <>
            {currentView === 'role_select' && (
              <RoleSelect
                onSelectRole={(view) => {
                  setCurrentView(view);
                }}
                onBackToPortal={() => setActiveModule('portal')}
                activeLoansCount={activeLoansCount}
                availableMaterialsCount={materials.length}
              />
            )}

            {/* ROL 1: Baliemedewerker (Uitgifte & Inname) */}
            {currentView === 'user_catalog' && (
              <BalieLendingView
                categories={categories}
                materials={materials}
                loans={loans}
                onBorrow={handleDeskBorrow}
                onReturnLoanWithCondition={handleReturnLoan}
                onExitToRoles={() => setCurrentView('role_select')}
              />
            )}

            {currentView === 'user_register' && (
              <UserRegister
                initialSession={userSession}
                onComplete={handleUserRegisterComplete}
                onBack={() => setCurrentView('role_select')}
              />
            )}

            {/* ROL 2: Beheerder / Admin */}
            {currentView === 'admin_pin' && (
              <AdminPinScreen
                onSuccess={() => setCurrentView('admin_dashboard')}
                onBack={() => setCurrentView('role_select')}
              />
            )}

            {currentView === 'admin_dashboard' && (
              <AdminDashboard
                categories={categories}
                materials={materials}
                loans={loans}
                tickets={tickets}
                students={students}
                menuItems={menuItems}
                onSaveMenuItems={handleSaveMenuItems}
                onAddMaterial={handleAddMaterial}
                onEditMaterial={handleEditMaterial}
                onDeleteMaterial={handleDeleteMaterial}
                onUpdateMaterialBarcode={handleUpdateMaterialBarcode}
                onAddCategory={handleAddCategory}
                onEditCategory={handleEditCategory}
                onDeleteCategory={handleDeleteCategory}
                onReturnLoan={(loanId) => handleReturnLoan(loanId)}
                onAddStudent={handleAddStudent}
                onDeleteStudent={handleDeleteStudent}
                onToggleStudentActive={handleToggleStudentActive}
                onExitAdmin={() => setCurrentView('role_select')}
                onResetToStandardMaterials={handleResetToStandardMaterials}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
