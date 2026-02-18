import { useRef, useState } from "react";
import {
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import type { Account, Transaction } from "../../types";

export function DataManager() {
  const { accounts, transactions, importData, clearAll } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [importMsg, setImportMsg] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      accounts,
      transactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subwise-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw) as {
          accounts: Account[];
          transactions: Transaction[];
        };
        if (
          !Array.isArray(data.accounts) ||
          !Array.isArray(data.transactions)
        ) {
          throw new Error("Invalid file format");
        }
        importData({
          accounts: data.accounts,
          transactions: data.transactions,
        });
        setImportStatus("success");
        setImportMsg(
          `Successfully imported ${data.accounts.length} accounts and ${data.transactions.length} transactions.`,
        );
      } catch {
        setImportStatus("error");
        setImportMsg(
          "Failed to import. Make sure this is a valid SubWise backup file.",
        );
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setImportStatus("idle"), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 w-full max-w-2xl mx-auto lg:mx-0">
      <div>
        <h2 className="section-title">Data Management</h2>
        <p className="text-sm text-white/40 mt-1">
          Backup and restore your financial data
        </p>
      </div>

      {/* Status Message */}
      {importStatus !== "idle" && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm animate-slide-up ${
            importStatus === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {importStatus === "success" ? (
            <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          )}
          {importMsg}
        </div>
      )}

      {/* Export */}
      <Card className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
            <Download size={18} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Backup Data</h3>
            <p className="text-sm text-white/50 mt-1">
              Download a JSON file containing all your accounts (
              {accounts.length}) and transactions ({transactions.length}). Keep
              this file somewhere safe.
            </p>
          </div>
        </div>
        <Button
          icon={<Download size={16} />}
          onClick={handleExport}
          className="w-full sm:w-auto"
        >
          Download Backup
        </Button>
      </Card>

      {/* Import */}
      <Card className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
            <Upload size={18} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Restore Data</h3>
            <p className="text-sm text-white/50 mt-1">
              Upload a previously exported JSON backup. This will{" "}
              <strong className="text-white/70">replace</strong> all current
              data.
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <Button
          variant="ghost"
          icon={<Upload size={16} />}
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto"
        >
          Upload Backup File
        </Button>
      </Card>

      {/* Danger Zone */}
      <Card className="border-rose-500/15 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
            <Trash2 size={18} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-rose-400">Danger Zone</h3>
            <p className="text-sm text-white/50 mt-1">
              Permanently delete all accounts and transactions. This action
              cannot be undone.
            </p>
          </div>
        </div>

        {showClearConfirm ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-3">
            <p className="text-sm text-rose-300 font-medium">
              Are you absolutely sure?
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                className="flex-1"
                onClick={() => {
                  clearAll();
                  setShowClearConfirm(false);
                }}
              >
                Yes, Delete Everything
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="danger"
            icon={<Trash2 size={16} />}
            onClick={() => setShowClearConfirm(true)}
          >
            Clear All Data
          </Button>
        )}
      </Card>
    </div>
  );
}
