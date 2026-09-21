import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  Building2, 
  RotateCcw, 
  Download, 
  Sparkles,
  FileSpreadsheet,
  Award,
  Layers
} from 'lucide-react';
import { Material, Category, Loan, ServiceTicket, StudentWorker } from '../../types';

interface AnalyticsDashboardProps {
  materials: Material[];
  categories: Category[];
  loans: Loan[];
  tickets: ServiceTicket[];
  students: StudentWorker[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  materials,
  categories,
  loans,
  tickets,
  students,
}) => {
  // 1. Most popular borrowed items
  const itemBorrowCounts = useMemo(() => {
    const counts: Record<string, { name: string; category: string; count: number; totalQty: number }> = {};

    loans.forEach(loan => {
      if (!counts[loan.materialId]) {
        const mat = materials.find(m => m.id === loan.materialId);
        counts[loan.materialId] = {
          name: loan.materialName,
          category: loan.categoryName,
          count: 0,
          totalQty: mat?.totalQuantity || 1,
        };
      }
      counts[loan.materialId].count += Number(loan.quantity) || 1;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [loans, materials]);

  // 2. Loans by Team / Opleiding
  const loansByTeam = useMemo(() => {
    const counts: Record<string, number> = {};
    loans.forEach(loan => {
      const team = loan.borrowerTeam?.trim() || 'Onbekend';
      counts[team] = (counts[team] || 0) + (Number(loan.quantity) || 1);
    });

    return Object.entries(counts)
      .map(([team, count]) => ({ team, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [loans]);

  // 3. Tickets by Category
  const ticketsByCategory = useMemo(() => {
    const counts: Record<string, number> = {
      ict_av: 0,
      facilitair: 0,
      meubilair: 0,
      reparatie: 0,
      evenement: 0,
      overig: 0,
    };

    tickets.forEach(t => {
      if (counts[t.category] !== undefined) {
        counts[t.category]++;
      } else {
        counts.overig++;
      }
    });

    const labels: Record<string, string> = {
      ict_av: 'ICT & Digiborden',
      facilitair: 'Facilitair & Gebouw',
      meubilair: 'Meubilair',
      reparatie: 'Reparaties',
      evenement: 'Evenementen',
      overig: 'Overig',
    };

    return Object.entries(counts).map(([cat, count]) => ({
      key: cat,
      label: labels[cat] || cat,
      count,
    }));
  }, [tickets]);

  // 4. General KPIs
  const totalLoansCount = loans.length;
  const activeLoansCount = loans.filter(l => l.status === 'uitgeleend').length;
  const completedLoansCount = loans.filter(l => l.status === 'teruggebracht').length;
  const damagedReturnsCount = loans.filter(l => l.conditionAtReturn === 'defect').length;

  const totalTicketsCount = tickets.length;
  const completedTicketsCount = tickets.filter(t => t.status === 'afgerond').length;
  const inProgressTicketsCount = tickets.filter(t => t.status === 'in_behandeling' || t.status === 'wacht_op_onderdelen').length;
  const openTicketsCount = tickets.filter(t => t.status === 'open').length;

  // Export to CSV for Excel
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += '--- SUMMA PLUS UITLEENRAPPORT ---\n';
    csvContent += 'Datum;Tijd;Materiaal;Categorie;Aantal;Lener;Team;Status;Conditie bij inname\n';

    loans.forEach(l => {
      csvContent += `"${l.borrowedAtDate}";"${l.borrowedAtTime}";"${l.materialName}";"${l.categoryName}";${l.quantity};"${l.borrowerName}";"${l.borrowerTeam}";"${l.status}";"${l.conditionAtReturn || 'goed'}"\n`;
    });

    csvContent += '\n--- SUMMA PLUS SERVICE TICKETS ---\n';
    csvContent += 'TicketNr;Aangemaakt;Titel;Categorie;Prioriteit;Locatie;Aanvrager;Team;Status;Toegewezen aan\n';

    tickets.forEach(t => {
      csvContent += `"${t.ticketNumber}";"${t.createdAtFormatted}";"${t.title.replace(/"/g, '""')}";"${t.category}";"${t.priority}";"${t.location}";"${t.requesterName}";"${t.requesterTeam}";"${t.status}";"${t.assignedStudent || t.assignedTo || 'Niet toegewezen'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `summa_plus_rapportage_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxBorrowCount = itemBorrowCounts.length > 0 ? Math.max(...itemBorrowCounts.map(i => i.count)) : 1;
  const maxTeamCount = loansByTeam.length > 0 ? Math.max(...loansByTeam.map(t => t.count)) : 1;
  const maxTicketCatCount = tickets.length > 0 ? Math.max(...ticketsByCategory.map(c => c.count)) : 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with CSV Export */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D70096] block mb-1">
            Beheer & Rapportage
          </span>
          <h3 className="text-xl font-extrabold text-[#24126E]">
            Statistieken & Inzichten Dashboard
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Realtime inzicht in balie-activiteiten, materiaalgebruik, storingen en leerteam prestaties.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-[#24126E] hover:bg-[#1A0D52] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-pink-400" />
          <span>Exporteer naar Excel (CSV)</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Loans */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Totaal Uitleningen</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#24126E] flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#24126E]">{totalLoansCount}</span>
            <span className="text-xs text-slate-400 block mt-0.5">
              waarvan <strong className="text-[#D70096]">{activeLoansCount}</strong> nu uitstaand
            </span>
          </div>
        </div>

        {/* Tickets Completed */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Klusjes & Storingen</span>
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#D70096] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#24126E]">{totalTicketsCount}</span>
            <span className="text-xs text-emerald-600 font-bold block mt-0.5">
              {completedTicketsCount} opgelost ({totalTicketsCount > 0 ? Math.round((completedTicketsCount / totalTicketsCount) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Damage Check */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Schademeldingen</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-700">{damagedReturnsCount}</span>
            <span className="text-xs text-slate-400 block mt-0.5">
              bij inname direct gesignaleerd
            </span>
          </div>
        </div>

        {/* Student Workers */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Actieve Studenten</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[#24126E]">{students.length}</span>
            <span className="text-xs text-slate-400 block mt-0.5">
              in het leerwerktraject
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular items chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#24126E] flex items-center justify-center font-bold">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-[#24126E] text-sm sm:text-base">
                  Meest Geleende Materialen (Top 5)
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-medium">Uitleningen</span>
            </div>

            {itemBorrowCounts.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Nog geen uitleenhistorie beschikbaar.</p>
            ) : (
              <div className="space-y-3.5">
                {itemBorrowCounts.map((item, idx) => {
                  const percentage = Math.round((item.count / maxBorrowCount) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-[#24126E] truncate max-w-[200px]">
                          {idx + 1}. {item.name}
                        </span>
                        <span className="text-[#D70096]">{item.count}x uitgeleend</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-[#24126E] to-[#D70096] rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Loans by Team/Opleiding */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#D70096] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-[#24126E] text-sm sm:text-base">
                  Leningen per Opleiding / Team
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-medium">Stuks</span>
            </div>

            {loansByTeam.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Nog geen teamgegevens geregistreerd.</p>
            ) : (
              <div className="space-y-3.5">
                {loansByTeam.map((item, idx) => {
                  const percentage = Math.round((item.count / maxTeamCount) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 truncate max-w-[200px]">{item.team}</span>
                        <span className="text-slate-900">{item.count} stuks</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#24126E] rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tickets by Category */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#24126E] flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h4 className="font-extrabold text-[#24126E] text-sm sm:text-base">
              Klusjesverdeling per Vakgebied
            </h4>
          </div>
          <span className="text-xs font-bold text-slate-400">Totaal {totalTicketsCount} klusjes</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ticketsByCategory.map((cat) => (
            <div key={cat.key} className="bg-[#F7F5FA] p-3.5 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-xs text-slate-500 font-medium block truncate mb-1">{cat.label}</span>
              <span className="text-xl font-black text-[#24126E]">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
