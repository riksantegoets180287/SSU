import { Category, Material, Loan, BorrowerSession, ServiceTicket, StudentWorker, SupervisingTeacher, MenuItem } from '../types';

const STORAGE_KEYS = {
  CATEGORIES: 'summa_plus_categories_v3',
  MATERIALS: 'summa_plus_materials_v3',
  LOANS: 'summa_plus_loans_v3',
  USER_SESSION: 'summa_plus_user_session_v2',
  TICKETS: 'summa_plus_tickets_v2',
  STUDENTS: 'summa_plus_students_v2',
  TEACHERS: 'summa_plus_teachers_v2',
  MENU_ITEMS: 'summa_plus_menu_items_v2',
};

export const INITIAL_STUDENTS: StudentWorker[] = [];

export const INITIAL_TEACHERS: SupervisingTeacher[] = [];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dish-boerenkool',
    name: 'Boerenkool met Ambachtelijke Rookworst',
    description: 'Verse romige boerenkoolstamppot met knapperige spekjes, Gelderse rookworst en huisgemaakte mosterdjus.',
    price: '€ 4,50',
    category: 'hoofdgerecht',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    maxDailyPortions: 25,
    active: true,
    dietaryTag: 'Specialiteit vd Week',
  },
  {
    id: 'dish-tomatensoep',
    name: 'Verse Romige Tomaten-Groentesoep',
    description: 'Rijkgevulde huisgemaakte soep met soepballetjes en verse kruiden, geserveerd met een ovenvers breekbroodje en kruidenboter.',
    price: '€ 3,00',
    category: 'soep',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    maxDailyPortions: 20,
    active: true,
    dietaryTag: 'Huisgemaakt',
  },
  {
    id: 'dish-broodje-warm-vlees',
    name: 'Broodje Warm Vlees met Satésaus',
    description: 'Knapperig pistoletje rijkelijk belegd met gekruid warm varkensvlees, warme pindasaus en krokante gebakken uitjes.',
    price: '€ 3,75',
    category: 'broodje',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    maxDailyPortions: 18,
    active: true,
    dietaryTag: 'Warm belegd',
  },
  {
    id: 'dish-quiche-vega',
    name: 'Vegetarische Seizoensquiche & Salade',
    description: 'Ambachtelijk gebakken hartige taart met seizoensgroenten en geitenkaas, geserveerd met een frisse gemengde rauwkostsalade.',
    price: '€ 4,00',
    category: 'hoofdgerecht',
    imageUrl: 'https://images.unsplash.com/photo-1556761223-4c4282c73f77?auto=format&fit=crop&w=800&q=80',
    maxDailyPortions: 15,
    active: true,
    dietaryTag: 'Vegetarisch 🌱',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-servies', name: 'Servies & Keuken' },
  { id: 'cat-opladers', name: 'Opladers & ICT' },
  { id: 'cat-schoonmaak', name: 'Schoonmaak & Facilitair' },
  { id: 'cat-diensten', name: 'Diensten & Balie' },
  { id: 'cat-overig', name: 'Overig' },
];

