import { Router } from "express";
import userRoutes from "./user.routes";
import clientRoutes from "./client.routes";
import testerRoutes from "./tester.routes";
import projectRoutes from "./project.routes";
import assignmentRoutes from "./assignment.routes";
import bugReportRoutes from "./bugReport.routes";
import walletRoutes from "./wallet.routes";
import invoiceRoutes from "./invoice.routes";
import notificationRoutes from "./notification.routes";
import supportTicketRoutes from "./supportTicket.routes";
import metricsRoutes from "./metrics.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/clients", clientRoutes);
router.use("/testers", testerRoutes);
router.use("/projects", projectRoutes);
router.use("/assignments", assignmentRoutes);
// Bug report routes are mounted at root because they nest under /projects/:projectId/bug-reports
// as well as exposing top-level /bug-reports/merge and /bug-reports/publish.
router.use("/", bugReportRoutes);
router.use("/wallet", walletRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/notifications", notificationRoutes);
router.use("/support-tickets", supportTicketRoutes);
router.use("/metrics", metricsRoutes);
router.use("/uploads", uploadRoutes);

export default router;
