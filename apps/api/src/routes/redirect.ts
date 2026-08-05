import { Router } from "express";
import { Assignment, Project } from "../models/index.js";
import { recordMetric } from "../services/metrics.js";

export const redirectRouter = Router();

/**
 * Public per-tester testing link: /t/:assignmentId.
 * Google issues one opt-in URL per track — per-tester tracking comes from
 * these unique redirects. Every click is a metric event.
 */
redirectRouter.get("/:assignmentId", async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId).lean();
    if (!assignment || assignment.status === "removed") {
      res.status(404).json({
        ok: false,
        error: { code: "LINK_DEAD", message: "This testing link is no longer valid" },
      });
      return;
    }
    const project = await Project.findById(assignment.projectId).lean();
    const optInUrl = project?.playIntegration.optInUrl;
    if (!project || !optInUrl) {
      res.status(404).json({
        ok: false,
        error: { code: "NO_TARGET", message: "Testing link not available yet" },
      });
      return;
    }

    await recordMetric("testing_link_clicked", {
      projectId: project._id,
      meta: { assignmentId: assignment._id, ua: req.header("user-agent") ?? "" },
    });
    res.redirect(302, optInUrl);
  } catch (err) {
    next(err);
  }
});
