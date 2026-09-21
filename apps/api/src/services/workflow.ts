import type { Types } from "mongoose";
import {
  PACKAGES,
  PROJECT_TYPES,
  type EmbeddedStep,
  type ProjectType,
  type StepTemplate,
  type StepType,
} from "@defineux/types";
import { Project, type ProjectDoc } from "../models/index.js";
import { badRequest, conflict, notFound } from "../utils/errors.js";
import { recordMetric } from "./metrics.js";

export const TEMPLATE_VERSIONS: Record<ProjectType, string> = {
  play_store_internal: "play_store_internal_v1",
  ios_testflight: "ios_testflight_v1",
};

interface InviteStepSpec {
  type: StepType;
  instructions: string;
}

/** The invite step differs per platform; everything else is shared. */
const INVITE_STEPS: Record<ProjectType, InviteStepSpec> = {
  play_store_internal: {
    type: "play_store_invite",
    instructions:
      "Open your personal testing link, accept the invite on Google Play, install the app, and upload a screenshot of it installed.",
  },
  ios_testflight: {
    type: "testflight_invite",
    instructions:
      "Open your personal testing link, accept the invite in TestFlight, install the app, and upload a screenshot of it installed.",
  },
};

const VERIFY_INSTRUCTIONS: Record<ProjectType, string> = {
  play_store_internal:
    "Verify the Google account you'll test with: submit your Gmail address and a screenshot of the account on your device.",
  ios_testflight:
    "Verify the Apple account you'll test with: submit the email linked to your Apple ID and a screenshot showing TestFlight on your device.",
};

/**
 * Step templates keyed by projectType + package. Payouts/deadlines are
 * template config — new project types are new configs, never engine changes.
 */
export function getTemplate(
  projectType: ProjectType,
  packageKey: string,
): StepTemplate {
  const pkg = PACKAGES.find((p) => p.key === packageKey);
  if (!pkg) throw badRequest(`Unknown package: ${packageKey}`, "BAD_PACKAGE");
  if (!PROJECT_TYPES.includes(projectType)) {
    throw badRequest(`Unknown project type: ${projectType}`, "BAD_PROJECT_TYPE");
  }

  return {
    key: TEMPLATE_VERSIONS[projectType],
    projectType,
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
          payoutPaise: 0,
          requiresProof: true,
          projectLevelGate: true,
          instructions: VERIFY_INSTRUCTIONS[projectType],
        },
      },
      {
        order: 2,
        type: INVITE_STEPS[projectType].type,
        config: {
          deadlineHours: 48,
          payoutPaise: 0,
          requiresProof: true,
          projectLevelGate: true,
          instructions: INVITE_STEPS[projectType].instructions,
        },
      },
      {
        order: 3,
        type: "completion",
        config: {
          deadlineHours: pkg.durationDays * 24,
          payoutPaise: 10_000,
          requiresProof: true,
          projectLevelGate: false,
          instructions:
            "Keep the app installed for 14 days and submit your Google Play review proof to release the full payout.",
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

  const template = getTemplate(project.projectType, project.packageKey);
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
