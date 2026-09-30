import { Category, Material, Loan, BorrowerSession, ServiceTicket, StudentWorker, SupervisingTeacher, MenuItem, MealOrderItem } from '../types';
import { supabase } from './supabaseClient';

// Session storage key stays in sessionStorage (ephemeral per-browser session)
const SESSION_KEY = 'summa_plus_user_session_v2';

// ============================================================
// Column mapping helpers (snake_case DB ↔ camelCase TS)
// ============================================================

function mapCategory(row: any): Category {
  return { id: row.id, name: row.name };
}

function mapMaterial(row: any): Material {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id || '',
    totalQuantity: row.total_quantity ?? 0,
    optionalBarcode: row.optional_barcode || undefined,
    optionalImageUrl: row.optional_image_url || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapLoan(row: any): Loan {
  return {
    id: row.id,
    materialId: row.material_id || '',
    materialName: row.material_name,
    categoryName: row.category_name || '',
    borrowerName: row.borrower_name,
    borrowerTeam: row.borrower_team,
    quantity: row.quantity ?? 1,
    borrowedAtDate: row.borrowed_at_date || '',
    borrowedAtTime: row.borrowed_at_time || '',
    status: row.status,
    returnedAt: row.returned_at || undefined,
    conditionAtReturn: row.condition_at_return as Loan['conditionAtReturn'] || undefined,
    returnNotes: row.return_notes || undefined,
    linkedTicketNumber: row.linked_ticket_number || undefined,
    returnDueDate: row.return_due_date || undefined,
  };
}

function mapStudent(row: any): StudentWorker {
  return {
    id: row.id,
    name: row.name,
    role: row.role || undefined,
    team: row.team || undefined,
    active: row.active ?? true,
  };
}

function mapTeacher(row: any): SupervisingTeacher {
  return {
    id: row.id,
    name: row.name,
    department: row.department || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    active: row.active ?? true,
  };
}

function mapMenuItem(row: any): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: row.price || undefined,
    category: row.category as MenuItem['category'] || undefined,
    imageUrl: row.image_url || undefined,
    maxDailyPortions: row.max_daily_portions ?? 0,
    active: row.active ?? true,
    dietaryTag: row.dietary_tag || undefined,
  };
}

function mapTicket(row: any): ServiceTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number || '',
    title: row.title,
    description: row.description || '',
    category: row.category as ServiceTicket['category'] || undefined,
    priority: row.priority as ServiceTicket['priority'] || 'normaal',
    location: row.location || '',
    requesterName: row.requester_name || '',
    requesterTeam: row.requester_team || '',
    requesterContact: row.requester_contact || undefined,
    desiredDate: row.desired_date || undefined,
    assignedTo: row.assigned_to || undefined,
    assignedTeacher: row.assigned_teacher || undefined,
    assignedStudent: row.assigned_student || undefined,
    photos: row.photos || undefined,
    status: row.status as ServiceTicket['status'] || 'open',
    archived: row.archived ?? false,
    archivedAt: row.archived_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    createdAtFormatted: row.created_at
      ? new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(row.created_at))
      : '',
    resolutionNotes: row.resolution_notes || undefined,
    completedAt: row.completed_at || undefined,
    mealOrderItems: row.meal_order_items || undefined,
    mealPickupTime: row.meal_pickup_time || undefined,
    mealDietaryNotes: row.meal_dietary_notes || undefined,
    totalPortions: row.total_portions || undefined,
  };
}

// ============================================================
// Async data loaders (replace localStorage getters)
// ============================================================

export async function getStoredCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) { console.error('load categories:', error); return []; }
  return (data || []).map(mapCategory);
}

export async function getStoredMaterials(): Promise<Material[]> {
  const { data, error } = await supabase.from('materials').select('*').order('name');
  if (error) { console.error('load materials:', error); return []; }
  return (data || []).map(mapMaterial);
}

export async function getStoredLoans(): Promise<Loan[]> {
  const { data, error } = await supabase.from('loans').select('*').order('created_at', { ascending: false });
  if (error) { console.error('load loans:', error); return []; }
  return (data || []).map(mapLoan);
}

