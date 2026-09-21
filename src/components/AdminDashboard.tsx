import React, { useState } from 'react';
import { 
  Package, 
  Layers, 
  Clock, 
  AlertTriangle, 
  History, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Inbox,
  BarChart3,
  Barcode,
  Users,
  Printer,
  Utensils
} from 'lucide-react';
import { AdminTab, Material, Category, Loan, ServiceTicket, StudentWorker, MenuItem } from '../types';
import { AdminMaterials } from './admin/AdminMaterials';
import { AdminCategories } from './admin/AdminCategories';
import { AdminActiveLoans } from './admin/AdminActiveLoans';
import { AdminHistory } from './admin/AdminHistory';
import { AnalyticsDashboard } from './admin/AnalyticsDashboard';
import { BarcodeManagementTab } from './admin/BarcodeManagementTab';
import { StudentManagementTab } from './admin/StudentManagementTab';
import { AdminMenuManagementTab } from './admin/AdminMenuManagementTab';
import { calculateAvailableQuantity } from '../lib/storage';

interface AdminDashboardProps {
  categories: Category[];
  materials: Material[];
  loans: Loan[];
  tickets: ServiceTicket[];
  students: StudentWorker[];
  menuItems?: MenuItem[];
  onSaveMenuItems?: (items: MenuItem[]) => void;
  onAddMaterial: (data: Omit<Material, 'id' | 'createdAt'>) => void;
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (materialId: string) => void;
  onUpdateMaterialBarcode: (materialId: string, barcode: string) => void;
  onAddCategory: (name: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onReturnLoan: (loanId: string) => void;
  onAddStudent: (student: Omit<StudentWorker, 'id'>) => void;
  onDeleteStudent: (studentId: string) => void;
  onToggleStudentActive: (studentId: string) => void;
  onExitAdmin: () => void;
  onResetToStandardMaterials?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  categories,
  materials,
  loans,
  tickets,
  students,
  menuItems,
  onSaveMenuItems,
  onAddMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onUpdateMaterialBarcode,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onReturnLoan,
  onAddStudent,
  onDeleteStudent,
  onToggleStudentActive,
  onExitAdmin,
  onResetToStandardMaterials,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('materials');

  // Key KPI metrics calculations
  const totalMaterialsCount = materials.length;
  const activeLoansCount = loans.filter(l => l.status === 'uitgeleend').length;
  const totalCategoriesCount = categories.length;

  // Unavailable or low stock items (<= 2 available or 0)
  const lowOrOutOfStockCount = materials.filter(m => {
    const available = calculateAvailableQuantity(m, loans);
    return available <= 2;
  }).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top dashboard title & role status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#24126E] bg-indigo-50 px-3 py-1 rounded-full mb-2 border border-indigo-100 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D70096]" />
            Beheerderspaneel Summa Plus
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#24126E] tracking-tight">
            Uitleenbeheer & Serviceteam Beheer
          </h1>
        </div>

        <button
          onClick={onExitAdmin}
          className="text-xs font-bold text-slate-600 hover:text-[#24126E] bg-white hover:bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Terug naar startscherm</span>
        </button>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Materials */}
        <div 
          onClick={() => setActiveTab('materials')}
          className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'materials' ? 'border-[#24126E] ring-2 ring-[#24126E]/10' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Materialen</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#24126E] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#24126E]">
            {totalMaterialsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Geregistreerde artikelen
          </p>
        </div>

        {/* Active Loans */}
        <div 
          onClick={() => setActiveTab('active_loans')}
          className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'active_loans' ? 'border-[#D70096] ring-2 ring-[#D70096]/10' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Uitgeleend</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#D70096] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#D70096]">
            {activeLoansCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Momenteel in bruikleen
          </p>
        </div>

        {/* Categories */}
        <div 
          onClick={() => setActiveTab('categories')}
          className={`bg-white rounded-3xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
            activeTab === 'categories' ? 'border-[#24126E] ring-2 ring-[#24126E]/10' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categorieën</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#24126E] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#24126E]">
            {totalCategoriesCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Rubrieken en afdelingen
          </p>
        </div>

        {/* Low / Out of Stock */}
        <div 
          onClick={() => setActiveTab('materials')}
          className="bg-white rounded-3xl p-5 border border-slate-100 transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lage voorraad</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-600">
            {lowOrOutOfStockCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Items ≤ 2 stuks beschikbaar
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px scrollbar-none">
          <button
            id="tab-admin-materials"
            onClick={() => setActiveTab('materials')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'materials'
                ? 'border-[#24126E] text-[#24126E]'
                : 'border-transparent text-slate-500 hover:text-[#24126E] hover:border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Materialen ({totalMaterialsCount})</span>
          </button>

          <button
            id="tab-admin-categories"
            onClick={() => setActiveTab('categories')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'categories'
                ? 'border-[#24126E] text-[#24126E]'
                : 'border-transparent text-slate-500 hover:text-[#24126E] hover:border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categorieën ({totalCategoriesCount})</span>
          </button>

          <button
            id="tab-admin-active-loans"
            onClick={() => setActiveTab('active_loans')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'active_loans'
                ? 'border-[#D70096] text-[#D70096]'
                : 'border-transparent text-slate-500 hover:text-[#24126E] hover:border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Uitgeleend</span>
            {activeLoansCount > 0 && (
              <span className="bg-[#D70096] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {activeLoansCount}
              </span>
            )}
          </button>

          <button
            id="tab-admin-history"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#24126E] text-[#24126E]'
                : 'border-transparent text-slate-500 hover:text-[#24126E] hover:border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historie ({loans.length})</span>
          </button>

          <button
            id="tab-admin-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-[#24126E] text-[#24126E]'
                : 'border-transparent text-slate-500 hover:text-[#24126E] hover:border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#D70096]" />
            <span>Statistieken & Inzichten</span>
          </button>

          <button
            id="tab-admin-barcodes"
            onClick={() => setActiveTab('barcodes')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'barcodes'
                ? 'border-[#24126E] text-[#24126E]'
                : 'border-transparent text-slate-500 hover:text-[#24126E] hover:border-slate-200'
            }`}
          >
            <Barcode className="w-4 h-4 text-indigo-600" />
            <span>Barcodes & Labels</span>
          </button>

          <button
            id="tab-admin-students"
            onClick={() => setActiveTab('students')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'students'
                ? 'border-[#24126E] text-[#24126E]'
                : 'border-transparent text-slate-500 hover:text-[#24126E] hover:border-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Studenten ({students.length})</span>
          </button>

          {menuItems && onSaveMenuItems && (
            <button
              id="tab-admin-menu"
              onClick={() => setActiveTab('menu')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'menu'
                  ? 'border-[#24126E] text-[#24126E]'
                  : 'border-transparent text-slate-500 hover:text-[#24126E] hover:border-slate-200'
              }`}
            >
              <Utensils className="w-4 h-4 text-amber-600" />
              <span>Weekmenu & Porties</span>
            </button>
          )}
        </nav>
      </div>

      {/* Tab Screen Content */}
      <div className="pt-2">
        {activeTab === 'materials' && (
          <AdminMaterials
            materials={materials}
            categories={categories}
            loans={loans}
            onAddMaterial={onAddMaterial}
            onEditMaterial={onEditMaterial}
            onDeleteMaterial={onDeleteMaterial}
            onNavigateToCategories={() => setActiveTab('categories')}
            onResetToStandardMaterials={onResetToStandardMaterials}
          />
        )}

        {activeTab === 'categories' && (
          <AdminCategories
            categories={categories}
            materials={materials}
            onAddCategory={onAddCategory}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
          />
        )}

        {activeTab === 'active_loans' && (
          <AdminActiveLoans
            loans={loans}
            onReturnLoan={onReturnLoan}
          />
        )}

        {activeTab === 'history' && (
          <AdminHistory
            loans={loans}
            categories={categories}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            materials={materials}
            categories={categories}
            loans={loans}
            tickets={tickets}
            students={students}
          />
        )}

        {activeTab === 'barcodes' && (
          <BarcodeManagementTab
            materials={materials}
            categories={categories}
            onUpdateMaterialBarcode={onUpdateMaterialBarcode}
          />
        )}

        {activeTab === 'students' && (
          <StudentManagementTab
            students={students}
            tickets={tickets}
            onAddStudent={onAddStudent}
            onDeleteStudent={onDeleteStudent}
            onToggleStudentActive={onToggleStudentActive}
          />
        )}

        {activeTab === 'menu' && menuItems && onSaveMenuItems && (
          <AdminMenuManagementTab
            menuItems={menuItems}
            onSaveMenuItems={onSaveMenuItems}
            tickets={tickets}
          />
        )}
      </div>
    </div>
  );
};
