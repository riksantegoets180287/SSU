import React from 'react';
import { 
  Package, 
  Wrench, 
  ArrowRight, 
  Clock,
  Utensils,
  CalendarCheck,
  CheckCircle2
} from 'lucide-react';
import { MainSystemModule } from '../types';

export interface TicketCategoryStat {
  total: number;
  unhandled: number; // open + in_behandeling
  newCount?: number;  // status open
}

interface MainPortalProps {
  onSelectModule: (module: MainSystemModule) => void;
  loansStats: {
    total: number;
    active: number;
  };
  serviceKlussenStats: TicketCategoryStat;
  vergaderStats: TicketCategoryStat;
  horecaStats: TicketCategoryStat;
  // Optional fallback values
  materialsCount?: number;
  activeLoansCount?: number;
  openTicketsCount?: number;
  totalTicketsCount?: number;
  horecaDishesCount?: number;
}

export const MainPortal: React.FC<MainPortalProps> = ({
  onSelectModule,
  loansStats = { total: 0, active: 0 },
  serviceKlussenStats = { total: 0, unhandled: 0, newCount: 0 },
  vergaderStats = { total: 0, unhandled: 0, newCount: 0 },
  horecaStats = { total: 0, unhandled: 0, newCount: 0 },
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-14">
      {/* 4 Ticket Kopjes: Uitleningen, Serviceklussen, Vergaderverzoeken, Bestelde bestellingen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 max-w-6xl mx-auto mb-8 sm:mb-12">
        {/* Kopje 1: Uitleningen */}
        <button
          type="button"
          onClick={() => onSelectModule('uitleen')}
          className="group text-left bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-[#24126E] transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#24126E]">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#24126E] flex items-center justify-center group-hover:bg-[#24126E] group-hover:text-white transition-colors">
                <Package className="w-4 h-4" />
              </div>
              <span className="tracking-tight">Uitleningen</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#24126E] transition-colors">
              {loansStats.total} totaal
            </span>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#24126E] tracking-tight block">
                {loansStats.total}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">geregistreerd</span>
            </div>

            {loansStats.active > 0 ? (
              <div className="flex flex-col items-end">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-[#24126E] border border-indigo-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#24126E]"></span>
                  </span>
                  <span>{loansStats.active} actief uitgeleend</span>
                </span>
                <span className="text-[10px] text-indigo-700 font-bold mt-0.5">niet afgehandeld</span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alles ingeleverd</span>
              </span>
            )}
          </div>
        </button>

        {/* Kopje 2: Serviceklussen */}
        <button
          type="button"
          onClick={() => onSelectModule('service')}
          className="group text-left bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-[#D70096] transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#24126E]">
              <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#D70096] flex items-center justify-center group-hover:bg-[#D70096] group-hover:text-white transition-colors">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="tracking-tight">Serviceklussen</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#D70096] transition-colors">
              {serviceKlussenStats.total} totaal
            </span>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#24126E] tracking-tight block">
                {serviceKlussenStats.total}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">klusjes & storingen</span>
            </div>

            {serviceKlussenStats.unhandled > 0 ? (
              <div className="flex flex-col items-end">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-pink-50 text-[#D70096] border border-pink-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D70096] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D70096]"></span>
                  </span>
                  <span>{serviceKlussenStats.unhandled} niet afgehandeld</span>
                </span>
                {serviceKlussenStats.newCount !== undefined && serviceKlussenStats.newCount > 0 && (
                  <span className="text-[10px] text-pink-700 font-bold mt-0.5">
                    waarvan {serviceKlussenStats.newCount} nieuw
                  </span>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alles afgehandeld</span>
              </span>
            )}
          </div>
        </button>

        {/* Kopje 3: Vergaderverzoeken */}
        <button
          type="button"
          onClick={() => onSelectModule('service')}
          className="group text-left bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-purple-500 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#24126E]">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span className="tracking-tight">Vergaderverzoeken</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-purple-700 transition-colors">
              {vergaderStats.total} totaal
            </span>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#24126E] tracking-tight block">
                {vergaderStats.total}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">ruimtes & zalen</span>
            </div>

            {vergaderStats.unhandled > 0 ? (
              <div className="flex flex-col items-end">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-800 border border-purple-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-700"></span>
                  </span>
                  <span>{vergaderStats.unhandled} niet afgehandeld</span>
                </span>
                {vergaderStats.newCount !== undefined && vergaderStats.newCount > 0 && (
                  <span className="text-[10px] text-purple-700 font-bold mt-0.5">
                    waarvan {vergaderStats.newCount} nieuw
                  </span>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alles afgehandeld</span>
              </span>
            )}
          </div>
        </button>

        {/* Kopje 4: Bestelde bestellingen */}
        <button
          type="button"
          onClick={() => onSelectModule('horeca')}
          className="group text-left bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 hover:border-amber-500 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#24126E]">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Utensils className="w-4 h-4" />
              </div>
              <span className="tracking-tight">Bestelde bestellingen</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-700 transition-colors">
              {horecaStats.total} totaal
            </span>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-2xl sm:text-3xl font-black text-[#24126E] tracking-tight block">
                {horecaStats.total}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">eten & catering</span>
            </div>

            {horecaStats.unhandled > 0 ? (
              <div className="flex flex-col items-end">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
                  </span>
                  <span>{horecaStats.unhandled} niet afgehandeld</span>
                </span>
                {horecaStats.newCount !== undefined && horecaStats.newCount > 0 && (
                  <span className="text-[10px] text-amber-800 font-bold mt-0.5">
                    waarvan {horecaStats.newCount} nieuw
                  </span>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alles afgehandeld</span>
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Main 3 Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 max-w-6xl mx-auto">
        {/* Choice 1: Uitleensysteem */}
        <div
          id="card-choice-uitleen"
          onClick={() => onSelectModule('uitleen')}
          className="group flex flex-col justify-between text-left p-6 sm:p-7 bg-white rounded-3xl border border-slate-200/90 hover:border-[#24126E] transition-all duration-200 shadow-xs hover:shadow-xl cursor-pointer relative overflow-hidden"
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#24126E] opacity-90"></div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-[#24126E] flex items-center justify-center text-[#24126E] group-hover:text-white transition-colors duration-200 shadow-xs">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-[#24126E] px-3 py-1 rounded-full">
                Materiaalbeheer
              </span>
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest text-[#D70096] block mb-1">
              Summa Plus
            </span>

            <h2 className="text-xl sm:text-2xl font-bold text-[#24126E] mb-3 tracking-tight">
              Uitleensysteem
            </h2>

            <p className="text-xs text-slate-500 mb-4 line-clamp-2">
              Uitleen van apparatuur, gereedschap en leermiddelen met barcodescanner en balie-inname.
            </p>

            {/* Passende afbeelding voor Uitleensysteem */}
            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] mb-5 border border-slate-100 bg-slate-100 shadow-inner group-hover:shadow-md transition-shadow">
              <img
                src="https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80"
                alt="Uitleensysteem apparatuur en materialen"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-[#24126E] group-hover:text-[#D70096] transition-colors">
              Naar Uitleensysteem
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#24126E] group-hover:bg-[#D70096] text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Choice 2: Servicesysteem (Klusjes & Vergaderruimtes) */}
        <div
          id="card-choice-service"
          onClick={() => onSelectModule('service')}
          className="group flex flex-col justify-between text-left p-6 sm:p-7 bg-white rounded-3xl border border-slate-200/90 hover:border-[#D70096] transition-all duration-200 shadow-xs hover:shadow-xl cursor-pointer relative overflow-hidden"
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#D70096] opacity-90"></div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 group-hover:bg-[#D70096] flex items-center justify-center text-[#D70096] group-hover:text-white transition-colors duration-200 shadow-xs">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-pink-50 text-[#D70096] px-3 py-1 rounded-full">
                Klussen & Ruimtes
              </span>
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest text-[#24126E] block mb-1">
              Summa Plus Facilitair
            </span>

            <h2 className="text-xl sm:text-2xl font-bold text-[#24126E] mb-3 tracking-tight">
              Servicesysteem
            </h2>

            <p className="text-xs text-slate-500 mb-4 line-clamp-2">
              Klusjes melden, meubilair verplaatsen, storingen en vergaderruimtes klaarzetten met koffie/thee.
            </p>

            {/* Passende afbeelding voor Servicesysteem */}
            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] mb-5 border border-slate-100 bg-slate-100 shadow-inner group-hover:shadow-md transition-shadow">
              <img
                src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
                alt="Servicesysteem klussen en onderhoud"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-[#24126E] group-hover:text-[#D70096] transition-colors">
              Naar Servicesysteem
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#D70096] group-hover:bg-[#b5007e] text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Choice 3: Horeca & Catering */}
        <div
          id="card-choice-horeca"
          onClick={() => onSelectModule('horeca')}
          className="group flex flex-col justify-between text-left p-6 sm:p-7 bg-white rounded-3xl border border-slate-200/90 hover:border-amber-500 transition-all duration-200 shadow-xs hover:shadow-xl cursor-pointer relative overflow-hidden"
        >
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500 opacity-90"></div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 group-hover:bg-amber-600 flex items-center justify-center text-amber-700 group-hover:text-white transition-colors duration-200 shadow-xs">
                <Utensils className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-950 px-3 py-1 rounded-full border border-amber-300">
                Weekmenu & Keuken
              </span>
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest text-[#24126E] block mb-1">
              Summa Plus Horeca
            </span>

            <h2 className="text-xl sm:text-2xl font-bold text-[#24126E] mb-3 tracking-tight">
              Horeca & Catering
            </h2>

            <p className="text-xs text-slate-500 mb-4 line-clamp-2">
              Wekelijks wisselend menu, maaltijden bestellen met live portieteller en afhalen bij de DV Balie.
            </p>

            {/* Passende afbeelding voor Horeca */}
            <div className="relative rounded-2xl overflow-hidden aspect-[16/10] mb-5 border border-slate-100 bg-slate-100 shadow-inner group-hover:shadow-md transition-shadow">
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
                alt="Horeca weekmenu en maaltijden"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-[#24126E] group-hover:text-amber-700 transition-colors">
              Naar Horeca & Bestellen
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-600 group-hover:bg-amber-700 text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-xs">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
