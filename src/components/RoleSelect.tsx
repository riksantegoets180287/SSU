import React from 'react';
import { UserCheck, ShieldCheck, ArrowRight, BookOpen, Layers, CircleCheck as CheckCircle2 } from 'lucide-react';
import { AppView } from '../types';

interface RoleSelectProps {
  onSelectRole: (view: AppView) => void;
  onBackToPortal?: () => void;
  activeLoansCount: number;
  availableMaterialsCount: number;
}

export const RoleSelect: React.FC<RoleSelectProps> = ({
  onSelectRole,
  onBackToPortal,
  activeLoansCount,
  availableMaterialsCount,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-14">
      {/* Top back to portal link */}
      {onBackToPortal && (
        <div className="mb-6 flex justify-start">
          <button
            onClick={onBackToPortal}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#24126E] bg-white hover:bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Terug naar Hoofdkeuze (Uitleen / Service)</span>
          </button>
        </div>
      )}

      {/* Intro hero section */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-[#D70096]"></span>
          <span className="text-[11px] font-bold text-[#24126E] tracking-wider uppercase">
            Summa Plus &bull; Uitleensysteem
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#24126E] tracking-tight mb-3">
          Kies jouw rol voor Uitleen
        </h1>
        
        <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-xl mx-auto">
          Het uitlenen gebeurt aan de centrale balie. Kies hieronder jouw rol om in te loggen in het systeem.
        </p>

        {/* Quick status pill */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 text-xs text-slate-600">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-100 shadow-xs">
            <Layers className="w-4 h-4 text-[#24126E]" />
            <span><strong className="text-[#24126E]">{availableMaterialsCount}</strong> materialen in beheer</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-100 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-[#D70096]" />
            <span><strong className="text-[#D70096]">{activeLoansCount}</strong> actieve uitleningen</span>
          </div>
        </div>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Desk Employee Card (Baliemedewerker) */}
        <button
          id="btn-role-desk-worker"
          onClick={() => onSelectRole('user_catalog')}
          className="group flex flex-col justify-between text-left p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/90 hover:border-[#D70096] transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-pink-50 group-hover:bg-[#D70096] flex items-center justify-center text-[#D70096] group-hover:text-white transition-colors duration-200 mb-6">
              <UserCheck className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D70096] block mb-1">
              Rol 1 &bull; Dagelijkse Uitgifte & Inname
            </span>

            <h2 className="text-xl sm:text-2xl font-bold text-[#24126E] mb-2 tracking-tight">
              Baliemedewerker
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
              Voor baliemedewerkers en studenten. Registreer snel uitleningen aan collega's/studenten en neem ingeleverde artikelen met 1 klik retour.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-[#24126E] group-hover:text-[#D70096] transition-colors">
              Uitleenbalie openen
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#24126E] group-hover:bg-[#D70096] text-white flex items-center justify-center transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </button>

        {/* Admin Card (Beheerder) */}
        <button
          id="btn-role-admin"
          onClick={() => onSelectRole('admin_pin')}
          className="group flex flex-col justify-between text-left p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/90 hover:border-[#24126E] transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-[#24126E] flex items-center justify-center text-[#24126E] group-hover:text-white transition-colors duration-200 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-widest text-[#24126E] block mb-1">
              Rol 2 &bull; Voorraadbeheer & Instellingen
            </span>

            <h2 className="text-xl sm:text-2xl font-bold text-[#24126E] mb-2 tracking-tight">
              Beheerder / Admin
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
              Beheer materialen, voorraden en categorieën. Bekijk de complete uitleenhistorie, rapportages en voer voorraadcorrecties uit.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#24126E]">
                Beheerderspaneel openen
              </span>
              <span className="text-[10px] bg-indigo-50 text-[#24126E] px-2 py-0.5 rounded font-mono font-bold">
                PIN: 102938
              </span>
            </div>
            <div className="w-7 h-7 rounded-xl bg-[#24126E] text-white flex items-center justify-center transition-colors">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
