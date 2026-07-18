import { Assignment } from "../models/Assignment";
import { Tester } from "../models/Tester";
import { logger } from "../config/logger";
import { replaceInactiveStep1Tester, step1InactivityCutoff } from "../services/matching.service";

// Step 2+ inactivity currently surfaces as a structured admin-console alert (via the
// inactivityFlag + this log line); routing it through dispatchNotification to a real
// admin recipient list is Phase 2 (Tech Spec §10 — push/SMS/WhatsApp are pluggable later).

/**
 * Runs every INACTIVITY_CRON_SCHEDULE (default 15 min — Tech Spec §6).
 *  - Step 1: auto-remove + auto-promote from the waiting queue.
 *  - Step 2+: no automatic removal (would disrupt Play Console continuity) — instead
 *    flag the assignment and alert the admin (PRD §4.4).
 */
export async function runInactivityCheck(): Promise<{ step1Replaced: number; step2PlusFlagged: number }> {
  const cutoff = step1InactivityCutoff();

  const staleStep1 = await Assignment.find({
    status: "active",
    currentStep: 1,
    lastActivityAt: { $lt: cutoff },
  });

  let step1Replaced = 0;
  for (const assignment of staleStep1) {
    try {
      await replaceInactiveStep1Tester(assignment._id);
      step1Replaced += 1;
    } catch (err) {
      logger.error({ err, assignmentId: assignment._id }, "Failed to replace inactive Step 1 tester");
    }
  }

  const staleStep2Plus = await Assignment.find({
    status: "active",
    currentStep: { $gt: 1 },
    lastActivityAt: { $lt: cutoff },
    inactivityFlag: false,
  });

  let step2PlusFlagged = 0;
  for (const assignment of staleStep2Plus) {
    assignment.inactivityFlag = true;
    await assignment.save();

    const tester = await Tester.findById(assignment.testerId).populate<{ userId: { name: string; email: string; phone?: string } }>(
      "userId"
    );
    // Admin alert per PRD §4.4: name, Gmail, phone, project, step, last activity, days inactive.
    logger.warn(
      {
        assignmentId: assignment._id,
        projectId: assignment.projectId,
        tester: tester?.userId,
        currentStep: assignment.currentStep,
        lastActivityAt: assignment.lastActivityAt,
        daysInactive: Math.floor((Date.now() - assignment.lastActivityAt.getTime()) / 86_400_000),
      },
      "Admin alert: tester inactive past Step 1"
    );
    step2PlusFlagged += 1;
  }

  return { step1Replaced, step2PlusFlagged };
}
