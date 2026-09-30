import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Printer,
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { Material, Category, Loan } from '../../types';
import { calculateAvailableQuantity, isLoanOverdue, formatDutchDate, getDutchCurrentDateTime } from '../../lib/storage';
import { jsPDF } from 'jspdf';

interface AdminBalanceListProps {
  materials: Material[];
  categories: Category[];
  loans: Loan[];
}

export const AdminBalanceList: React.FC<AdminBalanceListProps> = ({
  materials,
  categories,
  loans,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (categoryFilter !== 'all' && m.categoryId !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return m.name.toLowerCase().includes(q) ||
          m.optionalBarcode?.toLowerCase().includes(q) ||
          categories.find(c => c.id === m.categoryId)?.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [materials, categories, categoryFilter, searchQuery]);

  const activeBorrowedTotal = useMemo(() => {
    return loans
      .filter(l => l.status === 'uitgeleend')
      .reduce((sum, l) => sum + l.quantity, 0);
  }, [loans]);

  const overdueCount = useMemo(() => {
    return loans.filter(l => isLoanOverdue(l)).length;
  }, [loans]);

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { dateStr, timeStr } = getDutchCurrentDateTime();

    // Title
    doc.setFontSize(18);
    doc.setTextColor(36, 18, 110);
    doc.text('Balanslijst — Uitleensysteem Summa Plus', 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(100, 94, 120);
    doc.text(`Datum: ${dateStr} ${timeStr}`, 14, 27);
    doc.text(`Totaal materialen: ${materials.length} | Uitgeleend: ${activeBorrowedTotal} stuks | Te laat: ${overdueCount}`, 14, 32);

    // Table header
    let y = 42;
    doc.setFillColor(247, 245, 250);
    doc.rect(14, y - 4, 182, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(36, 18, 110);
    doc.text('Materiaal', 16, y + 1);
    doc.text('Categorie', 76, y + 1);
    doc.text('Barcode', 116, y + 1);
    doc.text('Voorraad', 146, y + 1);
    doc.text('Uitgeleend', 160, y + 1);
    doc.text('Beschikbaar', 174, y + 1);
    y += 8;

    // Rows
    doc.setFontSize(8);
    filteredMaterials.forEach((m) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const borrowed = loans
        .filter(l => l.materialId === m.id && l.status === 'uitgeleend')
        .reduce((sum, l) => sum + l.quantity, 0);
      const available = calculateAvailableQuantity(m, loans);
      const catName = categories.find(c => c.id === m.categoryId)?.name || '-';

      doc.setTextColor(31, 23, 53);
      doc.text(m.name.substring(0, 32), 16, y);
      doc.text(catName.substring(0, 22), 76, y);
      doc.text(m.optionalBarcode || '-', 116, y);
      doc.text(String(m.totalQuantity), 146, y);
      doc.text(String(borrowed), 160, y);
      if (available === 0) {
        doc.setTextColor(220, 38, 38);
      } else if (available <= 2) {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(22, 163, 74);
      }
      doc.text(String(available), 174, y);

      y += 6;
      doc.setDrawColor(240, 235, 247);
      doc.line(14, y - 2, 196, y - 2);
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 145, 165);
      doc.text(`Summa Plus Balanslijst — Pagina ${i}/${pageCount} — ${dateStr}`, 14, 290);
    }

    doc.save(`balanslijst-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#24126E]">
              Balanslijst
            </h3>
            <span className="text-xs font-bold bg-indigo-50 text-[#24126E] px-2.5 py-0.5 rounded-full">
              {materials.length} artikelen
            </span>
          </div>
          <p className="text-xs text-[#645E78]">
            Volledig overzicht van alle materialen met voorraad, uitgeleend aantal en beschikbaarheid.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="px-4 py-2.5 bg-[#24126E] hover:bg-[#1a0c52] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-[#24126E]/20 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Exporteren als PDF</span>
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-[#24126E]" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Totaal voorraad</span>
          </div>
          <p className="text-2xl font-bold text-[#24126E]">
            {materials.reduce((s, m) => s + m.totalQuantity, 0)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-[#D70096]" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Uitgeleend</span>
          </div>
          <p className="text-2xl font-bold text-[#D70096]">{activeBorrowedTotal}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-red-600" />
            <span className="text-[10px] font-bold uppercase text-slate-400">Te laat</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#645E78]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek op naam of barcode..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#E5DFEE] text-xs text-[#1F1735] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 bg-white rounded-xl border border-[#E5DFEE] text-xs font-semibold text-[#24126E] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
        >
          <option value="all">Alle categorieën</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Balance table */}
      <div className="bg-white rounded-2xl border border-[#E5DFEE] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F5FA] border-b border-[#E5DFEE] text-[#24126E] uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Materiaal</th>
                <th className="px-4 py-3.5">Categorie</th>
                <th className="px-4 py-3.5">Barcode</th>
                <th className="px-4 py-3.5 text-center">Voorraad</th>
                <th className="px-4 py-3.5 text-center">Uitgeleend</th>
                <th className="px-4 py-3.5 text-center">Beschikbaar</th>
                <th className="px-4 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBF7]">
              {filteredMaterials.map((m) => {
                const borrowed = loans
                  .filter(l => l.materialId === m.id && l.status === 'uitgeleend')
                  .reduce((sum, l) => sum + l.quantity, 0);
                const available = calculateAvailableQuantity(m, loans);
                const catName = categories.find(c => c.id === m.categoryId)?.name || '-';

                return (
                  <tr key={m.id} className="hover:bg-[#F7F5FA] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-[#24126E] text-sm">{m.name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block bg-[#EEECF8] text-[#24126E] font-medium px-2 py-0.5 rounded text-[10px]">
                        {catName}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[#645E78] font-mono text-[11px]">
                      {m.optionalBarcode || '-'}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-[#24126E]">
                      {m.totalQuantity}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-[#D70096]">
                      {borrowed}
                    </td>
                    <td className="px-4 py-3.5 text-center font-extrabold">
                      <span className={available === 0 ? 'text-red-600' : available <= 2 ? 'text-amber-600' : 'text-emerald-700'}>
                        {available}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {available === 0 ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded-lg">
                          <AlertTriangle className="w-3 h-3" />
                          Niet beschikbaar
                        </span>
                      ) : available <= 2 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-lg">
                          Lage voorraad
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-lg">
                          <CheckCircle2 className="w-3 h-3" />
                          Op voorraad
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
