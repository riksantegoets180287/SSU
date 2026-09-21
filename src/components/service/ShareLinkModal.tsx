import React, { useState } from 'react';
import { Link2, Copy, Check, QrCode, Mail, ExternalLink, X, Shield, Sparkles, Send } from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPublicView: () => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  onClose,
  onOpenPublicView,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build the public URL
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?form=klusje`
    : 'https://summaplus.nl/service?form=klusje';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(baseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const emailSubject = encodeURIComponent('Klusje aanmelden bij Summa Plus');
  const emailBody = encodeURIComponent(
    `Beste collega,\n\nVia onderstaande link kun je eenvoudig een klusje aanmelden bij het Summa Plus serviceteam:\n${baseUrl}\n\nVul de gegevens in en het serviceteam gaat er direct mee aan de slag!\n\nMet vriendelijke groet,\nSumma Plus Serviceteam`
  );
  const mailtoLink = `mailto:?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#1F1735]/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#D70096] flex items-center justify-center font-bold">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D70096] block">
                Voor Aanvragers & Collega's
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#24126E]">
                Deelbare Klusjeslink
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F7F5FA] hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
          Deel deze link met collega's, docenten en studenten. Zij zien <strong className="text-[#24126E]">alleen het aanmeldformulier</strong> en hebben geen toegang tot het interne beheersysteem.
        </p>

        {/* Link Box */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[11px] font-bold text-[#24126E] uppercase tracking-wider mb-2">
              Directe aanvraaglink
            </label>
            <div className="flex items-center gap-2 bg-[#F7F5FA] p-2 rounded-2xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={baseUrl}
                className="w-full bg-transparent px-2 text-xs font-mono text-[#24126E] focus:outline-none select-all truncate"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[#D70096] hover:bg-[#b5007e] text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Gekopieerd!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopieer link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenPublicView();
              }}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left flex items-center gap-3 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#24126E] group-hover:bg-[#24126E] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#24126E] block">
                  Klantweergave testen
                </span>
                <span className="text-[10px] text-slate-400">
                  Bekijk wat collega's zien
                </span>
              </div>
            </button>

            <a
              href={mailtoLink}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left flex items-center gap-3 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#D70096] group-hover:bg-[#D70096] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#24126E] block">
                  Verstuur per e-mail
                </span>
                <span className="text-[10px] text-slate-400">
                  Kant-en-klare e-mail
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Security & Privacy Note */}
        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
          <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block text-emerald-950 font-bold mb-0.5">Veilig & Gescheiden</strong>
            Aanvragers zien alleen het formulier en hun eigen bevestigingsnummer. Het ticketoverzicht en beheer blijven uitsluitend zichtbaar voor het serviceteam.
          </div>
        </div>

        {/* Close button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#24126E] hover:bg-[#1A0D52] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
