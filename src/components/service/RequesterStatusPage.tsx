import React, { useState, useEffect } from 'react';
import { Wrench, Search, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react';
import { ServiceTicket, TicketStatus } from '../types';

interface RequesterStatusPageProps {
  tickets: ServiceTicket[];
  requesterName: string;
}

const statusConfig: Record<TicketStatus, { label: string; icon: React.ReactNode; className: string }> = {
  open: { label: 'Open', icon: <Clock className="w-3.5 h-3.5" />, className: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_behandeling: { label: 'In behandeling', icon: <Clock className="w-3.5 h-3.5" />, className: 'bg-amber-100 text-amber-800 border-amber-200' },
  wachtlijst: { label: 'Op wachtlijst', icon: <Clock className="w-3.5 h-3.5" />, className: 'bg-purple-100 text-purple-700 border-purple-200' },
  afgewezen: { label: 'Afgewezen', icon: <X className="w-3.5 h-3.5" />, className: 'bg-red-100 text-red-700 border-red-200' },
  afgerond: { label: 'Afgerond', icon: <CheckCircle2 className="w-3.5 h-3.5" />, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  geannuleerd: { label: 'Geannuleerd', icon: <X className="w-3.5 h-3.5" />, className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const RequesterStatusPage: React.FC<RequesterStatusPageProps> = ({ tickets, requesterName }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const myTickets = tickets.filter(t =>
    t.requesterName?.toLowerCase() === requesterName.toLowerCase()
  );

  const filteredTickets = myTickets.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.ticketNumber?.toLowerCase().includes(q) ||
      t.title?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#F7F5FA] to-amber-50/30 px-4 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#24126E] text-white shadow-lg mb-2">
            <Wrench className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#24126E]">Mijn Klusjes Status</h1>
          <p className="text-sm text-slate-500">
            Overzicht van al uw aangemelde klussen. Alleen TK nummers en status worden getoond.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek op TK nummer of titel..."
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#24126E]"
          />
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-3">
          {(['open', 'in_behandeling', 'afgerond', 'afgewezen'] as TicketStatus[]).map(status => {
            const count = myTickets.filter(t => t.status === status).length;
            const config = statusConfig[status];
            return (
              <div key={status} className="bg-white rounded-2xl border border-slate-100 p-3 text-center shadow-xs">
                <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg mb-1.5 border ${config.className}`}>
                  {config.icon}
                </div>
                <p className="text-xl font-bold text-[#24126E]">{count}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{config.label}</p>
              </div>
            );
          })}
        </div>

        {/* Ticket list */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-700">Geen klussen gevonden</h3>
            <p className="text-xs text-slate-500 mt-1">
              {myTickets.length === 0
                ? 'Er zijn nog geen klussen aangemeld onder uw naam.'
                : 'Geen klussen gevonden met deze zoekterm.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const config = statusConfig[ticket.status] || statusConfig.open;
              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${config.className}`}>
                      {config.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#24126E] font-mono">
                        {ticket.ticketNumber}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {ticket.title}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-full border ${config.className}`}>
                    {config.icon}
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-[11px] text-slate-400">
            Summa Plus Service Systeem — Voor meer informatie neem contact op met de balie.
          </p>
        </div>
      </div>
    </div>
  );
};
