import React from 'react';
import { Package, Shield, User, ArrowLeft, RotateCcw, Wrench, Home, Utensils } from 'lucide-react';
import { AppView, BorrowerSession, MainSystemModule } from '../types';

interface HeaderProps {
  currentView: AppView;
  activeModule: MainSystemModule;
  onNavigateView: (view: AppView) => void;
  onSwitchModule: (module: MainSystemModule) => void;
  userSession: BorrowerSession | null;
  onLogoutAdmin: () => void;
  onResetUserSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  activeModule,
  onNavigateView,
  onSwitchModule,
  userSession,
  onLogoutAdmin,
  onResetUserSession,
}) => {
  return (
    <header id="app-header" className="h-16 bg-[#24126E] text-white flex items-center justify-between px-4 sm:px-8 shadow-md shrink-0 sticky top-0 z-40">
      {/* Brand & Logo with Module switcher */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div 
          onClick={() => onSwitchModule('portal')}
          className="flex items-center gap-3 cursor-pointer group select-none"
          id="header-brand"
        >
          <div className="w-8 h-8 bg-[#D70096] rounded-lg flex items-center justify-center font-bold text-base text-white shadow-sm transition-transform group-hover:scale-105">
            S
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-white">
              Summa Plus
            </span>
          </div>
        </div>

        {/* Module Pill Tabs */}
        <div className="hidden md:flex items-center bg-white/10 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => onSwitchModule('portal')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeModule === 'portal'
                ? 'bg-white text-[#24126E] shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Portaal</span>
          </button>
          
          <button
            onClick={() => onSwitchModule('uitleen')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeModule === 'uitleen'
                ? 'bg-[#D70096] text-white shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Uitleensysteem</span>
          </button>

          <button
            onClick={() => onSwitchModule('service')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeModule === 'service'
                ? 'bg-[#D70096] text-white shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Servicesysteem</span>
          </button>

          <button
            onClick={() => onSwitchModule('horeca')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeModule === 'horeca'
                ? 'bg-[#D70096] text-white shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Horeca & Catering</span>
          </button>
        </div>
      </div>

      {/* Dynamic Context Header Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile active module tag */}
        <div className="md:hidden">
          {activeModule === 'uitleen' && (
            <button
              onClick={() => onSwitchModule('portal')}
              className="text-[11px] font-bold bg-[#D70096] text-white px-2.5 py-1 rounded-lg flex items-center gap-1"
            >
              <Package className="w-3 h-3" />
              <span>Uitleen</span>
            </button>
          )}
          {activeModule === 'service' && (
            <button
              onClick={() => onSwitchModule('portal')}
              className="text-[11px] font-bold bg-[#D70096] text-white px-2.5 py-1 rounded-lg flex items-center gap-1"
            >
              <Wrench className="w-3 h-3" />
              <span>Service</span>
            </button>
          )}
          {activeModule === 'horeca' && (
            <button
              onClick={() => onSwitchModule('portal')}
              className="text-[11px] font-bold bg-[#D70096] text-white px-2.5 py-1 rounded-lg flex items-center gap-1"
            >
              <Utensils className="w-3 h-3" />
              <span>Horeca</span>
            </button>
          )}
        </div>

        {activeModule === 'uitleen' && currentView === 'user_catalog' && userSession && (
          <>
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[10px] opacity-75 uppercase tracking-widest font-bold text-white/90">
                Ingelogd als
              </span>
              <span className="text-xs sm:text-sm font-medium text-white">
                {userSession.name} <span className="opacity-70">&bull; {userSession.team}</span>
              </span>
            </div>
            <button
              id="btn-switch-user"
              onClick={onResetUserSession}
              className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors border border-white/10 cursor-pointer"
              title="Wissel van lener"
            >
              Uitloggen
            </button>
          </>
        )}

        {activeModule === 'uitleen' && currentView === 'admin_dashboard' && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[10px] opacity-75 uppercase tracking-widest font-bold text-white/90">
                Modus
              </span>
              <span className="text-xs font-medium text-white flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#D70096]" /> Beheerder Actief
              </span>
            </div>
            <button
              id="btn-logout-admin"
              onClick={onLogoutAdmin}
              className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors border border-white/10 cursor-pointer"
            >
              Uitloggen
            </button>
          </div>
        )}

        {activeModule === 'uitleen' && currentView === 'admin_pin' && (
          <button
            id="btn-back-to-home"
            onClick={() => onNavigateView('role_select')}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors border border-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Terug</span>
          </button>
        )}

        {activeModule === 'uitleen' && currentView === 'user_register' && (
          <button
            id="btn-register-back-to-home"
            onClick={() => onNavigateView('role_select')}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors border border-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Startscherm</span>
          </button>
        )}
      </div>
    </header>
  );
};
