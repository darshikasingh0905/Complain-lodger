import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircleHeart, X, Send, Sparkles, Bot, Loader2 } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { useComplaints } from "../../context/ComplaintContext";
import { sendChatMessage } from "../../services/assistantService";

/**
 * Civic Sathi — the floating AI chatbot, available on every citizen page.
 *
 * - Answers from the citizen's REAL complaint data (the backend injects their
 *   tickets into the LLM context).
 * - Follows the active theme automatically (teal, or pink in Women Safety
 *   Mode) because it only uses the primary color tokens.
 * - Never breaks: backend falls back to rule-based replies when Ollama is
 *   down, and the frontend falls back to a local responder when the backend
 *   is down.
 */

const QUICK_CHIPS = [
  "Where is my complaint?",
  "How do I report a pothole?",
  "I feel unsafe in my area",
  "What are the SLA deadlines?",
];

const WELCOME = {
  role: "assistant",
  content:
    "Namaste! 🙏 I'm **Civic Sathi**, your grievance assistant. Ask me about your complaints, how to report an issue, or safety helplines.",
};

/** Tiny markdown: **bold** + line breaks (chat replies use only these). */
function RichText({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          p.split("\n").map((line, j, arr) => (
            <React.Fragment key={`${i}-${j}`}>
              {line}
              {j < arr.length - 1 && <br />}
            </React.Fragment>
          ))
        )
      )}
    </>
  );
}

export default function ChatbotWidget() {
  const { isAuthenticated, userRole, userData } = useAuth();
  const { complaints } = useComplaints();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open, sending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(
    async (text) => {
      const message = (text ?? input).trim();
      if (!message || sending) return;
      setInput("");

      const history = messages.filter((m) => m !== WELCOME);
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setSending(true);
      try {
        const { reply } = await sendChatMessage({
          message,
          history,
          citizenPhone: userData?.mobile,
          complaints,
        });
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } finally {
        setSending(false);
      }
    },
    [input, sending, messages, userData?.mobile, complaints]
  );

  // Citizens only — admins have their own console, and the login pages
  // shouldn't float a personal assistant.
  if (!isAuthenticated || userRole !== "citizen") return null;

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Civic Sathi chat assistant"
          className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-primary text-white
            shadow-lift flex items-center justify-center hover:bg-primary-hover
            transition-all hover:scale-105 animate-pop"
        >
          <MessageCircleHeart className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-5 right-5 z-40 w-[min(380px,calc(100vw-24px))] h-[min(540px,calc(100vh-96px))]
            bg-surface border border-border rounded-card shadow-lift flex flex-col overflow-hidden animate-pop"
          role="dialog"
          aria-label="Civic Sathi chat assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-primary text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="w-[18px] h-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">Civic Sathi</p>
                <p className="text-[10px] opacity-80 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI grievance assistant
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 bg-surfaceSoft">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl ${
                    m.role === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-surface border border-border text-text rounded-bl-md"
                  }`}
                >
                  <RichText text={m.content} />
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2 text-muted text-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  thinking…
                </div>
              </div>
            )}
          </div>

          {/* Quick chips (only while conversation is fresh) */}
          {messages.length <= 2 && !sending && (
            <div className="px-3.5 pb-2 pt-1 flex flex-wrap gap-1.5 bg-surfaceSoft shrink-0">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => send(chip)}
                  className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold border
                    bg-primary-light text-primary border-primary/20 hover:bg-primary hover:text-white transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 p-3 border-t border-border bg-surface shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your complaints…"
              maxLength={1000}
              className="input !py-2.5 text-sm flex-1"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              aria-label="Send message"
              className="btn-primary !p-2.5 !rounded-lg shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
