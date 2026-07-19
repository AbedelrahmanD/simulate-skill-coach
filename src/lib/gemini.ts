import { GoogleGenerativeAI } from "@google/generative-ai";

export type Mode = "hr" | "technical" | "grill";

export const MODE_META: Record<Mode, { label: string; emoji: string; persona: string; instructions: string }> = {
  hr: {
    label: "HR Mode",
    emoji: "👔",
    persona: "a warm but professional Senior HR Manager",
    instructions:
      "Focus on behavioral questions using the STAR method, soft skills, culture fit, motivations, and career goals. Keep tone encouraging.",
  },
  technical: {
    label: "Technical Mode",
    emoji: "💻",
    persona: "a Senior Software Engineer conducting a technical interview",
    instructions:
      "Ask deep technical questions grounded in the candidate's resume skills and experience. Probe understanding of trade-offs, system design, and fundamentals.",
  },
  grill: {
    label: "Grill Mode",
    emoji: "⚡",
    persona: "a Critical Tech Lead running a high-pressure stress interview",
    instructions:
      "Fire rapid follow-ups, challenge every assumption, push back on vague answers, and stress-test reasoning. Stay respectful but relentless.",
  },
};

export function buildSystemPrompt(mode: Mode, resumeText: string, jd: string): string {
  const meta = MODE_META[mode];
  return `You are ${meta.persona}, conducting a ${meta.label} interview.

CANDIDATE RESUME:
"""
${resumeText || "(No resume provided — ask candidate to briefly introduce themselves first.)"}
"""

JOB DESCRIPTION:
"""
${jd || "(No job description provided.)"}
"""

INSTRUCTIONS:
- ${meta.instructions}
- Ask ONE question at a time. Never bundle multiple questions.
- After each candidate answer, give brief (1–2 sentences) feedback, then ask the next question.
- Keep responses concise and conversational — this will be spoken aloud.
- Do not use markdown, lists, or code blocks. Plain speech only.
- Begin by greeting the candidate and asking your first question.`;
}

export interface ChatMsg {
  role: "user" | "model";
  text: string;
}

export async function sendToGemini(
  apiKey: string,
  systemPrompt: string,
  history: ChatMsg[],
  userMessage: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });
  const chat = model.startChat({
    history: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
  });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}