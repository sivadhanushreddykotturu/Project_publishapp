import { Types } from "mongoose";
import { Project } from "../models/Project";
import { Client } from "../models/Client";
import { Invoice } from "../models/Invoice";
import { MetricEvent } from "../models/MetricEvent";
import { recordAudit } from "../middleware/audit";
import { ApiError } from "../utils/apiError";
import { dispatchNotification } from "./notification.service";
import { computeInvoiceAmount, GST_RATE } from "../constants/packages";

/**
 * Client-side feedback: "testers only" stays self-serve, but managed_testing / launch_ready
 * / custom projects need the client verified — proof they actually control the Play Console
 * listing — plus a direct discussion with the team, before payment unlocks. Modeled as a
 * gate on Project.verification + Project.status ("pending_verification" -> "awaiting_payment"),
 * not a separate collection, since it's a one-time per-project checkpoint.
 */

export async function submitClientVerificationProof(projectId: Types.ObjectId, proofUrl: string, note?: string) {
  const project = await Project.findById(projectId);
  if (!project) throw ApiError.notFound("Project not found");
  if (!project.verification.required) throw ApiError.badRequest("This project doesn't require verification");
  if (project.verification.status === "verified") throw ApiError.conflict("This project is already verified");

  project.verification.status = "submitted";
  project.verification.proofUrl = proofUrl;
  project.verification.note = note;
  project.verification.submittedAt = new Date();
  await project.save();

  await MetricEvent.create({ type: "client_verification_submitted", projectId, meta: {} });
  return project;
}

export interface ReviewVerificationParams {
  projectId: Types.ObjectId;
  adminId: Types.ObjectId;
  approve: boolean;
  note?: string;
  /** Required to approve a "custom" package — it has no fixed PACKAGE_CONFIG pricing. */
  customAmount?: number;
  customGst?: number;
}

/**
 * Admin reviews after the direct discussion + checking the submitted Play Console proof.
 * On approval: unlocks payment by creating the invoice (the thing that was blocked) and
 * moving the project to "awaiting_payment" — everything downstream (checkout, activation)
 * is the same path a self-serve testers_only project already takes.
 */
export async function reviewClientVerification(params: ReviewVerificationParams) {
  const project = await Project.findById(params.projectId);
  if (!project) throw ApiError.notFound("Project not found");
  if (!project.verification.required) throw ApiError.badRequest("This project doesn't require verification");

  const client = await Client.findById(project.clientId);
  if (!client) throw ApiError.notFound("Client not found");

  if (!params.approve) {
    project.verification.status = "rejected";
    project.verification.note = params.note;
    await project.save();

    await MetricEvent.create({ type: "client_verification_rejected", projectId: project._id, meta: {} });
    await recordAudit({
      actorId: params.adminId,
      action: "project.verificationRejected",
      entityType: "Project",
      entityId: project._id,
      after: { note: params.note },
    });
    await dispatchNotification({
      recipientUserId: client.userId,
      type: "client_verification_rejected",
      channel: "email",
      relatedId: project._id.toString(),
      payload: { note: params.note },
    });

    return { project, invoice: null };
  }

  let amount: number;
  let gst: number;
  if (project.package === "custom") {
    if (params.customAmount === undefined) {
      throw ApiError.badRequest("customAmount is required to approve a custom-package project (no fixed pricing exists)");
    }
    amount = params.customAmount;
    gst = params.customGst ?? Math.round(amount * GST_RATE);
  } else {
    ({ amount, gst } = computeInvoiceAmount(project.package, project.requiredTesters));
  }

  project.verification.status = "verified";
  project.verification.verifiedAt = new Date();
  project.verification.verifiedBy = params.adminId;
  project.status = "awaiting_payment";
  await project.save();

  const invoice = await Invoice.create({
    clientId: client._id,
    projectId: project._id,
    package: project.package,
    amount,
    gst,
    dueDate: new Date(Date.now() + 7 * 24 * 3_600_000),
  });

  await MetricEvent.create({ type: "client_verification_approved", projectId: project._id, meta: { invoiceId: invoice._id } });
  await recordAudit({
    actorId: params.adminId,
    action: "project.verificationApproved",
    entityType: "Project",
    entityId: project._id,
    after: { invoiceId: invoice._id },
  });
  await dispatchNotification({
    recipientUserId: client.userId,
    type: "client_verification_approved",
    channel: "email",
    relatedId: project._id.toString(),
    payload: { invoiceId: invoice._id.toString() },
  });

  return { project, invoice };
}
