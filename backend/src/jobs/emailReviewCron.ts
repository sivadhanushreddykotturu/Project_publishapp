import { logger } from "../config/logger";
import { autoAdvanceDueEmailReviews } from "../services/playIntegration.service";

/**
 * Runs every EMAIL_REVIEW_CRON_SCHEDULE (default 15 min). Google's tester-list review is
 * short and predictable (~2-3h per GOOGLE_EMAIL_REVIEW_HOURS), so once a project's review
 * window has elapsed without the admin manually confirming it, this auto-advances the gate
 * and notifies admins — the admin still has to go get the real opt-in URL from Play Console.
 */
export async function runEmailReviewSweep(): Promise<{ advanced: number }> {
  const advanced = await autoAdvanceDueEmailReviews();
  if (advanced > 0) logger.info({ advanced }, "Auto-advanced email review gate(s)");
  return { advanced };
}
