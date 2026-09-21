import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Users, 
  Package, 
  ArrowRight,
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { Loan, Category } from '../../types';
import { formatDutchDateTime } from '../../lib/storage';

interface AdminHistoryProps {
  loans: Loan[];
  categories: Category[];
}

export const AdminHistory: React.FC<AdminHistoryProps> = ({ loans, categories }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'uitgeleend' | 'teruggebracht'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Unique teams list for filter
  const uniqueTeams = useMemo(() => {
    const teams = Array.from(new Set(loans.map(l => l.borrowerTeam).filter(Boolean)));
    return teams.sort();
  }, [loans]);

  // Filtered loans
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // Status
      if (statusFilter !== 'all' && loan.status !== statusFilter) {
        return false;
      }
      // Category
      if (categoryFilter !== 'all' && loan.categoryName !== categoryFilter) {
        return false;
      }
      // Team
      if (teamFilter !== 'all' && loan.borrowerTeam !== teamFilter) {
        return false;
      }
      // Search (borrower name or material name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBorrower = loan.borrowerName.toLowerCase().includes(q);
        const matchMaterial = loan.materialName.toLowerCase().includes(q);
        const matchTeam = loan.borrowerTeam.toLowerCase().includes(q);
        return matchBorrower || matchMaterial || matchTeam;
      }
      return true;
    });
  }, [loans, statusFilter, categoryFilter, teamFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header with Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#24126E]">
                Volledige uitleenhistorie
              </h3>
              <span className="text-xs font-bold bg-[#EEECF8] text-[#24126E] px-2.5 py-0.5 rounded-full">
                {loans.length} registraties
              </span>
            </div>
            <p className="text-xs text-[#645E78]">
              Doorzoek alle uitleningen en inleveringen sinds de start.
            </p>
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#645E78]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op lener, team of materiaal..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-[#E5DFEE] text-xs text-[#1F1735] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
            />
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-[#E5DFEE]">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#645E78] mb-1">
              Status filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE] text-xs font-semibold text-[#24126E] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
            >
              <option value="all">Alle statussen</option>
              <option value="uitgeleend">Alleen momenteel uitgeleend</option>
              <option value="teruggebracht">Alleen teruggebracht</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#645E78] mb-1">
              Categorie filter
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE] text-xs font-semibold text-[#24126E] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
            >
              <option value="all">Alle categorieën</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-[#645E78] mb-1">
              Team / Opleiding filter
            </label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F7F5FA] rounded-xl border border-[#E5DFEE] text-xs font-semibold text-[#24126E] focus:outline-hidden focus:ring-2 focus:ring-[#24126E]"
            >
              <option value="all">Alle teams</option>
              {uniqueTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* History Table / Records */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5DFEE] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-[#F7F5FA] text-[#645E78] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E5DFEE]">
            <History className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-bold text-[#24126E] mb-1">
            Geen uitleningen gevonden
          </h4>
          <p className="text-xs text-[#645E78]">
            {loans.length === 0 
              ? 'Er zijn nog geen uitleningen geregistreerd in het systeem.' 
              : 'Geen resultaten voor de geselecteerde filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5DFEE] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5FA] border-b border-[#E5DFEE] text-[#24126E] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Lener & Team</th>
                  <th className="px-4 py-3.5">Materiaal & Categorie</th>
                  <th className="px-4 py-3.5">Aantal</th>
                  <th className="px-4 py-3.5">Geleend op</th>
                  <th className="px-5 py-3.5">Ingeleverd op</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBF7]">
                {filteredLoans.map((loan) => {
                  const isReturned = loan.status === 'teruggebracht';

                  return (
                    <tr key={loan.id} className="hover:bg-[#FDF0F8]/30 transition-colors">
                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        {isReturned ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Teruggebracht
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[#FDF0F8] text-[#D70096] text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#D70096]/20">
                            <Clock className="w-3.5 h-3.5" />
                            Uitgeleend
                          </span>
                        )}
                      </td>

                      {/* Borrower */}
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-bold text-[#24126E] text-sm leading-tight">
                            {loan.borrowerName}
                          </p>
                          <span className="text-[11px] text-[#645E78] font-medium">
                            {loan.borrowerTeam}
                          </span>
                        </div>
                      </td>

                      {/* Material */}
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-bold text-[#24126E] text-sm">
                            {loan.materialName}
                          </p>
                          <span className="inline-block bg-[#EEECF8] text-[#24126E] font-medium px-2 py-0.5 rounded text-[10px] mt-0.5">
                            {loan.categoryName}
                          </span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-4">
                        <span className="font-extrabold text-[#24126E] text-xs">
                          {loan.quantity}x
                        </span>
                      </td>

                      {/* Borrowed Date */}
                      <td className="px-4 py-4 text-[#645E78] text-[11px]">
                        <p className="font-medium text-[#24126E]">{loan.borrowedAtDate}</p>
                        <p className="text-[10px]">{loan.borrowedAtTime} uur</p>
                      </td>

                      {/* Returned Date */}
                      <td className="px-5 py-4 text-[11px]">
                        {loan.returnedAt ? (
                          <span className="text-emerald-700 font-medium">
                            {formatDutchDateTime(loan.returnedAt)}
                          </span>
                        ) : (
                          <span className="text-[#645E78]/50 italic">Nog niet ingeleverd</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
