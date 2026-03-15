import { promises as fs } from "fs";
import path from "path";

export interface SavedAIAnalysis {
  month: string;
  generatedAt: string;
  level: number;
  levelLabel: string;
  analysis: string;
}

const ANALYSIS_DIR = path.join(process.cwd(), "data", "analyses");

export async function readSavedAIAnalysis(userId: number): Promise<SavedAIAnalysis | null> {
  try {
    const filePath = path.join(ANALYSIS_DIR, `analysis-${userId}.json`);
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as SavedAIAnalysis;
  } catch {
    return null;
  }
}

export async function writeSavedAIAnalysis(userId: number, payload: SavedAIAnalysis) {
  try {
    await fs.mkdir(ANALYSIS_DIR, { recursive: true });
    const filePath = path.join(ANALYSIS_DIR, `analysis-${userId}.json`);
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    return payload;
  } catch (err) {
    console.error("Failed to write AI analysis:", err);
    return payload;
  }
}
