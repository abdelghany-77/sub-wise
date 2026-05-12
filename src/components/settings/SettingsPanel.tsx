import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Select } from "../ui/FormFields";
import { Globe, Calendar, Shield, Info } from "lucide-react";

const CURRENCIES = [
  { value: "EGP", label: "EGP — Egyptian Pound" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "AED", label: "AED — UAE Dirham" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK/EU)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
];

export function SettingsPanel() {
  const { privacyMode, togglePrivacyMode, settings, updateSettings } = useStore();

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto lg:mx-0">
      <div>
        <h2 className="section-title">Settings</h2>
        <p className="text-sm text-white/40 mt-1">Customize your SubWise experience</p>
      </div>

      {/* General */}
      <Card className="space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Globe size={18} />
          </div>
          <h3 className="font-semibold text-white">General</h3>
        </div>

        <Select
          label="Default Currency"
          value={settings.defaultCurrency}
          onChange={(e) => updateSettings({ defaultCurrency: e.target.value })}
          options={CURRENCIES}
        />

        <Select
          label="Date Format"
          value={settings.dateFormat}
          onChange={(e) => updateSettings({ dateFormat: e.target.value as "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD" })}
          options={DATE_FORMATS}
        />
      </Card>

      {/* Privacy */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
            <Shield size={18} />
          </div>
          <h3 className="font-semibold text-white">Privacy</h3>
        </div>

        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-medium text-white">Privacy Mode</p>
            <p className="text-xs text-white/40 mt-0.5">Hide all balance amounts and financial data</p>
          </div>
          <button
            onClick={togglePrivacyMode}
            role="switch"
            aria-checked={privacyMode ? "true" : "false"}
            aria-label="Toggle privacy mode"
            className={`relative w-12 h-7 rounded-full transition-all duration-200 flex-shrink-0 ${
              privacyMode ? "bg-blue-500" : "bg-white/10"
            }`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${privacyMode ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </Card>

      {/* Date & Calendar */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Calendar size={18} />
          </div>
          <h3 className="font-semibold text-white">Calendar</h3>
        </div>

        <Select
          label="Week Starts On"
          value={settings.weekStartsOn}
          onChange={(e) => updateSettings({ weekStartsOn: e.target.value as "sunday" | "monday" | "saturday" })}
          options={[
            { value: "sunday", label: "Sunday" },
            { value: "monday", label: "Monday" },
            { value: "saturday", label: "Saturday" },
          ]}
        />
      </Card>

      {/* About */}
      <Card className="space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Info size={18} />
          </div>
          <h3 className="font-semibold text-white">About</h3>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white/50">
            <span>Version</span><span className="text-white/80 font-mono">0.1.1</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>Storage</span><span className="text-white/80">Local (Browser)</span>
          </div>
          <div className="flex justify-between text-white/50">
            <span>PWA</span><span className="text-emerald-400">Supported</span>
          </div>
        </div>
        <p className="text-xs text-white/25 pt-2 border-t border-white/[0.06]">
          All data is stored locally on your device. Nothing is sent to any server.
        </p>
      </Card>
    </div>
  );
}
