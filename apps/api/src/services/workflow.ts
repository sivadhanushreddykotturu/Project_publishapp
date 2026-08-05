import type { Types } from "mongoose";
import {
  PACKAGES,
  type EmbeddedStep,
  type StepTemplate,
} from "@launchops/types";
import { Project, type ProjectDoc } from "../models/index.js";
import { badRequest, conflict, notFound } from "../utils/errors.js";
import { recordMetric } from "./metrics.js";

export const TEMPLATE_VERSION = "play_store_internal_v1";

/**
 * The five-step Play Store template. Payouts/deadlines are template config —
 * new project types are new configs, never engine changes.
 */
export function getTemplate(packageKey: string): StepTemplate {
  const pkg = PACKAGES.find((p) => p.key === packageKey);
  if (!pkg) throw badRequest(`Unknown package: ${packageKey}`, "BAD_PACKAGE");

  return {
    key: TEMPLATE_VERSION,
    projectType: "play_store_internal",
    packageKey,
    requiredTesters: pkg.requiredTesters,
    waitlistCap: Math.ceil(pkg.requiredTesters / 2),
    inactivityHoursBeforeReplacement: 48,
    steps: [
      {
        order: 1,
        type: "verification",
        config: {
          deadlineHours: 24,
          payoutPaise: 3_000,
          requiresProof: true,
          projectLevelGate: true,
          instructions:
            "Verify the Google account you'll test with: submit your Gmail address and a screenshot of the account on your device.",
        },
      },
      {
        order: 2,
        type: "play_store_invite",
        config: {
          deadlineHours: 48,
          payoutPaise: 4_000,
          requiresProof: true,
          projectLevelGate: true,
          instructions:
            "Open your personal testing link, accept the invite on Google Play, install the app, and upload a screenshot of it installed.",
        },
      },
      {
        order: 3,
        type: "app_usage",
        config: {
          deadlineHours: pkg.durationDays * 24,
          payoutPaise: 8_000,
          requiresProof: true,
          projectLevelGate: false,
          instructions: `Use the app daily for ${pkg.durationDays} days. Submit a short check-in note or screenshot each day you use it.`,
        },
      },
      {
        order: 4,
        type: "app_testing",
        config: {
          deadlineHours: 7 * 24,
          payoutPaise: 10_000,
          requiresProof: false,
          projectLevelGate: false,
          instructions:
            "Hunt for bugs: file structured reports with severity and repro steps. Found nothing? Submit a 'no issues' declaration.",
        },
      },
      {
        order: 5,
        type: "completion",
        config: {
          deadlineHours: 48,
          payoutPaise: 5_000,
          requiresProof: true,
          projectLevelGate: false,
          instructions:
            "Final step: keep the app installed through the last day, submit the closing survey screenshot, and you're done.",
        },
      },
    ],
  };
}

/** Clones the template into embedded project steps; step 1 starts active. */
export function createStepsFromTemplate(template: StepTemplate): EmbeddedStep[] {
  return template.steps.map((s) => ({
    order: s.order,
    type: s.type,
    state: s.order === 1 ? ("active" as const) : ("locked" as const),
    config: s.config,
  }));
}

/**
 * Payment confirmed → project activated: template cloned, metric stamped.
 * Idempotent — re-marking a paid invoice doesn't double-activate.
 */
export async function activateProject(
  projectId: Types.ObjectId,
  actorId: Types.ObjectId,
): Promise<ProjectDoc> {
  const project = await Project.findById(projectId);
  if (!project) throw notFound("Project");
  if (project.status !== "awaiting_payment" && project.status !== "draft") {
    return project; // already activated — idempotent
  }

  const template = getTemplate(project.packageKey);
  project.status = "active";
  project.steps = createStepsFromTemplate(template);
  project.stepTemplateVersion = template.key;
  project.requiredTesters = template.requiredTesters;
  project.paymentConfirmedAt = new Date();
  await project.save();

  await recordMetric("payment_confirmed", {
    projectId: project._id,
    actorId,
    meta: { packageKey: project.packageKey },
  });
  return project;
}

/**
 * Opportunity published → testers can join. The PRD's 5-minute target
 * (payment_confirmed → opportunity_published) is measured between these.
 */
export async function publishOpportunity(
  projectId: Types.ObjectId,
  actorId: Types.ObjectId,
): Promise<ProjectDoc> {
  const project = await Project.findById(projectId);
  if (!project) throw notFound("Project");
  if (project.status !== "active") {
    throw conflict("Project must be active (paid) before publishing", "NOT_ACTIVE");
  }
  if (project.joinState === "open") return project; // idempotent
  if (project.joinState === "closed" && project.opportunityPublishedAt) {
    throw conflict("Opportunity is closed for this project", "JOIN_CLOSED");
  }

  project.joinState = "open";
  project.opportunityPublishedAt = new Date();
  await project.save();

  await recordMetric("opportunity_published", { projectId: project._id, actorId });
  return project;
}