export async function getStoredTickets(): Promise<ServiceTicket[]> {
  const { data, error } = await supabase
    .from('service_tickets')
    .select('*, meal_order_items(*)')
    .order('created_at', { ascending: false });
  if (error) { console.error('load tickets:', error); return []; }
  return (data || []).map(mapTicket);
}

export async function getStoredStudents(): Promise<StudentWorker[]> {
  const { data, error } = await supabase.from('student_workers').select('*').order('name');
  if (error) { console.error('load students:', error); return []; }
  return (data || []).map(mapStudent);
}

export async function getStoredTeachers(): Promise<SupervisingTeacher[]> {
  const { data, error } = await supabase.from('supervising_teachers').select('*').order('name');
  if (error) { console.error('load teachers:', error); return []; }
  return (data || []).map(mapTeacher);
}

export async function getStoredMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await supabase.from('menu_items').select('*').order('name');
  if (error) { console.error('load menu items:', error); return []; }
  return (data || []).map(mapMenuItem);
}

// ============================================================
// Async data savers (replace localStorage setters)
// Each does an upsert into Supabase.
// ============================================================

export async function saveCategories(categories: Category[]): Promise<void> {
  const rows = categories.map(c => ({ id: c.id, name: c.name }));
  const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'id' });
  if (error) console.error('save categories:', error);
}

export async function saveMaterials(materials: Material[]): Promise<void> {
  const rows = materials.map(m => ({
    id: m.id,
    name: m.name,
    category_id: m.categoryId,
    total_quantity: m.totalQuantity,
    optional_barcode: m.optionalBarcode || null,
    optional_image_url: m.optionalImageUrl || null,
    notes: m.notes || null,
    created_at: m.createdAt,
  }));
  const { error } = await supabase.from('materials').upsert(rows, { onConflict: 'id' });
  if (error) console.error('save materials:', error);
}

export async function saveLoans(loans: Loan[]): Promise<void> {
  const rows = loans.map(l => ({
    id: l.id,
    material_id: l.materialId || null,
    material_name: l.materialName,
    category_name: l.categoryName || null,
    borrower_name: l.borrowerName,
    borrower_team: l.borrowerTeam,
    quantity: l.quantity,
    borrowed_at_date: l.borrowedAtDate || null,
    borrowed_at_time: l.borrowedAtTime || null,
    status: l.status,
    returned_at: l.returnedAt || null,
    condition_at_return: l.conditionAtReturn || null,
    return_notes: l.returnNotes || null,
    linked_ticket_number: l.linkedTicketNumber || null,
    return_due_date: l.returnDueDate || null,
  }));
  const { error } = await supabase.from('loans').upsert(rows, { onConflict: 'id' });
  if (error) console.error('save loans:', error);
}

export async function saveTickets(tickets: ServiceTicket[]): Promise<void> {
  for (const t of tickets) {
    const ticketRow = {
      id: t.id,
      ticket_number: t.ticketNumber,
      title: t.title,
      description: t.description || null,
      category: t.category || null,
      priority: t.priority,
      location: t.location || null,
      requester_name: t.requesterName || null,
      requester_team: t.requesterTeam || null,
      requester_contact: t.requesterContact || null,
      desired_date: t.desiredDate || null,
      assigned_to: t.assignedTo || null,
      assigned_teacher: t.assignedTeacher || null,
      assigned_student: t.assignedStudent || null,
      photos: t.photos || null,
      status: t.status,
      archived: t.archived ?? false,
      archived_at: t.archivedAt || null,
      resolution_notes: t.resolutionNotes || null,
      completed_at: t.completedAt || null,
      meal_pickup_time: t.mealPickupTime || null,
      meal_dietary_notes: t.mealDietaryNotes || null,
      total_portions: t.totalPortions || null,
      created_at: t.createdAt,
    };
    const { error: upsertErr } = await supabase.from('service_tickets').upsert(ticketRow, { onConflict: 'id' });
    if (upsertErr) { console.error('save ticket:', upsertErr); continue; }

    // Sync meal_order_items: delete existing then re-insert
    if (t.mealOrderItems && t.mealOrderItems.length > 0) {
      await supabase.from('meal_order_items').delete().eq('ticket_id', t.id);
      const itemRows = t.mealOrderItems.map(mi => ({
        ticket_id: t.id,
        menu_item_id: mi.menuItemId,
        name: mi.name,
        portions: mi.portions,
        price: mi.price || null,
        category: mi.category || null,
      }));
      const { error: itemErr } = await supabase.from('meal_order_items').insert(itemRows);
      if (itemErr) console.error('save meal items:', itemErr);
    }
  }
}

