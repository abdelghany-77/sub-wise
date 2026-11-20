import { useStore } from "../store/useStore";
import type { AppLanguage } from "../types";

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Nav & Pages
    "nav.dashboard": "Dashboard",
    "nav.home": "Home",
    "nav.accounts": "Accounts",
    "nav.transactions": "Transactions",
    "nav.activity": "Activity",
    "nav.commitments": "Bills & IOUs",
    "nav.bills": "Bills",
    "nav.installments": "Installments",
    "nav.ious": "IOUs & Splits",
    "nav.budgets": "Budgets",
    "nav.goals": "Savings Goals",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    "nav.more": "More",
    "nav.quickAdd": "Add",
    "nav.addTransaction": "Add Transaction",
    "nav.search": "Search...",
    "nav.lockApp": "Lock App",
    "nav.hideAmounts": "Hide amounts",
    "nav.showAmounts": "Show amounts",
    // Subtitles
    "sub.dashboard": "Personal CFO overview & wealth health",
    "sub.accounts": "Manage accounts, vaults & exchange rates",
    "sub.transactions": "Browse, filter & export transactions",
    "sub.commitments": "Bills, installments & shared IOUs",
    "sub.budgets": "Track spending limits & payday cycles",
    "sub.goals": "Monitor savings milestones",
    "sub.reports": "Analyze spending & cash-flow insights",
    "sub.settings": "Preferences, security & backup",
    // Demo banner
    "demo.title": "Viewing sample demo data",
    "demo.desc": "Explore freely, or clear the sample entries to start tracking your real finances.",
    "demo.startFresh": "Start Fresh",
    "demo.dismiss": "Dismiss",
    // Commitments tabs
    "tab.bills": "Bills & Subs",
    "tab.installments": "Installments",
    "tab.ious": "IOUs & Splits",
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.paid": "Paid",
    "common.active": "Active",
    "common.paused": "Paused",
    "common.completed": "Completed",
    "common.today": "Today",
    "common.yesterday": "Yesterday",
    // PIN
    "pin.title": "Unlock Walleteer",
    "pin.subtitle": "Enter your 4-digit security PIN",
    "pin.wrong": "Incorrect PIN. Try again.",
    // Language
    "lang.label": "Language",
    "lang.en": "English",
    "lang.ar": "العربية",
  },
  ar: {
    // Nav & Pages
    "nav.dashboard": "لوحة التحكم",
    "nav.home": "الرئيسية",
    "nav.accounts": "الحسابات",
    "nav.transactions": "المعاملات",
    "nav.activity": "النشاط",
    "nav.commitments": "الالتزامات",
    "nav.bills": "الفواتير",
    "nav.installments": "الأقساط",
    "nav.ious": "الديون والسلف",
    "nav.budgets": "الميزانيات",
    "nav.goals": "أهداف الادخار",
    "nav.reports": "التقارير",
    "nav.settings": "الإعدادات",
    "nav.more": "المزيد",
    "nav.quickAdd": "إضافة",
    "nav.addTransaction": "إضافة معاملة",
    "nav.search": "بحث...",
    "nav.lockApp": "قفل التطبيق",
    "nav.hideAmounts": "إخفاء الأرقام",
    "nav.showAmounts": "إظهار الأرقام",
    // Subtitles
    "sub.dashboard": "نظرة شاملة على ثروتك وتدفقاتك المالية",
    "sub.accounts": "إدارة الحسابات والعملات والذهب وأسعار الصرف",
    "sub.transactions": "استعراض وتصفية وتصدير كافة المعاملات",
    "sub.commitments": "الفواتير الدورية، الأقساط، والسلف المشتركة",
    "sub.budgets": "متابعة حدود الصرف ودورة الراتب",
    "sub.goals": "متابعة تقدم أهداف الادخار",
    "sub.reports": "تحليل المصروفات وصافي التدفق المالي",
    "sub.settings": "التخصيص، الأمان، والنسخ الاحتياطي",
    // Demo banner
    "demo.title": "أنت تستعرض بيانات تجريبية",
    "demo.desc": "يمكنك تجربة التطبيق بحرية، أو مسح البيانات التجريبية والبدء بحساباتك الحقيقية الآن.",
    "demo.startFresh": "ابدأ من الصفر",
    "demo.dismiss": "إخفاء",
    // Commitments tabs
    "tab.bills": "الفواتير والاشتراكات",
    "tab.installments": "الأقساط",
    "tab.ious": "الديون والسلف",
    // Common
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.delete": "حذف",
    "common.edit": "تعديل",
    "common.close": "إغلاق",
    "common.confirm": "تأكيد",
    "common.paid": "مدفوع",
    "common.active": "نشط",
    "common.paused": "متوقف",
    "common.completed": "مكتمل",
    "common.today": "اليوم",
    "common.yesterday": "أمس",
    // PIN
    "pin.title": "فتح Walleteer",
    "pin.subtitle": "أدخل رمز الحماية المكون من 4 أرقام",
    "pin.wrong": "الرمز غير صحيح، حاول مرة أخرى.",
    // Language
    "lang.label": "اللغة",
    "lang.en": "English",
    "lang.ar": "العربية",
  },
};

export function translate(lang: AppLanguage, key: string, fallback?: string): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? fallback ?? key;
}

export function useT() {
  const lang = useStore((s) => s.settings.language ?? "en");
  const isRtl = lang === "ar";
  const t = (key: string, fallback?: string) => translate(lang, key, fallback);
  return { t, lang, isRtl };
}
