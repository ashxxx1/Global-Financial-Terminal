/**
 * Notification abstraction — channels wired later (email, Telegram, Discord, push).
 */
export type NotifyKind = "new_signal" | "target_hit" | "stop_hit" | "high_confidence" | "daily_report";

export interface NotificationPayload {
  kind: NotifyKind;
  title: string;
  body: string;
  signalId?: string;
  at: number;
}

export interface NotificationProvider {
  id: string;
  send(payload: NotificationPayload): Promise<void>;
}

const providers: NotificationProvider[] = [];

export function registerNotificationProvider(p: NotificationProvider) {
  providers.push(p);
}

export async function notify(payload: NotificationPayload): Promise<void> {
  for (const p of providers) {
    try {
      await p.send(payload);
    } catch {
      /* never block resolution on notify failure */
    }
  }
}

/** Console provider for local/dev. */
export const ConsoleNotificationProvider: NotificationProvider = {
  id: "console",
  async send(payload) {
    if (typeof console !== "undefined") {
      console.info(`[gft:notify:${payload.kind}]`, payload.title, payload.body);
    }
  },
};

/** Future AI explanation interfaces (not implemented). */
export interface AISignalExplanation {
  explain(signalId: string): Promise<string>;
}
export interface AINewsAnalysis {
  analyze(headline: string): Promise<{ sentiment: string; impact: string }>;
}
export interface AIMacroContext {
  context(asOf: number): Promise<string>;
}
export interface AIEventImpact {
  impact(event: string): Promise<string>;
}
export interface AIConfidenceCalibration {
  calibrate(raw: number, setupKey: string): Promise<number>;
}
