import { prisma } from "@/lib/prisma";

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

export async function readAISettings(userId: number): Promise<AISettings> {
  const settings = await prisma.aISettings.findUnique({ where: { userId } });
  if (!settings) return DEFAULT_SETTINGS;
  return {
    baseUrl: settings.baseUrl,
    model: settings.model,
    apiKey: settings.apiKey,
    systemPrompt: settings.systemPrompt,
  };
}

export async function writeAISettings(userId: number, input: Partial<AISettings>) {
  const current = await readAISettings(userId);
  const next = { ...current, ...input };

  const updated = await prisma.aISettings.upsert({
    where: { userId },
    update: { ...next },
    create: { userId, ...next },
  });
  return updated;
}
