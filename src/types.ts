export interface Category {
  id: string;
  name: string;
}

export interface Material {
  id: string;
  name: string;
  categoryId: string;
  totalQuantity: number;
  optionalBarcode?: string;
  optionalImageUrl?: string;
  notes?: string;
  createdAt: string;
}

export type LoanReturnCondition = 'goed' | 'opmerking' | 'defect';

export interface Loan {
  id: string;
  materialId: string;
  materialName: string;
  categoryName: string;
  borrowerName: string;
  borrowerTeam: string;
  quantity: number;
  borrowedAtDate: string; // e.g. "2026-08-25" or ISO
  borrowedAtTime: string; // e.g. "13:08"
  status: 'uitgeleend' | 'teruggebracht';
  returnedAt?: string; // ISO timestamp
  conditionAtReturn?: LoanReturnCondition;
  returnNotes?: string;
  linkedTicketNumber?: string;
}

export interface StudentWorker {
  id: string;
  name: string; // e.g. "Noah"
  role?: string;
  team?: string;
  active: boolean;
}

export interface SupervisingTeacher {
  id: string;
  name: string; // e.g. "Jeroen"
  department?: string;
  email?: string;
  phone?: string;
  active: boolean;
}

export interface BorrowerSession {
  name: string;
  team: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price?: string; // e.g. "€ 4,50" or "Gratis"
  category?: 'hoofdgerecht' | 'soep' | 'broodje' | 'snack' | 'dessert' | 'overig';
  imageUrl?: string;
  maxDailyPortions: number; // Keukencapaciteit (max bestellingen)
  active: boolean;
  dietaryTag?: string; // e.g. "Specialiteit vd week", "Vegetarisch 🌱", "Huisgemaakt"
}

export interface MealOrderItem {
  menuItemId: string;
  name: string;
  portions: number;
  price?: string;
  category?: string;
}

export type TicketCategory = 
  | 'ict_av' 
  | 'facilitair' 
  | 'meubilair' 
  | 'reparatie' 
  | 'evenement' 
  | 'horeca'
  | 'overig';

export type TicketPriority = 'laag' | 'normaal' | 'hoog' | 'spoed';

export type TicketStatus = 
  | 'open' 
  | 'in_behandeling' 
  | 'wacht_op_onderdelen' 
  | 'wachtlijst' 
  | 'afgerond' 
  | 'geannuleerd';

export interface ServiceTicket {
  id: string;
  ticketNumber: string; // e.g. "TKT-1042"
  title: string;
  description: string;
  category?: TicketCategory; // optional / legacy
  priority: TicketPriority;
  location: string; // e.g. "Lokaal 2.14" of "Summa Plus Balie (Blécourtstraat)"
  requesterName: string; // Voornaam van de aanvrager
  requesterTeam: string; // Team of opleiding
  requesterContact?: string; // optioneel / legacy
  desiredDate?: string; // Gewenste datum / deadline
  assignedTo?: string; // fallback / backwards-compat
  assignedTeacher?: string; // e.g. "Jeroen"
  assignedStudent?: string; // e.g. "Noah"
  photos?: string[]; // Base64 data URLs of photos attached by requester
  status: TicketStatus;
  archived?: boolean; // When archived, removed from active desk dashboard
  archivedAt?: string; // ISO timestamp
  createdAt: string; // ISO string
  createdAtFormatted: string; // e.g. "25 aug 2026 13:15"
  resolutionNotes?: string;
  completedAt?: string;
  // Horeca & maaltijdvelden
  mealOrderItems?: MealOrderItem[];
  mealPickupTime?: string; // e.g. "12:30"
  mealDietaryNotes?: string;
  totalPortions?: number;
}

export type MainSystemModule = 'portal' | 'uitleen' | 'service' | 'horeca';

export type AppView = 
  | 'portal'
  | 'role_select' 
  | 'user_register' 
  | 'user_catalog' 
  | 'admin_pin' 
  | 'admin_dashboard';

export type ServiceRoleMode = 'desk' | 'admin';

export type ServiceView =
  | 'submit_ticket'
  | 'ticket_list'
  | 'admin_board';

export type AdminTab = 
  | 'materials' 
  | 'categories' 
  | 'active_loans' 
  | 'history'
  | 'analytics'
  | 'barcodes'
  | 'students'
  | 'teachers'
  | 'service_archive'
  | 'menu';