export const INITIAL_MATERIALS: Material[] = [
  {
    id: 'mat-bord',
    name: 'Bord',
    categoryId: 'cat-servies',
    optionalBarcode: 'SUM-SRV-001',
    optionalImageUrl: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 30,
    notes: 'Porseleinen plat dinerbord (wit) voor lunch, bijeenkomsten en catering.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-broodmes',
    name: 'Broodmes',
    categoryId: 'cat-servies',
    optionalBarcode: 'SUM-SRV-002',
    optionalImageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 4,
    notes: 'Gekarteld RVS broodmes voor het snijden van stokbrood en broden.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-emmer',
    name: 'Emmer',
    categoryId: 'cat-schoonmaak',
    optionalBarcode: 'SUM-SCH-003',
    optionalImageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 8,
    notes: 'Stevige schoonmaakemmer (10 liter) met ergonomisch handvat.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-gebaksvorkje',
    name: 'Gebaksvorkje',
    categoryId: 'cat-servies',
    optionalBarcode: 'SUM-SRV-004',
    optionalImageUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 35,
    notes: 'RVS klein gebaksvorkje voor taart, vieringen en presentaties.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-iphone-oplader-usbc',
    name: 'iPhone Oplader USB-C',
    categoryId: 'cat-opladers',
    optionalBarcode: 'SUM-ICT-005',
    optionalImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 8,
    notes: 'Apple snellader adapter met USB-C kabel voor iPhone en iPad.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-kop-en-schotel',
    name: 'Kop en Schotel',
    categoryId: 'cat-servies',
    optionalBarcode: 'SUM-SRV-006',
    optionalImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 24,
    notes: 'Klassiek wit porseleinen koffiekopje inclusief bijpassend schoteltje.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-kopieerservice',
    name: 'Kopieerservice',
    categoryId: 'cat-diensten',
    optionalBarcode: 'SUM-DNS-007',
    optionalImageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 10,
    notes: 'Baliedienst: printen, kopiëren en scannen van lesmateriaal en formulieren (A4/A3).',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-stofzuiger',
    name: 'Stofzuiger',
    categoryId: 'cat-schoonmaak',
    optionalBarcode: 'SUM-SCH-008',
    optionalImageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 3,
    notes: 'Professionele sledestofzuiger met telescopische stang en combizuigmond.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-trappenhal-opruimen',
    name: 'Trappenhal opruimen en stofzuigen',
    categoryId: 'cat-diensten',
    optionalBarcode: 'SUM-DNS-009',
    optionalImageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 5,
    notes: 'Facilitair team voor het netjes maken, vegen en stofzuigen van de trappenhal en overlopen.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-veger-en-blik',
    name: 'Veger en Blik',
    categoryId: 'cat-schoonmaak',
    optionalBarcode: 'SUM-SCH-010',
    optionalImageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 8,
    notes: 'Handveger met fijne borstelharen en stevig metalen/kunststof blik.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-vork',
    name: 'Vork',
    categoryId: 'cat-servies',
    optionalBarcode: 'SUM-SRV-011',
    optionalImageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 40,
    notes: 'RVS diner vork voor lunch en buffet.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-lamineerservice',
    name: 'Lamineerservice',
    categoryId: 'cat-diensten',
    optionalBarcode: 'SUM-DNS-012',
    optionalImageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 6,
    notes: 'Baliedienst: lamineren van instructiebladen, badges en leskaarten (A4 en A3).',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-lepel',
    name: 'Lepel',
    categoryId: 'cat-servies',
    optionalBarcode: 'SUM-SRV-013',
    optionalImageUrl: 'https://images.unsplash.com/photo-1589135233689-d562f1d94068?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 40,
    notes: 'RVS diner lepel / eetlepel voor soep en gerechten.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-mes',
    name: 'Mes',
    categoryId: 'cat-servies',
    optionalBarcode: 'SUM-SRV-014',
    optionalImageUrl: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 40,
    notes: 'RVS dinermes voor lunch en maaltijden.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-microvezeldoekje',
    name: 'Microvezeldoekje',
    categoryId: 'cat-schoonmaak',
    optionalBarcode: 'SUM-SCH-015',
    optionalImageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 25,
    notes: 'Zacht microvezel schoonmaakdoekje voor bureaus, touchscreens en meubilair.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-oplader-laptop-pin',
    name: 'Oplader Laptop (Ronde Pin)',
    categoryId: 'cat-opladers',
    optionalBarcode: 'SUM-ICT-016',
    optionalImageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 6,
    notes: 'Universele laptopvoeding met ronde DC pin aansluiting (geschikt voor HP/Lenovo).',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-oplader-laptop-usbc',
    name: 'Oplader Laptop (USB-C 65W)',
    categoryId: 'cat-opladers',
    optionalBarcode: 'SUM-ICT-017',
    optionalImageUrl: 'https://images.unsplash.com/photo-1609081219090-a6d8173087ec?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 10,
    notes: 'Snelle 65W USB-C Power Delivery oplader voor moderne laptops, Chromebooks en MacBooks.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-samsung-oplader-usbc',
    name: 'Samsung Oplader USB-C',
    categoryId: 'cat-opladers',
    optionalBarcode: 'SUM-ICT-018',
    optionalImageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 8,
    notes: 'Originele Samsung 25W Super Fast Charger adapter met USB-C naar USB-C kabel.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'mat-schoteltje',
    name: 'Schoteltje',
    categoryId: 'cat-servies',
    optionalBarcode: 'SUM-SRV-019',
    optionalImageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    totalQuantity: 25,
    notes: 'Los porseleinen schoteltje voor koffie, cake, koekjes of theezakjes.',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_LOANS: Loan[] = [];

export const INITIAL_TICKETS: ServiceTicket[] = [
  {
    id: 'ticket-ict-1',
    ticketNumber: 'TK-1001',
    title: 'Digibord scherm blijft zwart in lokaal 2.14',
    description: 'Digibord gaat niet aan via wandpaneel of HDMI-kabel. Graag nakijken voor volgende les.',
    category: 'ict_av',
    priority: 'spoed',
    location: 'Lokaal 2.14',
    requesterName: 'Marlies van der Linden',
    requesterTeam: 'VOAT',
    status: 'open',
    createdAt: new Date().toISOString(),
    createdAtFormatted: 'Vandaag om 08:30'
  },
  {
    id: 'ticket-meubilair-1',
    ticketNumber: 'TK-1002',
    title: '12 extra stoelen en 2 tafels plaatsen in 1.05',
    description: 'Voor toetsafname zijn er extra tafels en stoelen nodig in een rechte opstelling.',
    category: 'meubilair',
    priority: 'normaal',
    location: 'Lokaal 1.05',
    requesterName: 'Peter Bakker',
    requesterTeam: 'Entree',
    status: 'in_behandeling',
    assignedStudent: 'Noah',
    assignedTeacher: 'Jeroen',
    createdAt: new Date().toISOString(),
    createdAtFormatted: 'Vandaag om 09:15'
  },
  {
    id: 'ticket-vergader-1',
    ticketNumber: 'TK-1003',
    title: 'Vergaderruimte klaarzetten: Bestuurskamer 0.12 (U-vorm)',
    description: '📋 TAAK: Vergaderruimte klaarzetten\n📍 Lokaal / Ruimte: Bestuurskamer 0.12\n📐 Gewenste Opstelling: U-vorm (14 personen)\n☕ Koffie & Thee: JA, graag klaarzetten met kannen/bekers\n🗓 Datum & Tijd: Vandaag om 13:30 uur\n📝 Bijzonderheden: Flipover en whiteboardstiften klaarleggen.',
    category: 'evenement',
    priority: 'normaal',
    location: 'Bestuurskamer 0.12',
    requesterName: 'Astrid Somers',
    requesterTeam: 'OOP',
    desiredDate: 'Vandaag om 13:30 uur',
    status: 'open',
    createdAt: new Date().toISOString(),
    createdAtFormatted: 'Vandaag om 09:45'
  },
  {
    id: 'ticket-horeca-1',
    ticketNumber: 'HC-2001',
    title: 'Maaltijdbestelling: 2x Boerenkool met Rookworst',
    description: 'Maaltijdbestelling geplaatst voor afhalen om 12:15 aan de DV Balie.\nBestelde gerechten: 2x Boerenkool met Ambachtelijke Rookworst\nDieetwensen: Geen',
    category: 'horeca',
    priority: 'normaal',
    location: 'Summa Plus DV Balie (Blécourtstraat)',
    requesterName: 'Koen de Vries',
    requesterTeam: 'VIA',
    desiredDate: new Date().toISOString().split('T')[0],
    status: 'open',
    mealPickupTime: '12:15',
    mealOrderItems: [
      { menuItemId: 'dish-boerenkool', name: 'Boerenkool met Ambachtelijke Rookworst', portions: 2, price: '€ 4,50', category: 'hoofdgerecht' }
    ],
    totalPortions: 2,
    createdAt: new Date().toISOString(),
    createdAtFormatted: 'Vandaag om 10:00'
  },
  {
    id: 'ticket-horeca-2',
    ticketNumber: 'HC-2002',
    title: 'Maaltijdbestelling: 1x Broodje Warm Vlees',
    description: 'Maaltijdbestelling geplaatst voor afhalen om 11:45 aan de DV Balie.\nBestelde gerechten: 1x Broodje Warm Vlees met Satésaus\nDieetwensen: Geen',
    category: 'horeca',
    priority: 'normaal',
    location: 'Summa Plus DV Balie (Blécourtstraat)',
    requesterName: 'Ingrid Meijer',
    requesterTeam: 'VOAT',
    desiredDate: new Date().toISOString().split('T')[0],
    status: 'afgerond',
    mealPickupTime: '11:45',
    mealOrderItems: [
      { menuItemId: 'dish-broodje-warm-vlees', name: 'Broodje Warm Vlees met Satésaus', portions: 1, price: '€ 3,75', category: 'broodje' }
    ],
    totalPortions: 1,
    createdAt: new Date().toISOString(),
    createdAtFormatted: 'Vandaag om 09:00'
  }
];

export function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    const parsed: Category[] = JSON.parse(raw);
    // If old categories exist (e.g. cat-gereedschap), upgrade to the new categories matching the 19 products
    const hasLegacy = parsed.some(c => c.id === 'cat-gereedschap' || c.id === 'cat-sport');
    if (hasLegacy || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return parsed;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]): void {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

export function getStoredMaterials(): Material[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(INITIAL_MATERIALS));
      return INITIAL_MATERIALS;
    }
    const parsed: Material[] = JSON.parse(raw);
    // Auto-migrate if old test materials exist (e.g. mat-1 Thinkpad) or list is empty
    const hasLegacy = parsed.some(m => m.id === 'mat-1' || m.id === 'mat-2' || m.id === 'mat-3' || m.name.toLowerCase().includes('thinkpad'));
    if (hasLegacy || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(INITIAL_MATERIALS));
      return INITIAL_MATERIALS;
    }
    return parsed;
  } catch {
    return INITIAL_MATERIALS;
  }
}

