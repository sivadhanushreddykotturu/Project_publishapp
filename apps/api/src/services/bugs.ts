import type { Types } from "mongoose";
import { BugReport, Project, Client, User } from "../models/index.js";
import { conflict, notFound } from "../utils/errors.js";
import { recordMetric } from "./metrics.js";
import { writeAudit } from "./audit.js";
import { dispatch } from "./notify.js";

const SEVERITY_RANK: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/**
 * Merge duplicates: the target survives with the strongest evidence (union
 * of attachments, highest severity); the source links via duplicateOf.
 * Every merge is labeled training data for Phase 2 AI dedup.
 */
export async function mergeBugs(input: {
  sourceId: Types.ObjectId;
  targetId: Types.ObjectId;
  adminId: Types.ObjectId;
}): Promise<void> {
  if (String(input.sourceId) === String(input.targetId)) {
    throw conflict("Can't merge a report into itself", "SAME_REPORT");
  }
  const [source, target] = await Promise.all([
    BugReport.findById(input.sourceId),
    BugReport.findById(input.targetId),
  ]);
  if (!source || !target) throw notFound("Bug report");
  if (String(source.projectId) !== String(target.projectId)) {
    throw conflict("Reports belong to different projects", "DIFFERENT_PROJECTS");
  }
  if (source.status === "duplicate") {
    throw conflict("Source is already merged", "ALREADY_MERGED");
  }

  // strongest evidence survives
  target.mergedFrom.push(source._id);
  target.attachments.push(...source.attachments);
  if (SEVERITY_RANK[source.severity] > SEVERITY_RANK[target.severity]) {
    target.severity = source.severity;
  }
  await target.save();

  source.status = "duplicate";
  source.duplicateOf = target._id;
  await source.save();

  await writeAudit({
    actorId: input.adminId,
    action: "bug.merged",
    entityType: "BugReport",
    entityId: target._id,
    before: { mergedFrom: target.mergedFrom.slice(0, -1) },
    after: { mergedFrom: target.mergedFrom, duplicateSource: source._id },
  });
}

/** Publish one clean report per bug to the client — never the raw dump. */
export async function publishBugs(input: {
  ids: Types.ObjectId[];
  adminId: Types.ObjectId;
}): Promise<number> {
  let published = 0;
  let projectId: Types.ObjectId | null = null;

  for (const id of input.ids) {
    const bug = await BugReport.findOneAndUpdate(
      { _id: id, status: "open" },
      { $set: { status: "published", publishedAt: new Date() } },
      { new: true },
    );
    if (!bug) continue;
    published += 1;
    projectId = bug.projectId;
    await recordMetric("bug_published", { projectId: bug.projectId, actorId: input.adminId });
    await writeAudit({
      actorId: input.adminId,
      action: "bug.published",
      entityType: "BugReport",
      entityId: bug._id,
      before: { status: "open" },
      after: { status: "published" },
    });
  }

  if (published > 0 && projectId) {
    const project = await Project.findById(projectId).lean();
    const client = project
      ? await Client.findById(project.clientId).lean()
      : null;
    const owner = client ? await User.findById(client.userId).lean() : null;
    if (owner && project) {
      await dispatch({
        recipientId: owner._id,
        type: "bug_status",
        title: `${published} bug report${published === 1 ? "" : "s"} published — ${project.appDetails.appName}`,
        body: "Your QA team reviewed and published new findings. Open your project to read them.",
        link: `/client/projects/${project._id}`,
        idempotencyKey: `bugpub:${project._id}:${Date.now()}`,
      });
    }
  }
  return published;
}
