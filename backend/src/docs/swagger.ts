import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import { env } from "../config/env";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "LaunchOps API",
      version: "1.0.0",
      description:
        "LaunchOps Phase 1 MVP backend — the operating system for Play Store launch testing. " +
        "Covers client onboarding & payment, tester matching & queueing, the step-based " +
        "workflow engine, Google Play integration, bug reporting, tester wallet & UPI payouts, " +
        "and the admin console that replaces WhatsApp, Sheets, and manual reporting.",
    },
    servers: [
      { url: `${env.appBaseUrl}/api/v1`, description: env.nodeEnv },
    ],
    tags: [
      { name: "Users", description: "Clerk-linked identity + role provisioning" },
      { name: "Clients", description: "Client accounts, billing, communication history" },
      { name: "Testers", description: "Tester profiles, devices, UPI, status" },
      { name: "Projects", description: "Project lifecycle, joining, Play Console handoff" },
      { name: "Assignments", description: "Tester ↔ project lifecycle, proofs, verification" },
      { name: "Bug Reports", description: "Structured QA submissions, dedup, publishing" },
      { name: "Wallet", description: "Tester earnings ledger and UPI withdrawals" },
      { name: "Invoices", description: "Client billing, checkout, payment webhook" },
      { name: "Notifications", description: "Dispatch log for reminders and alerts" },
      { name: "Support", description: "In-platform support ticket threads" },
      { name: "Metrics", description: "PRD success-metric instrumentation" },
      { name: "Uploads", description: "Presigned R2 file upload/download URLs" },
      { name: "Testing Links", description: "Per-tester tracked redirects to Google Play" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Clerk session JWT — send as `Authorization: Bearer <token>`.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                details: { type: "object", nullable: true },
              },
            },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            pages: { type: "integer" },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            clerkUserId: { type: "string" },
            role: { type: "string", enum: ["client", "tester", "admin"] },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            status: { type: "string", enum: ["active", "suspended"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Client: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            companyName: { type: "string" },
            contactName: { type: "string" },
            billingInfo: {
              type: "object",
              properties: { gstin: { type: "string" }, billingAddress: { type: "string" } },
            },
            activePackage: { type: "string", enum: ["testers_only", "managed_testing", "launch_ready", "custom"] },
            projects: { type: "array", items: { type: "string" } },
            communications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  channel: { type: "string", enum: ["email", "support_ticket", "manual_note"] },
                  subject: { type: "string" },
                  body: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  createdBy: { type: "string" },
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Tester: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            devices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  model: { type: "string" },
                  androidVersion: { type: "string" },
                  fingerprint: { type: "string" },
                },
              },
            },
            experienceLevel: { type: "string", enum: ["beginner", "intermediate", "expert"] },
            upi: {
              type: "object",
              properties: { vpa: { type: "string" }, qrImageUrl: { type: "string" } },
            },
            ratingAvg: { type: "number" },
            ratingCount: { type: "integer" },
            walletBalance: { type: "integer", description: "Minor units (paise)" },
            status: { type: "string", enum: ["active", "inactive", "suspended"] },
            lastActiveAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Step: {
          type: "object",
          properties: {
            order: { type: "integer" },
            type: {
              type: "string",
              enum: [
                "verification",
                "google_email_review",
                "play_store_invite",
                "testing_period",
                "production_review",
                "completion",
              ],
            },
            state: { type: "string", enum: ["pending", "submitted", "verified", "rejected"] },
            deadline: { type: "string", format: "date-time" },
            reminderSentAt: { type: "string", format: "date-time" },
            config: { type: "object", description: "gate (project|time|manual), perTesterAction, payoutAmount, etc." },
          },
        },
        PlayIntegration: {
          type: "object",
          properties: {
            mode: { type: "string", enum: ["manual", "api"] },
            track: { type: "string", enum: ["internal", "closed"] },
            aabFileUrl: { type: "string" },
            packageName: { type: "string" },
            optInUrl: { type: "string" },
            serviceAccountLinked: { type: "boolean" },
            testerGoogleGroupEmail: { type: "string" },
            versionCode: { type: "integer" },
            lastApiError: { type: "string" },
            emailReviewSubmittedAt: { type: "string", format: "date-time" },
            emailReviewExpectedApprovalAt: { type: "string", format: "date-time" },
            testingPeriodStartAt: { type: "string", format: "date-time" },
            productionAppliedAt: { type: "string", format: "date-time" },
            productionApprovedAt: { type: "string", format: "date-time" },
          },
        },
        ClientVerification: {
          type: "object",
          properties: {
            required: { type: "boolean" },
            status: { type: "string", enum: ["not_required", "pending", "submitted", "verified", "rejected"] },
            proofUrl: { type: "string" },
            note: { type: "string" },
            submittedAt: { type: "string", format: "date-time" },
            verifiedAt: { type: "string", format: "date-time" },
            verifiedBy: { type: "string" },
          },
        },
        Project: {
          type: "object",
          properties: {
            _id: { type: "string" },
            clientId: { type: "string" },
            package: { type: "string", enum: ["testers_only", "managed_testing", "launch_ready", "custom"] },
            appDetails: {
              type: "object",
              properties: {
                appName: { type: "string" },
                packageName: { type: "string" },
                description: { type: "string" },
                playStoreUrl: { type: "string" },
              },
            },
            projectType: { type: "string", enum: ["play_store_internal_testing"] },
            requiredTesters: { type: "integer" },
            activeTesterCount: { type: "integer" },
            status: {
              type: "string",
              enum: [
                "draft",
                "pending_verification",
                "awaiting_payment",
                "active",
                "full",
                "closed",
                "completed",
                "cancelled",
              ],
            },
            joinState: { type: "string", enum: ["open", "full", "closed"] },
            steps: { type: "array", items: { $ref: "#/components/schemas/Step" } },
            stepTemplateVersion: { type: "integer" },
            playIntegration: { $ref: "#/components/schemas/PlayIntegration" },
            verification: { $ref: "#/components/schemas/ClientVerification" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Proof: {
          type: "object",
          properties: {
            step: { type: "integer" },
            fileUrl: { type: "string" },
            fileHash: { type: "string" },
            verifiedBy: { type: "string" },
            verificationSource: { type: "string", enum: ["admin", "auto"] },
            status: { type: "string", enum: ["pending", "verified", "rejected"] },
            rejectionReason: { type: "string" },
            submittedAt: { type: "string", format: "date-time" },
            verifiedAt: { type: "string", format: "date-time" },
          },
        },
        Assignment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            testerId: { type: "string" },
            projectId: { type: "string" },
            status: { type: "string", enum: ["queued", "active", "removed", "completed"] },
            currentStep: { type: "integer" },
            queuePosition: { type: "integer" },
            replacedBy: { type: "string" },
            proofs: { type: "array", items: { $ref: "#/components/schemas/Proof" } },
            inactivityFlag: { type: "boolean" },
            lastActivityAt: { type: "string", format: "date-time" },
            assignedAt: { type: "string", format: "date-time" },
            scheduledInstallDate: { type: "string", format: "date-time" },
            installPacingNotifiedAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        BugReport: {
          type: "object",
          properties: {
            _id: { type: "string" },
            projectId: { type: "string" },
            testerId: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string", enum: ["crash", "functional", "ui_ux", "performance", "security", "other"] },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
            device: { type: "string" },
            appVersion: { type: "string" },
            expectedResult: { type: "string" },
            actualResult: { type: "string" },
            stepsToReproduce: { type: "array", items: { type: "string" } },
            attachments: { type: "array", items: { type: "string" } },
            duplicateOf: { type: "string" },
            status: { type: "string", enum: ["open", "duplicate", "merged", "published"] },
            publishedAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        WalletTransaction: {
          type: "object",
          properties: {
            _id: { type: "string" },
            testerId: { type: "string" },
            projectId: { type: "string" },
            type: { type: "string", enum: ["earning", "withdrawal"] },
            amount: { type: "integer", description: "Minor units (paise)" },
            status: { type: "string", enum: ["pending", "approved", "rejected", "paid"] },
            transactionId: { type: "string", description: "UPI transaction ID, attached when a withdrawal is completed" },
            expectedCompletionAt: { type: "string", format: "date-time" },
            note: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        WalletSummary: {
          type: "object",
          properties: {
            balance: { type: "integer" },
            pendingWithdrawals: { type: "integer" },
            availableForWithdrawal: { type: "integer" },
            history: { type: "array", items: { $ref: "#/components/schemas/WalletTransaction" } },
          },
        },
        Invoice: {
          type: "object",
          properties: {
            _id: { type: "string" },
            clientId: { type: "string" },
            projectId: { type: "string" },
            package: { type: "string", enum: ["testers_only", "managed_testing", "launch_ready", "custom"] },
            amount: { type: "integer" },
            gst: { type: "integer" },
            status: { type: "string", enum: ["pending", "paid", "manual_paid", "failed"] },
            gatewayRef: { type: "string" },
            dueDate: { type: "string", format: "date-time" },
            paidAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Notification: {
          type: "object",
          properties: {
            _id: { type: "string" },
            recipientId: { type: "string" },
            type: { type: "string" },
            channel: { type: "string", enum: ["email", "push", "sms", "whatsapp"] },
            payload: { type: "object" },
            status: { type: "string", enum: ["queued", "sent", "failed"] },
            idempotencyKey: { type: "string" },
            attempts: { type: "integer" },
            lastError: { type: "string" },
            sentAt: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        SupportTicket: {
          type: "object",
          properties: {
            _id: { type: "string" },
            raisedBy: { type: "string" },
            projectId: { type: "string" },
            subject: { type: "string" },
            status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] },
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  authorId: { type: "string" },
                  body: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
            assignedAdminId: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Resolved relative to this file's own directory (not process.cwd()) so JSDoc
  // discovery works identically under ts-node-dev (src/*.ts) and the compiled
  // dist build (dist/*.js — comments survive tsc since removeComments is false).
  // swagger-jsdoc's glob matcher requires forward slashes even on Windows, so
  // path.join's backslashes must be normalized or every path silently matches zero files.
  apis: [
    path.join(__dirname, "../routes/*.ts").split(path.sep).join("/"),
    path.join(__dirname, "../routes/*.js").split(path.sep).join("/"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
