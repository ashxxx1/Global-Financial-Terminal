import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { track } from "./analytics";

/**
 * User voice — feedback capture and the Sean Ellis PMF survey.
 * Growth-plan items 47 and 49.
 *
 * Both write to Firestore rather than a third-party widget: it keeps the
 * responses in the same place as the user profile (so a response can be tied
 * to behaviour), costs nothing, and avoids shipping another vendor script on
 * a critical path we just spent effort trimming.
 *
 * Writes are best-effort. Failing to record feedback must never surface an
 * error to someone who just did us a favour.
 */

export type FeedbackType = "bug" | "idea" | "confusing" | "praise" | "other";

export interface FeedbackInput {
  type: FeedbackType;
  message: string;
  /** Optional — lets us reply. Prefilled from the account when signed in. */
  email?: string;
  uid?: string | null;
}

export async function submitFeedback(input: FeedbackInput): Promise<boolean> {
  track("feedback_submitted", { type: input.type });
  if (!db) return false;
  try {
    await addDoc(collection(db, "feedback"), {
      type: input.type,
      message: input.message.slice(0, 4000),
      email: input.email?.slice(0, 320) || null,
      uid: input.uid || null,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * The Sean Ellis question. The benchmark that matters: **>40% answering
 * "very disappointed"** is the conventional product/market-fit signal.
 * Below that, keep iterating rather than scaling acquisition.
 */
export type PmfAnswer = "very" | "somewhat" | "not";

export interface PmfInput {
  answer: PmfAnswer;
  /** Free text: what they'd miss, or what would make it better. */
  reason?: string;
  uid?: string | null;
}

export async function submitPmf(input: PmfInput): Promise<boolean> {
  track("pmf_answered", { answer: input.answer });
  if (!db) return false;
  try {
    await addDoc(collection(db, "pmf_responses"), {
      answer: input.answer,
      reason: input.reason?.slice(0, 2000) || null,
      uid: input.uid || null,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}
