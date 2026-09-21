import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Search, 
  Clock, 
  Calendar, 
  User, 
  Users, 
  Package, 
  RotateCcw,
  Sparkles,
  Inbox,
  ArrowDownLeft
} from 'lucide-react';
import { Loan } from '../../types';

interface AdminActiveLoansProps {
  loans: Loan[];
  onReturnLoan: (loanId: string) => void;
}

export const AdminActiveLoans: React.FC<AdminActiveLoansProps> = ({
  loans,
  onReturnLoan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [returningId, setReturningId] = useState<string | null>(null);

  const activeLoans = useMemo(() => {
    return loans.filter(l => l.status === 'uitgeleend');
  }, [loans]);

  const filteredLoans = useMemo(() => {
    if (!searchQuery.trim()) return activeLoans;
    const q = searchQuery.toLowerCase().trim();
    return activeLoans.filter(l => 
      l.borrowerName.toLowerCase().includes(q) ||
      l.borrowerTeam.toLowerCase().includes(q) ||
      l.materialName.toLowerCase().includes(q) ||
      l.categoryName.toLowerCase().includes(q)
    );
  }, [activeLoans, searchQuery]);

  const handleReturn = (loanId: string) => {
    setReturningId(loanId);
    setTimeout(() => {
      onReturnLoan(loanId);
      setReturningId(null);
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#24126E]">
              Actief uitgeleende materialen
            </h3>
            <span className="text-xs font-bold bg-[#D70096] text-white px-2.5 py-0.5 rounded-full">
              {activeLoans.length}
            </span>
          </div>
          <p className="text-xs text-[#645E78]">
            Overzicht van alle items die momenteel in bezit zijn van medewerkers of studenten.
          </p>
        </div>

        {/* Search */}
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

      {/* Active Loans Table/Cards */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E5DFEE] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h4 className="text-lg font-bold text-[#24126E] mb-1">
            {activeLoans.length === 0 ? 'Geen actieve uitleningen' : 'Geen resultaten gevonden'}
          </h4>
          <p className="text-xs text-[#645E78] leading-relaxed">
            {activeLoans.length === 0
              ? 'Alle geleende artikelen zijn netjes geretourneerd naar de opslag.'
              : 'Geen uitleningen gevonden die overeenkomen met je zoekfilter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5DFEE] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F5FA] border-b border-[#E5DFEE] text-[#24126E] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Lener & Team</th>
                  <th className="px-4 py-3.5">Materiaal & Categorie</th>
                  <th className="px-4 py-3.5">Aantal</th>
                  <th className="px-4 py-3.5">Uitgeleend op</th>
                  <th className="px-5 py-3.5 text-right">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBF7]">
                {filteredLoans.map((loan) => {
                  const isProcessing = returningId === loan.id;

                  return (
                    <tr key={loan.id} className="hover:bg-[#FDF0F8]/30 transition-colors">
                      {/* Borrower */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#24126E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {loan.borrowerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#24126E] text-sm leading-tight">
                              {loan.borrowerName}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D70096]">
                              <Users className="w-3 h-3" />
                              {loan.borrowerTeam}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Material & Category */}
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
                        <span className="inline-flex items-center justify-center font-extrabold text-[#24126E] bg-[#F7F5FA] border border-[#E5DFEE] px-3 py-1 rounded-lg text-xs">
                          {loan.quantity}x
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-4">
                        <div className="space-y-0.5 text-[11px] text-[#645E78]">
                          <div className="flex items-center gap-1 font-medium text-[#24126E]">
                            <Calendar className="w-3.5 h-3.5 text-[#645E78]" />
                            <span>{loan.borrowedAtDate}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#645E78]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{loan.borrowedAtTime} uur</span>
                          </div>
                        </div>
                      </td>

                      {/* Return Action Button */}
                      <td className="px-5 py-4 text-right">
                        <button
                          id={`btn-return-loan-${loan.id}`}
                          disabled={isProcessing}
                          onClick={() => handleReturn(loan.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Markeer als teruggebracht</span>
                        </button>
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
