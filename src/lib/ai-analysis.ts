import { promises as fs } from "fs";
import path from "path";

export interface SavedAIAnalysis {
  month: string;
  generatedAt: string;
  level: number;
  levelLabel: string;
  analysis: string;
}

const ANALYSIS_PATH = path.join(process.cwd(), "data", "ai-analysis.json");

export async function readSavedAIAnalysis(): Promise<SavedAIAnalysis | null> {
  try {
    const raw = await fs.readFile(ANALYSIS_PATH, "utf8");
    return JSON.parse(raw) as SavedAIAnalysis;
  } catch {
    return null;
  }
}

export async function writeSavedAIAnalysis(payload: SavedAIAnalysis) {
  await fs.mkdir(path.dirname(ANALYSIS_PATH), { recursive: true });
  await fs.writeFile(ANALYSIS_PATH, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}
