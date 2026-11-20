import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import type { RecurringBill } from "../types";

export const NOTIFICATION_CHANNEL_ID = "bill-reminders";

/**
 * Converts any string ID into a deterministic positive 32-bit integer (1 to 2,147,483,646)
 * suitable for Android Notification IDs.
 */
export function stringToNotificationId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const positive = Math.abs(hash);
  return positive % 2147483647 || 1;
}

/**
 * Calculates the exact trigger time for a bill reminder:
 * Exactly 1 day (24 hours) before `dueDateStr` at 10:00 AM local time.
 * If 10:00 AM has already passed and the bill is due tomorrow or today,
 * schedules for 1 hour from now (or in 15 seconds if less than an hour remains).
 * If already past due, returns null.
 */
export function calculateReminderDate(dueDateStr: string): Date | null {
  const parts = dueDateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;

  const [y, m, d] = parts;
  const now = new Date();

  // Due date at end of day local time
  const dueDayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
  if (dueDayEnd.getTime() < now.getTime()) {
    // Due date has already passed
    return null;
  }

  // 1 day before due date at 10:00 AM local time
  const target10AM = new Date(y, m - 1, d - 1, 10, 0, 0, 0);

  if (target10AM.getTime() > now.getTime()) {
    return target10AM;
  }

  // If 10:00 AM of the day before has passed, but the bill is due within 24 hours:
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  if (oneHourLater.getTime() < dueDayEnd.getTime()) {
    return oneHourLater;
  }

  // Due today within the hour: notify in 15 seconds
  return new Date(now.getTime() + 15 * 1000);
}

class NotificationServiceManager {
  private initialized = false;

  /**
   * Initializes notification channels and listeners.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.createChannel({
          id: NOTIFICATION_CHANNEL_ID,
          name: "Bill & Subscription Reminders",
          description: "1-day-prior reminders for upcoming bills and recurring commitments",
          importance: 5, // Max importance for heads-up alert
          visibility: 1, // Public
          vibration: true,
        });
      } catch (err) {
        console.warn("[NotificationService] createChannel error:", err);
      }
    }

    this.initialized = true;
  }

  /**
   * Checks current permission status.
   */
  async checkPermissions(): Promise<"granted" | "denied" | "prompt"> {
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.checkPermissions();
        if (status.display === "granted") return "granted";
        if (status.display === "denied") return "denied";
        return "prompt";
      } catch (err) {
        console.warn("[NotificationService] checkPermissions error:", err);
        return "prompt";
      }
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") return "granted";
      if (Notification.permission === "denied") return "denied";
      return "prompt";
    }

    return "granted";
  }

  /**
   * Requests permission to send local push notifications.
   */
  async requestPermissions(): Promise<boolean> {
    await this.init();

    if (Capacitor.isNativePlatform()) {
      try {
        const res = await LocalNotifications.requestPermissions();
        return res.display === "granted";
      } catch (err) {
        console.warn("[NotificationService] requestPermissions error:", err);
        return false;
      }
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      } catch {
        return false;
      }
    }

    return true;
  }

  /**
   * Schedules a 1-day-prior reminder for a recurring bill or subscription.
   */
  async scheduleBillReminder(
    bill: RecurringBill,
    currency = "EGP",
  ): Promise<boolean> {
    await this.init();

    const notifId = stringToNotificationId(bill.id);

    // Cancel any existing notification for this bill first
    await this.cancelBillReminder(bill.id);

    // Skip paused bills
    if (bill.status === "paused") {
      return false;
    }

    const reminderDate = calculateReminderDate(bill.nextDueDate);
    if (!reminderDate) {
      return false;
    }

    const title = "تذكير بموعد فاتورة غداً 🔔";
    const body = `غداً موعد استحقاق "${bill.name}" بقيمة ${bill.amount.toLocaleString()} ${currency}`;

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title,
              body,
              schedule: { at: reminderDate },
              channelId: NOTIFICATION_CHANNEL_ID,
              smallIcon: "ic_stat_icon_config_sample",
              iconColor: "#0ea5e9",
              extra: {
                billId: bill.id,
                dueDate: bill.nextDueDate,
                type: "bill_reminder",
              },
            },
          ],
        });
        return true;
      } catch (err) {
        console.warn("[NotificationService] schedule failed:", err);
        return false;
      }
    }

    return true;
  }

  /**
   * Cancels a scheduled bill reminder.
   */
  async cancelBillReminder(billId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const id = stringToNotificationId(billId);
      await LocalNotifications.cancel({
        notifications: [{ id }],
      });
    } catch (err) {
      console.warn("[NotificationService] cancel failed:", err);
    }
  }

  /**
   * Synchronizes all active recurring bills into the notification scheduler.
   */
  async syncAllBillReminders(
    bills: RecurringBill[],
    notificationsEnabled = true,
    currencyByAccount?: Record<string, string>,
  ): Promise<void> {
    await this.init();

    if (!Capacitor.isNativePlatform()) return;

    if (!notificationsEnabled) {
      // User disabled reminders in settings: cancel all
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }
      } catch (err) {
        console.warn("[NotificationService] cancel all error:", err);
      }
      return;
    }

    for (const bill of bills) {
      if (bill.status !== "paused") {
        const cur = currencyByAccount?.[bill.accountId] || "EGP";
        await this.scheduleBillReminder(bill, cur);
      } else {
        await this.cancelBillReminder(bill.id);
      }
    }
  }

  /**
   * Sends an immediate test notification to verify audio, vibration, and UI.
   */
  async sendTestNotification(): Promise<boolean> {
    await this.init();
    const hasPerm = await this.requestPermissions();
    if (!hasPerm) return false;

    const testId = 999999;
    const title = "تجربة إشعارات Walleteer 🔔";
    const body =
      "تم تفعيل إشعارات الفواتير والاشتراكات بنجاح! ستصلك التنبيهات دائماً قبل موعد الاستحقاق بـ 24 ساعة.";

    if (Capacitor.isNativePlatform()) {
      try {
        // Schedule 2 seconds in future so OS triggers cleanly
        await LocalNotifications.schedule({
          notifications: [
            {
              id: testId,
              title,
              body,
              schedule: { at: new Date(Date.now() + 2000) },
              channelId: NOTIFICATION_CHANNEL_ID,
              smallIcon: "ic_stat_icon_config_sample",
              iconColor: "#0ea5e9",
            },
          ],
        });
        return true;
      } catch (err) {
        console.warn("[NotificationService] sendTestNotification failed:", err);
        return false;
      }
    }

    // Web Notification API fallback
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        new Notification(title, { body, icon: "./icon-192x192.png" });
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }
}

export const NotificationService = new NotificationServiceManager();
