import React, { useState } from 'react';
import { User, Users, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { BorrowerSession } from '../types';

interface UserRegisterProps {
  initialSession: BorrowerSession | null;
  onComplete: (session: BorrowerSession) => void;
  onBack: () => void;
}

const COMMON_TEAMS = [
  'ICT & Media',
  'Docententeam',
  'Facilitair & Beheer',
  'Sport & Bewegen',
  'Zorg & Welzijn',
  'Techniek & Automotive',
  'Studentenraad',
  'Stagebureau',
];

export const UserRegister: React.FC<UserRegisterProps> = ({
  initialSession,
  onComplete,
  onBack,
}) => {
  const [name, setName] = useState(initialSession?.name || '');
  const [team, setTeam] = useState(initialSession?.team || '');
  const [errors, setErrors] = useState<{ name?: string; team?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; team?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Vul alstublieft je voor- en achternaam in.';
    }

    if (!team.trim()) {
      newErrors.team = 'Vul alstublieft je team, opleiding of afdeling in.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onComplete({
      name: name.trim(),
      team: team.trim(),
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-10 shadow-xs">
        {/* Header */}
        <div className="mb-8">
          <button
            id="btn-register-back"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#24126E] font-bold mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar rolkeuze
          </button>

          <div className="inline-flex items-center gap-2 bg-indigo-50 text-[#24126E] text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#D70096]" />
            Eenvoudige registratie
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#24126E] tracking-tight">
            Wie leent er materialen?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            We hebben alleen je naam en team nodig om te registreren wie het materiaal in beheer heeft.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label 
              htmlFor="borrower-name" 
              className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2"
            >
              Jouw naam <span className="text-[#D70096]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="borrower-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                }}
                placeholder="bijv. Jan Jansen"
                className={`w-full pl-10 pr-4 py-3 bg-[#F7F5FA] rounded-xl border ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200/80 focus:ring-2 focus:ring-[#D70096] focus:border-transparent'
                } text-slate-800 text-sm focus:outline-none transition-all placeholder:text-slate-400`}
                autoFocus
              />
            </div>
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.name}
              </p>
            )}
          </div>

          {/* Team Field */}
          <div>
            <label 
              htmlFor="borrower-team" 
              className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-2"
            >
              Team / Opleiding / Afdeling <span className="text-[#D70096]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Users className="w-4 h-4" />
              </div>
              <input
                id="borrower-team"
                type="text"
                value={team}
                onChange={(e) => {
                  setTeam(e.target.value);
                  if (errors.team) setErrors(prev => ({ ...prev, team: undefined }));
                }}
                placeholder="bijv. ICT & Media of Docententeam B"
                className={`w-full pl-10 pr-4 py-3 bg-[#F7F5FA] rounded-xl border ${
                  errors.team ? 'border-red-500 focus:ring-red-500' : 'border-slate-200/80 focus:ring-2 focus:ring-[#D70096] focus:border-transparent'
                } text-slate-800 text-sm focus:outline-none transition-all placeholder:text-slate-400`}
              />
            </div>
            {errors.team && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">
                {errors.team}
              </p>
            )}

            {/* Quick-pick teams */}
            <div className="mt-3">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                Snel kiezen:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_TEAMS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setTeam(item);
                      if (errors.team) setErrors(prev => ({ ...prev, team: undefined }));
                    }}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      team === item
                        ? 'bg-[#24126E] text-white border-[#24126E] font-bold shadow-xs'
                        : 'bg-[#F7F5FA] text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-[#24126E]'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100/70 text-xs text-slate-600 leading-relaxed">
            <p>
              🔒 <strong>Geen account nodig:</strong> Gegevens worden veilig lokaal opgeslagen om deze specifieke uitleen vast te leggen.
            </p>
          </div>

          {/* Submit Button */}
          <button
            id="btn-submit-registration"
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl bg-[#D70096] hover:bg-[#b5007e] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D70096]/20 transition-all duration-200 cursor-pointer"
          >
            <span>Verder naar materialen</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