export async function saveStudents(students: StudentWorker[]): Promise<void> {
  const rows = students.map(s => ({
    id: s.id,
    name: s.name,
    role: s.role || null,
    team: s.team || null,
    active: s.active,
  }));
  const { error } = await supabase.from('student_workers').upsert(rows, { onConflict: 'id' });
  if (error) console.error('save students:', error);
}

export async function saveTeachers(teachers: SupervisingTeacher[]): Promise<void> {
  const rows = teachers.map(t => ({
    id: t.id,
    name: t.name,
    department: t.department || null,
    email: t.email || null,
    phone: t.phone || null,
    active: t.active,
  }));
  const { error } = await supabase.from('supervising_teachers').upsert(rows, { onConflict: 'id' });
  if (error) console.error('save teachers:', error);
}

export async function saveMenuItems(items: MenuItem[]): Promise<void> {
  const rows = items.map(m => ({
    id: m.id,
    name: m.name,
    description: m.description || null,
    price: m.price || null,
    category: m.category || null,
    image_url: m.imageUrl || null,
    max_daily_portions: m.maxDailyPortions,
    active: m.active,
    dietary_tag: m.dietaryTag || null,
  }));
  const { error } = await supabase.from('menu_items').upsert(rows, { onConflict: 'id' });
  if (error) console.error('save menu items:', error);
}

// ============================================================
// Single-record delete helpers (for efficiency vs full-array upsert)
// ============================================================

export async function deleteMaterial(materialId: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', materialId);
  if (error) console.error('delete material:', error);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) console.error('delete category:', error);
}

export async function deleteStudent(studentId: string): Promise<void> {
  const { error } = await supabase.from('student_workers').delete().eq('id', studentId);
  if (error) console.error('delete student:', error);
}

export async function deleteTeacher(teacherId: string): Promise<void> {
  const { error } = await supabase.from('supervising_teachers').delete().eq('id', teacherId);
  if (error) console.error('delete teacher:', error);
}

export async function deleteTicket(ticketId: string): Promise<void> {
  const { error } = await supabase.from('service_tickets').delete().eq('id', ticketId);
  if (error) console.error('delete ticket:', error);
}

// ============================================================
// Session (stays in sessionStorage — per-browser ephemeral)
// ============================================================

