import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  X, 
  Wrench, 
  ShieldCheck, 
  Package, 
  User, 
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Layers
} from 'lucide-react';
import { Loan, LoanReturnCondition } from '../../types';

interface ReturnConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onConfirmReturn: (
    loanId: string,
    condition: LoanReturnCondition,
    notes?: string,
    createServiceTicket?: boolean,
    returnQuantity?: number
  ) => void;
}

export const ReturnConditionModal: React.FC<ReturnConditionModalProps> = ({
  isOpen,
  onClose,
  loan,
  onConfirmReturn,
}) => {
  const [condition, setCondition] = useState<LoanReturnCondition>('goed');
  const [damageNotes, setDamageNotes] = useState('');
  const [createTicket, setCreateTicket] = useState(true);
  const [returnQuantity, setReturnQuantity] = useState<number>(1);

  // Sync quantity when a loan is selected
  useEffect(() => {
    if (loan) {
      setReturnQuantity(loan.quantity);
      setCondition('goed');
      setDamageNotes('');
      setCreateTicket(true);
    }
  }, [loan]);

  if (!isOpen || !loan) return null;

  const isPartial = returnQuantity < loan.quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReturn(
      loan.id,
      condition,
      damageNotes.trim() || undefined,
      condition === 'defect' ? createTicket : false,
      returnQuantity
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1F1735]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-[#24126E] to-[#3B1E82] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-[#FF75C8]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-200 block">
                Inname & Conditiecheck
              </span>
              <h3 className="text-lg font-extrabold text-white">
                Materiaal Retour Ontvangen
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loan Info Summary Card */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-[#F7F5FA]">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D70096] bg-pink-50 px-2 py-0.5 rounded-md">
                  {loan.categoryName}
                </span>
                <h4 className="text-base font-extrabold text-[#24126E] mt-1">
                  {loan.materialName}
                </h4>
              </div>
              <span className="text-xs font-bold text-[#24126E] bg-indigo-50 px-2.5 py-1 rounded-lg">
                Totaal geleend: {loan.quantity}x
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{loan.borrowerName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="text-slate-400">Team:</span>
                <span className="font-medium text-slate-700 truncate">{loan.borrowerTeam}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 col-span-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Uitgeleend op {loan.borrowedAtDate} om {loan.borrowedAtTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Quantity Selector for partial return (e.g. 1 of 2 laptops) */}
          {loan.quantity > 1 && (
            <div className="bg-[#F7F5FA] p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#24126E] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#D70096]" />
                  <span>Aantal in te nemen exemplaren:</span>
                </label>
                <span className="text-xs font-black text-[#D70096]">
                  {returnQuantity} van de {loan.quantity} stuks
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1">
                  <button
                    type="button"
                    onClick={() => setReturnQuantity(prev => Math.max(1, prev - 1))}
                    disabled={returnQuantity <= 1}
                    className="w-8 h-8 rounded-lg bg-[#F7F5FA] hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-extrabold text-[#24126E]">
                    {returnQuantity}x
                  </span>
                  <button
                    type="button"
                    onClick={() => setReturnQuantity(prev => Math.min(loan.quantity, prev + 1))}
                    disabled={returnQuantity >= loan.quantity}
                    className="w-8 h-8 rounded-lg bg-[#F7F5FA] hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnQuantity(1)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      returnQuantity === 1 && loan.quantity > 1
                        ? 'bg-[#24126E] text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    1 exemplaar
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnQuantity(loan.quantity)}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      returnQuantity === loan.quantity
                        ? 'bg-[#24126E] text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Alles ({loan.quantity}x)
                  </button>
                </div>
              </div>

              {isPartial && (
                <div className="p-2.5 bg-indigo-50 text-[#24126E] rounded-xl text-[11px] font-medium border border-indigo-100 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#D70096] shrink-0" />
                  <span>
                    <strong>Deelinname:</strong> {loan.quantity - returnQuantity} exemplaar/exemplaren blijft nog geregistreerd op naam van <strong>{loan.borrowerName}</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Condition Options */}
          <div>
            <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2">
              Staat van {returnQuantity > 1 ? `deze ${returnQuantity} exemplaren` : 'het ingeleverde materiaal'}:
            </label>

            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: Goed */}
              <button
                type="button"
                onClick={() => setCondition('goed')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  condition === 'goed'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 ${condition === 'goed' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold leading-tight">In goede staat</span>
                <span className="text-[10px] text-slate-400">Direct gereed</span>
              </button>

              {/* Option 2: Opmerking */}
              <button
                type="button"
                onClick={() => setCondition('opmerking')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  condition === 'opmerking'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${condition === 'opmerking' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold leading-tight">Lichte slijtage</span>
                <span className="text-[10px] text-slate-400">Met opmerking</span>
              </button>

              {/* Option 3: Defect / Schade */}
              <button
                type="button"
                onClick={() => setCondition('defect')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  condition === 'defect'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-xs ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className={`w-5 h-5 ${condition === 'defect' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className="text-xs font-bold leading-tight">Defect / Schade</span>
                <span className="text-[10px] text-slate-400">Reparatie nodig</span>
              </button>
            </div>
          </div>

          {/* Condition Notes / Damage Description */}
          {condition !== 'goed' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {condition === 'defect' ? 'Beschrijf de schade of het defect *' : 'Opmerking over conditie'}
                </label>
                <textarea
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                  placeholder={condition === 'defect' ? "Bijv: Scherm gebarsten / USB-C poort reageert niet..." : "Bijv: Lichte krasjes op de behuizing..."}
                  rows={2}
                  required={condition === 'defect'}
                  className="w-full bg-[#F7F5FA] border border-slate-200 rounded-xl p-3 text-xs text-[#24126E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D70096]/20 focus:border-[#D70096]"
                />
              </div>

              {condition === 'defect' && (
                <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-3.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createTicket}
                      onChange={(e) => setCreateTicket(e.target.checked)}
                      className="mt-0.5 rounded text-[#D70096] focus:ring-[#D70096] cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-rose-900 block">
                        Direct reparatie-ticket aanmaken in Servicesysteem
                      </span>
                      <span className="text-[11px] text-rose-700">
                        Er wordt direct een urgente melding aangemaakt voor het Serviceteam met lenergegevens en schadeomschrijving.
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                condition === 'defect'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {isPartial 
                  ? `Deelinname bevestigen (${returnQuantity}x)` 
                  : `Inname bevestigen (${returnQuantity}x)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