export function saveMaterials(materials: Material[]): void {
  localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
}

export function getStoredLoans(): Loan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOANS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(INITIAL_LOANS));
      return INITIAL_LOANS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(INITIAL_LOANS));
      return INITIAL_LOANS;
    }
    return parsed;
  } catch {
    return INITIAL_LOANS;
  }
}

export function saveLoans(loans: Loan[]): void {
  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
}

export function getStoredTickets(): ServiceTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      return INITIAL_TICKETS;
    }
    return parsed;
  } catch {
    return INITIAL_TICKETS;
  }
}

export function saveTickets(tickets: ServiceTicket[]): void {
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
}

export function getStoredSession(): BorrowerSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: BorrowerSession | null): void {
  if (session) {
    sessionStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  }
}

export function calculateAvailableQuantity(material: Material, loans: Loan[]): number {
  const activeBorrowedCount = loans
    .filter(l => l.materialId === material.id && l.status === 'uitgeleend')
    .reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);

  const available = material.totalQuantity - activeBorrowedCount;
  return Math.max(0, available);
}

export function getDutchCurrentDateTime() {
  const now = new Date();
  
  // Format Date: e.g. "25 augustus 2026"
  const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  
  // Format Time: e.g. "13:08"
  const timeFormatter = new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });

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
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoOrDateStr;
  }
}

