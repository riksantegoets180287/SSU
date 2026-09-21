import React, { useState } from 'react';
import { Lock, ArrowLeft, CircleAlert as AlertCircle, Loader as Loader2 } from 'lucide-react';
import { verifyAdminPin } from '../lib/verifyAdminPin';

interface AdminPinScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminPinScreen: React.FC<AdminPinScreenProps> = ({ onSuccess, onBack }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleDigitClick = (digit: string) => {
    if (verifying) return;
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);

      if (nextPin.length === 6) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const verifyPin = async (candidatePin: string) => {
    setVerifying(true);
    setError(null);
    const result = await verifyAdminPin(candidatePin);
    setVerifying(false);

    if (result.success) {
      setPin('');
      onSuccess();
    } else {
      setError(result.error || 'Ongeldige code.');
      setTimeout(() => {
        setPin('');
      }, 500);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifying) return;
    if (pin.length === 6) {
      verifyPin(pin);
    } else {
      setError('Voer 6 cijfers in.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-16">
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs text-center">
        <button
          id="btn-pin-back"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#24126E] font-bold mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar rolkeuze
        </button>

        <div className="w-14 h-14 bg-indigo-50 text-[#24126E] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-2xl font-bold text-[#24126E] tracking-tight">
          Beheerderspaneel
        </h2>
        <p className="text-xs text-slate-500 mt-1.5 mb-5">
          Voer de 6-cijferige pincode in om toegang te krijgen tot het admin-overzicht.
        </p>

        {/* PIN dots display */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-[#24126E] scale-110 shadow-xs'
                    : 'bg-slate-200'
                } ${error ? 'bg-red-500 animate-shake' : ''}`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs flex items-center justify-center gap-1.5 mb-6 border border-red-100 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              id={`btn-keypad-${digit}`}
              type="button"
              disabled={verifying}
              onClick={() => handleDigitClick(digit)}
              className="h-14 rounded-2xl bg-[#F7F5FA] hover:bg-indigo-50 active:bg-[#24126E] active:text-white text-[#24126E] font-bold text-xl transition-all cursor-pointer border border-slate-200/80 shadow-xs disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={verifying}
            onClick={() => {
              setPin('');
              setError(null);
            }}
            className="h-14 rounded-2xl bg-[#F7F5FA] hover:bg-red-50 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors border border-slate-200/80 disabled:opacity-50"
          >
            Wissen
          </button>
          <button
            id="btn-keypad-0"
            type="button"
            disabled={verifying}
            onClick={() => handleDigitClick('0')}
            className="h-14 rounded-2xl bg-[#F7F5FA] hover:bg-indigo-50 active:bg-[#24126E] active:text-white text-[#24126E] font-bold text-xl transition-all cursor-pointer border border-slate-200/80 shadow-xs disabled:opacity-50"
          >
            0
          </button>
          <button
            type="button"
            disabled={verifying}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-[#F7F5FA] hover:bg-indigo-50 text-xs font-bold text-slate-500 transition-colors border border-slate-200/80 disabled:opacity-50"
          >
            ⌫
          </button>
        </div>

        {/* Fallback keyboard support */}
        <form onSubmit={handleFormSubmit} className="max-w-xs mx-auto">
          <input
            type="password"
            maxLength={6}
            value={pin}
            disabled={verifying}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPin(val);
              setError(null);
              if (val.length === 6) verifyPin(val);
            }}
            className="sr-only"
            autoFocus
          />
        </form>

        <p className="text-[11px] text-slate-400">
          Tip: Je kunt ook de cijfertoetsen op je toetsenbord gebruiken.
        </p>

        {verifying && (
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Controleren...</span>
          </div>
        )}
      </div>
    </div>
  );
};
