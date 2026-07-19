# MockMate — Autonomous Interview Simulator

A 100% client-side React app that runs realistic mock interviews using Google Gemini, your resume, and your microphone. No backend, no database — your resume and API key never leave your browser.

## Features

- 👔 **HR / 💻 Technical / ⚡ Grill** interview modes with distinct AI personas
- 📄 **PDF resume parsing** (pdfjs-dist Web Worker, all in-browser)
- 🎙️ **Voice input & output** via the native Web Speech API
- 🗣️ Selectable interviewer voice persona
- 💾 Session (chat, mode, voice, resume) auto-persisted in `localStorage`
- 🔐 API key stored only in your browser

## Get a free Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Sign in and click **Create API key**
3. Copy the key and paste it into MockMate's Settings dialog (opens automatically on first load, or via the ⚙️ icon)

## Run locally

```bash
bun install
bun run dev
```

## Browser support

Web Speech API works best in Chrome and Edge. Safari supports speech synthesis; recognition is limited. Firefox does not currently support SpeechRecognition — typed input still works.

## Privacy

- Resume PDFs are parsed **in-browser** with pdfjs-dist. The raw file is never uploaded.
- Chat requests go **directly** from your browser to Google's Generative Language API using your key.
- No analytics, no server, no telemetry.