export function getStoredSession(): BorrowerSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: BorrowerSession | null): void {
  if (session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

// ============================================================
// Pure utility functions (no I/O — unchanged)
// ============================================================

export function calculateAvailableQuantity(material: Material, loans: Loan[]): number {
  const activeBorrowedCount = loans
    .filter(l => l.materialId === material.id && l.status === 'uitgeleend')
    .reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
  return Math.max(0, material.totalQuantity - activeBorrowedCount);
}

export function isLoanOverdue(loan: Loan): boolean {
  if (loan.status !== 'uitgeleend' || !loan.returnDueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(loan.returnDueDate);
  due.setHours(0, 0, 0, 0);
  return today > due;
}

export function getEndOfTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDutchCurrentDateTime() {
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeFormatter = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' });
  return {
    dateStr: dateFormatter.format(now),
    timeStr: timeFormatter.format(now),
    isoDate: now.toISOString().split('T')[0],
  };
}

export function formatDutchDate(isoOrDateStr: string): string {
  if (!isoOrDateStr) return '-';
  try {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return isoOrDateStr;
    return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  } catch {
    return isoOrDateStr;
  }
}

export function formatDutchDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  } catch {
    return isoString;
  }
}

export function calculateOrderedPortions(dishId: string, tickets: ServiceTicket[]): number {
  return tickets
    .filter(t => t.status !== 'geannuleerd')
    .reduce((sum, ticket) => {
      if (!ticket.mealOrderItems) return sum;
      const orderItem = ticket.mealOrderItems.find(item => item.menuItemId === dishId);
      return sum + (orderItem ? Number(orderItem.portions) || 0 : 0);
    }, 0);
}

export function calculateRemainingPortions(item: MenuItem, tickets: ServiceTicket[]): number {
  const ordered = calculateOrderedPortions(item.id, tickets);
  return Math.max(0, item.maxDailyPortions - ordered);
}

// ============================================================
// Reset to seed data (admin action)
// ============================================================

export async function resetToSeedData(): Promise<void> {
  // Clear all data from tables
  await supabase.from('meal_order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('loans').delete().neq('id', '');
  await supabase.from('service_tickets').delete().neq('id', '');
  await supabase.from('materials').delete().neq('id', '');
  await supabase.from('categories').delete().neq('id', '');
  await supabase.from('student_workers').delete().neq('id', '');
  await supabase.from('supervising_teachers').delete().neq('id', '');
  await supabase.from('menu_items').delete().neq('id', '');
  sessionStorage.removeItem(SESSION_KEY);
  // The seed data will be re-inserted by the re-seed migration.
  // For now, categories and materials will be reloaded from the app's initial load.
}

// ============================================================
// Initial data constants (kept for resetToStandardMaterials in App.tsx)
// ============================================================

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-servies', name: 'Servies & Keuken' },
  { id: 'cat-opladers', name: 'Opladers & ICT' },
  { id: 'cat-schoonmaak', name: 'Schoonmaak & Facilitair' },
  { id: 'cat-diensten', name: 'Diensten & Balie' },
  { id: 'cat-overig', name: 'Overig' },
];

export const INITIAL_MATERIALS: Material[] = [
  { id: 'mat-bord', name: 'Bord', categoryId: 'cat-servies', optionalBarcode: 'SUM-SRV-001', optionalImageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80', totalQuantity: 30, notes: 'Porseleinen plat dinerbord (wit) voor lunch, bijeenkomsten en catering.', createdAt: new Date().toISOString() },
  { id: 'mat-broodmes', name: 'Broodmes', categoryId: 'cat-servies', optionalBarcode: 'SUM-SRV-002', optionalImageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=80', totalQuantity: 4, notes: 'Gekarteld RVS broodmes voor het snijden van stokbrood en broden.', createdAt: new Date().toISOString() },
  { id: 'mat-emmer', name: 'Emmer', categoryId: 'cat-schoonmaak', optionalBarcode: 'SUM-SCH-003', optionalImageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80', totalQuantity: 8, notes: 'Stevige schoonmaakemmer (10 liter) met ergonomisch handvat.', createdAt: new Date().toISOString() },
  { id: 'mat-gebaksvorkje', name: 'Gebaksvorkje', categoryId: 'cat-servies', optionalBarcode: 'SUM-SRV-004', optionalImageUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80', totalQuantity: 35, notes: 'RVS klein gebaksvorkje voor taart, vieringen en presentaties.', createdAt: new Date().toISOString() },
  { id: 'mat-iphone-oplader-usbc', name: 'iPhone Oplader USB-C', categoryId: 'cat-opladers', optionalBarcode: 'SUM-ICT-005', optionalImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80', totalQuantity: 8, notes: 'Apple snellader adapter met USB-C kabel voor iPhone en iPad.', createdAt: new Date().toISOString() },
  { id: 'mat-kop-en-schotel', name: 'Kop en Schotel', categoryId: 'cat-servies', optionalBarcode: 'SUM-SRV-006', optionalImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', totalQuantity: 24, notes: 'Klassiek wit porseleinen koffiekopje inclusief bijpassend schoteltje.', createdAt: new Date().toISOString() },
  { id: 'mat-kopieerservice', name: 'Kopieerservice', categoryId: 'cat-diensten', optionalBarcode: 'SUM-DNS-007', optionalImageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80', totalQuantity: 10, notes: 'Baliedienst: printen, kopiëren en scannen van lesmateriaal en formulieren (A4/A3).', createdAt: new Date().toISOString() },
  { id: 'mat-stofzuiger', name: 'Stofzuiger', categoryId: 'cat-schoonmaak', optionalBarcode: 'SUM-SCH-008', optionalImageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80', totalQuantity: 3, notes: 'Professionele sledestofzuiger met telescopische stang en combizuigmond.', createdAt: new Date().toISOString() },
  { id: 'mat-trappenhal-opruimen', name: 'Trappenhal opruimen en stofzuigen', categoryId: 'cat-diensten', optionalBarcode: 'SUM-DNS-009', optionalImageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80', totalQuantity: 5, notes: 'Facilitair team voor het netjes maken, vegen en stofzuigen van de trappenhal en overlopen.', createdAt: new Date().toISOString() },
  { id: 'mat-veger-en-blik', name: 'Veger en Blik', categoryId: 'cat-schoonmaak', optionalBarcode: 'SUM-SCH-010', optionalImageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80', totalQuantity: 8, notes: 'Handveger met fijne borstelharen en stevig metalen/kunststof blik.', createdAt: new Date().toISOString() },
  { id: 'mat-vork', name: 'Vork', categoryId: 'cat-servies', optionalBarcode: 'SUM-SRV-011', optionalImageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80', totalQuantity: 40, notes: 'RVS diner vork voor lunch en buffet.', createdAt: new Date().toISOString() },
  { id: 'mat-lamineerservice', name: 'Lamineerservice', categoryId: 'cat-diensten', optionalBarcode: 'SUM-DNS-012', optionalImageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80', totalQuantity: 6, notes: 'Baliedienst: lamineren van instructiebladen, badges en leskaarten (A4 en A3).', createdAt: new Date().toISOString() },
  { id: 'mat-lepel', name: 'Lepel', categoryId: 'cat-servies', optionalBarcode: 'SUM-SRV-013', optionalImageUrl: 'https://images.unsplash.com/photo-1589135233689-d562f1d94068?auto=format&fit=crop&w=600&q=80', totalQuantity: 40, notes: 'RVS diner lepel / eetlepel voor soep en gerechten.', createdAt: new Date().toISOString() },
  { id: 'mat-mes', name: 'Mes', categoryId: 'cat-servies', optionalBarcode: 'SUM-SRV-014', optionalImageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=80', totalQuantity: 40, notes: 'RVS dinermes voor lunch en maaltijden.', createdAt: new Date().toISOString() },
  { id: 'mat-microvezeldoekje', name: 'Microvezeldoekje', categoryId: 'cat-schoonmaak', optionalBarcode: 'SUM-SCH-015', optionalImageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=80', totalQuantity: 25, notes: 'Zacht microvezel schoonmaakdoekje voor bureaus, touchscreens en meubilair.', createdAt: new Date().toISOString() },
  { id: 'mat-oplader-laptop-pin', name: 'Oplader Laptop (Ronde Pin)', categoryId: 'cat-opladers', optionalBarcode: 'SUM-ICT-016', optionalImageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80', totalQuantity: 6, notes: 'Universele laptopvoeding met ronde DC pin aansluiting (geschikt voor HP/Lenovo).', createdAt: new Date().toISOString() },
  { id: 'mat-oplader-laptop-usbc', name: 'Oplader Laptop (USB-C 65W)', categoryId: 'cat-opladers', optionalBarcode: 'SUM-ICT-017', optionalImageUrl: 'https://images.unsplash.com/photo-1609081219090-a6d8173087ec?auto=format&fit=crop&w=600&q=80', totalQuantity: 10, notes: 'Snelle 65W USB-C Power Delivery oplader voor moderne laptops, Chromebooks en MacBooks.', createdAt: new Date().toISOString() },
  { id: 'mat-samsung-oplader-usbc', name: 'Samsung Oplader USB-C', categoryId: 'cat-opladers', optionalBarcode: 'SUM-ICT-018', optionalImageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80', totalQuantity: 8, notes: 'Originele Samsung 25W Super Fast Charger adapter met USB-C naar USB-C kabel.', createdAt: new Date().toISOString() },
  { id: 'mat-schoteltje', name: 'Schoteltje', categoryId: 'cat-servies', optionalBarcode: 'SUM-SRV-019', optionalImageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', totalQuantity: 25, notes: 'Los porseleinen schoteltje voor koffie, cake, koekjes of theezakjes.', createdAt: new Date().toISOString() },
];

export const INITIAL_STUDENTS: StudentWorker[] = [];
export const INITIAL_TEACHERS: SupervisingTeacher[] = [];
export const INITIAL_TICKETS: ServiceTicket[] = [];
