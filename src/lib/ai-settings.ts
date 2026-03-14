import { promises as fs } from "fs";
import path from "path";

export interface AISettings {
  baseUrl: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
}

const DEFAULT_SETTINGS: AISettings = {
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  apiKey: "",
  systemPrompt:
    "Kamu adalah analis keuangan pribadi berbahasa Indonesia. Berikan rekomendasi yang praktis, jelas, terukur, dan berurutan berdasarkan data keuangan pengguna.",
};

const SETTINGS_PATH = path.join(process.cwd(), "data", "ai-settings.json");

export async function readAISettings(): Promise<AISettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<AISettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function writeAISettings(input: Partial<AISettings>) {
  const current = await readAISettings();
  const next = {
    ...current,
    ...input,
  };

  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}