export function formatDutchDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function getStoredStudents(): StudentWorker[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STUDENTS;
  }
}

export function saveStudents(students: StudentWorker[]): void {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

export function getStoredTeachers(): SupervisingTeacher[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
      return INITIAL_TEACHERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TEACHERS;
  }
}

export function saveTeachers(teachers: SupervisingTeacher[]): void {
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
}

export function getStoredMenuItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU_ITEMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
      return INITIAL_MENU_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MENU_ITEMS;
  }
}

export function saveMenuItems(items: MenuItem[]): void {
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(items));
}

/**
 * Calculates how many portions have been ordered for a specific dish
 * across all active (non-cancelled) tickets.
 */
export function calculateOrderedPortions(dishId: string, tickets: ServiceTicket[]): number {
  return tickets
    .filter(t => t.status !== 'geannuleerd')
    .reduce((sum, ticket) => {
      if (!ticket.mealOrderItems) return sum;
      const orderItem = ticket.mealOrderItems.find(item => item.menuItemId === dishId);
      return sum + (orderItem ? Number(orderItem.portions) || 0 : 0);
    }, 0);
}

/**
 * Calculates remaining available portions for today/this week based on maxDailyPortions
 */
export function calculateRemainingPortions(item: MenuItem, tickets: ServiceTicket[]): number {
  const ordered = calculateOrderedPortions(item.id, tickets);
  const remaining = item.maxDailyPortions - ordered;
  return Math.max(0, remaining);
}

export function resetToSeedData(): void {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(INITIAL_MATERIALS));
  localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
  localStorage.setItem(STORAGE_KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
  sessionStorage.removeItem(STORAGE_KEYS.USER_SESSION);
}
