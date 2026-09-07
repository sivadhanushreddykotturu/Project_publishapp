import type { Types } from "mongoose";
import { GST_RATE, PACKAGES, PROJECT_TYPES, type ProjectType } from "@defineux/types";
import { Client, Invoice, Project, type InvoiceDoc } from "../models/index.js";
import { badRequest, conflict, notFound } from "../utils/errors.js";
import { writeAudit } from "./audit.js";
import { activateProject, publishOpportunity } from "./workflow.js";

/** Invoice math lives in exactly one place. Amounts in paise, GST 18%. */
export function priceForPackage(
  packageKey: string,
  testerCount?: number,
): {
  amountPaise: number;
  gstPaise: number;
  totalPaise: number;
} {
  const pkg = PACKAGES.find((p) => p.key === packageKey) ?? PACKAGES[0];
  let baseAmountPaise = pkg.pricePaise;

  // If client selected custom testers above the minimum 14
  if (testerCount && testerCount > pkg.requiredTesters) {
    const extraTesters = testerCount - pkg.requiredTesters;
    baseAmountPaise += extraTesters * 100_00; // ₹100 per additional tester
  }

  const gstPaise = Math.round(baseAmountPaise * GST_RATE);
  return {
    amountPaise: baseAmountPaise,
    gstPaise,
    totalPaise: baseAmountPaise + gstPaise,
  };
}

export async function createInvoice(
  clientId: Types.ObjectId,
  packageKey: string,
  projectId?: Types.ObjectId,
  testerCount?: number,
): Promise<InvoiceDoc> {
  const price = priceForPackage(packageKey, testerCount);
  return Invoice.create({
    clientId,
    projectId,
    packageKey,
    ...price,
    dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  });
}

/**
 * Manual mark-paid — the built-in fallback so onboarding never blocks on a
 * payment gateway. Gateway webhooks will call the same function later.
 * Activates the linked project. Idempotent.
 */
export async function markInvoicePaid(
  invoiceId: Types.ObjectId,
  adminId: Types.ObjectId,
  opts: { manual: boolean; gatewayRef?: string } = { manual: true },
): Promise<InvoiceDoc> {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw notFound("Invoice");
  if (invoice.status === "paid" || invoice.status === "manual_paid") {
    return invoice;
  }
  if (invoice.status === "cancelled") {
    throw conflict("Invoice was cancelled", "INVOICE_CANCELLED");
  }

  const before = { status: invoice.status };
  invoice.status = opts.manual ? "manual_paid" : "paid";
  invoice.paidAt = new Date();
  invoice.markedPaidBy = adminId;
  if (opts.gatewayRef) invoice.gatewayRef = opts.gatewayRef;
  await invoice.save();

  await writeAudit({
    actorId: adminId,
    action: opts.manual ? "invoice.manual_paid" : "invoice.paid",
    entityType: "Invoice",
    entityId: invoice._id,
    before,
    after: { status: invoice.status },
  });

  if (invoice.projectId) {
    await activateProject(invoice.projectId, adminId);
  }
  return invoice;
}

/** Client creates a project (awaiting payment) + its invoice, atomically enough. */
export async function createProjectWithInvoice(input: {
  clientId: Types.ObjectId;
  packageKey: string;
  projectType?: ProjectType;
  testerCount?: number;
  appDetails: {
    appName: string;
    packageName: string;
    description?: string;
    iconUrl?: string;
    webOptInUrl?: string;
    playStoreUrl?: string;
  };
}): Promise<{ project: import("../models/index.js").ProjectDoc; invoice: InvoiceDoc }> {
  const pkg = PACKAGES.find((p) => p.key === input.packageKey) ?? PACKAGES[0];
  const projectType = input.projectType ?? "play_store_internal";
  if (!PROJECT_TYPES.includes(projectType)) {
    throw badRequest(`Unknown project type: ${projectType}`, "BAD_PROJECT_TYPE");
  }

  const requiredTesters = Math.max(14, input.testerCount ?? pkg.requiredTesters);

  const project = await Project.create({
    clientId: input.clientId,
    packageKey: input.packageKey,
    projectType,
    appDetails: {
      appName: input.appDetails.appName,
      packageName: input.appDetails.packageName,
      description: input.appDetails.description ?? "",
      iconUrl: input.appDetails.iconUrl,
      webOptInUrl: input.appDetails.webOptInUrl,
      playStoreUrl: input.appDetails.playStoreUrl,
    },
    playIntegration: {
      mode: "manual",
      track: "internal",
      optInUrl: input.appDetails.webOptInUrl,
      serviceAccountLinked: false,
    },
    requiredTesters,
    status: "awaiting_payment",
    joinState: "closed",
    steps: [],
    stepTemplateVersion: "pending",
  });
  const invoice = await createInvoice(input.clientId, input.packageKey, project._id, requiredTesters);

  // keep the client's project list fresh (best-effort; failure doesn't roll back)
  await Client.updateOne(
    { _id: input.clientId },
    { $push: { projects: project._id } },
  );

  return { project, invoice };
}
