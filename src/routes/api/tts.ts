import { createFileRoute } from "@tanstack/react-router";

// Streams natural-sounding speech via Lovable AI (OpenAI gpt-4o-mini-tts).
// The browser posts { text, voice } and gets back an audio/mpeg body.
export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { text, voice } = (await request.json()) as {
            text: string;
            voice?: string;
          };
          if (!text || typeof text !== "string") {
            return new Response("Missing text", { status: 400 });
          }
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response("TTS not configured", { status: 500 });
          }
          const res = await fetch(
            "https://ai.gateway.lovable.dev/v1/audio/speech",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "openai/gpt-4o-mini-tts",
                input: text.slice(0, 4000),
                voice: voice || "alloy",
                response_format: "mp3",
                instructions:
                  "Speak in a warm, natural, conversational tone. Sound like a friendly professional interviewer — human, unhurried, and encouraging. Avoid a robotic or overly formal delivery.",
              }),
            },
          );
          if (!res.ok) {
            const msg = await res.text().catch(() => "");
            return new Response(msg || "TTS failed", { status: res.status });
          }
          return new Response(res.body, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          return new Response(String((err as Error).message ?? err), {
            status: 500,
          });
        }
      },
    },
  },
});