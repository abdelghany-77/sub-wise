import { useState, useEffect, useCallback } from "react";
import { Delete, Lock, ShieldCheck } from "lucide-react";
import { hashPin } from "../../lib/utils";
import { useT } from "../../lib/i18n";

interface AppLockScreenProps {
  expectedHash: string;
  onUnlock: () => void;
}

export function AppLockScreen({ expectedHash, onUnlock }: AppLockScreenProps) {
  const { t } = useT();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const verifyPin = useCallback(
    async (candidate: string) => {
      setChecking(true);
      const hashed = await hashPin(candidate);
      if (hashed === expectedHash) {
        setError(false);
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setChecking(false);
        }, 420);
      }
    },
    [expectedHash, onUnlock],
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (checking || pin.length >= 4) return;
      setError(false);
      const next = pin + digit;
      setPin(next);
      if (next.length === 4) {
        verifyPin(next);
      }
    },
    [checking, pin, verifyPin],
  );

  const handleBackspace = useCallback(() => {
    if (checking) return;
    setError(false);
    setPin((prev) => prev.slice(0, -1));
  }, [checking]);

  // Keyboard support for desktop/hardware keyboards
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDigit, handleBackspace]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#080B11] px-6 py-8 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] select-none"
    >
      <div className="w-full max-w-xs flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 flex items-center justify-center shadow-xl shadow-blue-600/30 mb-5 ring-1 ring-white/20">
          {checking && !error ? (
            <ShieldCheck size={26} className="text-white" />
          ) : (
            <Lock size={24} className="text-white" />
          )}
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight text-center">
          {t("pin.title")}
        </h1>
        <p className="text-xs text-white/45 mt-1 text-center">
          {t("pin.subtitle")}
        </p>

        {/* 4 PIN Dots */}
        <div
          className={`flex items-center justify-center gap-4 my-7 transition-transform ${
            error ? "animate-pulse" : ""
          }`}
          aria-label="PIN progress"
        >
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < pin.length;
            return (
              <span
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  error
                    ? "bg-rose-500 scale-110 ring-4 ring-rose-500/20"
                    : filled
                      ? "bg-blue-400 scale-110 ring-4 ring-blue-500/20"
                      : "bg-white/15 border border-white/20"
                }`}
              />
            );
          })}
        </div>

        <div className="h-5 mb-4 text-center">
          {error && (
            <p className="text-xs font-medium text-rose-400">{t("pin.wrong")}</p>
          )}
        </div>

        {/* Mobile-Ergonomic Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3.5 w-full max-w-[260px]">
          {keys.map((k, idx) => {
            if (k === "") {
              return <div key={`empty-${idx}`} />;
            }
            if (k === "del") {
              return (
                <button
                  key="del"
                  type="button"
                  onClick={handleBackspace}
                  aria-label="Delete digit"
                  className="h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] active:scale-95 border border-white/[0.06] flex items-center justify-center text-white/60 hover:text-white transition-all"
                >
                  <Delete size={20} />
                </button>
              );
            }
            return (
              <button
                key={k}
                type="button"
                onClick={() => handleDigit(k)}
                className="h-14 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 active:bg-blue-600/30 border border-white/[0.08] text-xl font-semibold text-white tabular-nums transition-all"
              >
                {k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
