import type { Types } from "mongoose";
import type { MetricType } from "@defineux/types";
import { MetricEvent } from "../models/index.js";
import { logger } from "../config/logger.js";

export interface MetricInput {
  projectId?: Types.ObjectId;
  actorId?: Types.ObjectId;
  meta?: Record<string, unknown>;
}

/** metricEvents from day one — PRD targets are provable from timestamps. */
export async function recordMetric(type: MetricType, input: MetricInput = {}): Promise<void> {
  try {
    await MetricEvent.create({
      type,
      projectId: input.projectId,
      actorId: input.actorId,
      meta: input.meta ?? {},
    });
  } catch (err) {
    logger.error({ err, type }, "metric write failed");
  }
}
