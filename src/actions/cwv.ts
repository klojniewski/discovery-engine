"use server";

import { fetchCruxOrigin } from "@/services/crux";
import {
  evaluateCwv,
  normalizeUrls,
  type CwvFormFactorResult,
} from "@/lib/cwv";

const MAX_URLS = 50;
const CONCURRENCY = 5;

export interface CwvRow {
  original: string;
  origin: string | null;
  mobile: CwvFormFactorResult;
  desktop: CwvFormFactorResult;
}

async function fetchFormFactor(
  origin: string,
  formFactor: "PHONE" | "DESKTOP"
): Promise<CwvFormFactorResult> {
  const data = await fetchCruxOrigin(origin, formFactor);
  if ("error" in data) {
    if (data.code === "no_data") return { status: "no_data" };
    return { status: "error", errorMessage: data.error };
  }
  return evaluateCwv(data.metrics);
}

export async function runCwvCheck(rawInput: string): Promise<CwvRow[]> {
  const inputs = normalizeUrls(rawInput);
  if (inputs.length === 0) throw new Error("Please provide at least one URL");
  if (inputs.length > MAX_URLS) {
    throw new Error(`Max ${MAX_URLS} URLs per run (got ${inputs.length})`);
  }

  const rows: CwvRow[] = inputs.map((input) => {
    if (input.error) {
      const err: CwvFormFactorResult = {
        status: "error",
        errorMessage: input.error,
      };
      return {
        original: input.original,
        origin: null,
        mobile: err,
        desktop: err,
      };
    }
    return {
      original: input.original,
      origin: input.origin,
      mobile: { status: "no_data" },
      desktop: { status: "no_data" },
    };
  });

  // Flatten valid (row, formFactor) pairs into a task list so the semaphore
  // caps in-flight CrUX calls — not URLs. At CONCURRENCY=5 that's roughly
  // 2.5 URLs in flight on average, well under Google's 150 QPM limit.
  const tasks: Array<() => Promise<void>> = [];
  for (let i = 0; i < inputs.length; i++) {
    const origin = inputs[i].origin;
    if (!origin) continue;
    tasks.push(async () => {
      rows[i].mobile = await fetchFormFactor(origin, "PHONE");
    });
    tasks.push(async () => {
      rows[i].desktop = await fetchFormFactor(origin, "DESKTOP");
    });
  }

  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      await tasks[i]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker)
  );

  return rows;
}
