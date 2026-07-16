// ─────────────────────────────────────────────────────────────────────────────
// Assistant service — chatbot + voice-assist API calls.
//
// Both endpoints degrade gracefully: the backend falls back to rule-based
// answers when Ollama is down, and this module falls back to a tiny local
// responder when the backend itself is unreachable, so the chatbot never
// breaks the demo.
// ─────────────────────────────────────────────────────────────────────────────
import axios from "axios";
import { API_URL } from "./complaintService";
import { attachAuthInterceptor } from "./tokenStore";

const http = axios.create({ baseURL: API_URL, timeout: 45000 });
attachAuthInterceptor(http); // JWT: assistant calls carry the Bearer token

/** Minimal offline responder — used only when the whole backend is down. */
const localReply = (message, complaints = []) => {
  const lower = message.toLowerCase();
  if (/status|track|where|progress|my complaint|ticket/.test(lower)) {
    if (!complaints.length)
      return "You haven't lodged any complaints yet. Tap **Lodge Grievance** to submit your first one.";
    const lines = complaints
      .slice(0, 5)
      .map((c) => `• ${c.id} — ${c.status} (${c.priorityLevel || c.priority} priority)`);
    return `Your recent complaints:\n${lines.join("\n")}\nOpen **Track Status** for full timelines.`;
  }
  if (/danger|unsafe|emergency|harass|scared|followed/.test(lower))
    return "If you're in immediate danger call **112** or **100** (police). Women's helplines: **1091** / **181**. Then report it via the **Safety** page — photos are optional there.";
  if (/women|pink|safety mode/.test(lower))
    return "Women Safety Mode lives on the **Safety** page — flip it on and the portal turns pink, photos become optional, and reports get a +15 priority boost.";
  if (/how|lodge|submit|report|file/.test(lower))
    return "Tap **Lodge Grievance**, describe the issue (or dictate with the mic), add a photo + location, and submit. AI routes it instantly and gives you a CMP ID.";
  if (/sla|deadline|how long|when/.test(lower))
    return "SLAs: Critical → 24h, High → 3 days, Medium → 7 days, Low → 14 days. Breaches auto-escalate.";
  return "I can help you lodge complaints, track tickets, explain SLAs, or share safety helplines. Try: \"Where is my complaint?\"";
};

/**
 * Send a chat message. `history` is [{role, content}]; `complaints` is the
 * citizen's normalized complaint list (used only for the offline fallback).
 */
export const sendChatMessage = async ({ message, history, citizenPhone, complaints }) => {
  try {
    const res = await http.post("/assistant/chat", {
      message,
      history: (history || []).slice(-8).map(({ role, content }) => ({ role, content })),
      citizen_phone: citizenPhone || null,
    });
    return { reply: res.data.reply, source: res.data.source };
  } catch {
    return { reply: localReply(message, complaints), source: "local" };
  }
};

/**
 * Convert a raw voice transcript (any language) into an English complaint
 * draft {title, description}. Returns null-ish translated=false fallback
 * when everything is offline.
 */
export const voiceAssist = async ({ transcript, language }) => {
  try {
    const res = await http.post("/assistant/voice-assist", { transcript, language });
    return res.data;
  } catch {
    return {
      title: transcript.split(/\s+/).slice(0, 8).join(" "),
      description: transcript,
      detected_language: language,
      translated: false,
      source: "local",
    };
  }
};
