"use server";

import { db } from "@/db";
import { apiUsage } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export interface ProjectCostSummary {
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  callCount: number;
  byStep: {
    step: string;
    costUsd: number;
    inputTokens: number;
    outputTokens: number;
    callCount: number;
  }[];
}

export async function getAllProjectCosts(): Promise<
  Map<string, { totalCostUsd: number; callCount: number }>
> {
  const rows = await db
    .select({
      projectId: apiUsage.projectId,
      costMicros: sql<number>`sum(${apiUsage.costUsd})`.as("cost_micros"),
      callCount: sql<number>`count(*)`.as("call_count"),
    })
    .from(apiUsage)
    .groupBy(apiUsage.projectId);

  const map = new Map<string, { totalCostUsd: number; callCount: number }>();
  for (const r of rows) {
    if (r.projectId) {
      map.set(r.projectId, {
        totalCostUsd: Number(r.costMicros) / 1_000_000,
        callCount: Number(r.callCount),
      });
    }
  }
  return map;
}

export async function getProjectCosts(
  projectId: string
): Promise<ProjectCostSummary> {
  const rows = await db
    .select({
      step: apiUsage.step,
      costMicros: sql<number>`sum(${apiUsage.costUsd})`.as("cost_micros"),
      inputTokens: sql<number>`sum(${apiUsage.inputTokens})`.as("input_tokens"),
      outputTokens: sql<number>`sum(${apiUsage.outputTokens})`.as("output_tokens"),
      callCount: sql<number>`count(*)`.as("call_count"),
    })
    .from(apiUsage)
    .where(eq(apiUsage.projectId, projectId))
    .groupBy(apiUsage.step);

  const byStep = rows.map((r) => ({
    step: r.step,
    costUsd: Number(r.costMicros) / 1_000_000,
    inputTokens: Number(r.inputTokens),
    outputTokens: Number(r.outputTokens),
    callCount: Number(r.callCount),
  }));

  return {
    totalCostUsd: byStep.reduce((sum, s) => sum + s.costUsd, 0),
    totalInputTokens: byStep.reduce((sum, s) => sum + s.inputTokens, 0),
    totalOutputTokens: byStep.reduce((sum, s) => sum + s.outputTokens, 0),
    callCount: byStep.reduce((sum, s) => sum + s.callCount, 0),
    byStep,
  };
}
