"use client";

import { useState } from "react";
import {
  Bot,
  Send,
  Leaf,
  Loader2,
} from "lucide-react";

type ChatMessage = {
  role: "user" | "ai";
  text: string;
};

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      text: "Halo! Saya ReFarm AI. Saya bisa membantu memahami surplus, recovery pathway, dan partner yang relevan.",
    },
  ]);

  async function send() {
    if (!message.trim() || loading) {
      return;
    }

    const userMessage = message.trim();

    setMessage("");

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        role: "user",
        text: userMessage,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await response.json();

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "ai",
          text:
            data.reply ||
            data.error ||
            "Maaf, terjadi kesalahan.",
        },
      ]);
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "ai",
          text: "Tidak dapat terhubung ke ReFarm AI saat ini.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      send();
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-white px-5 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--mint)] text-[var(--green-900)]">
            <Bot size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-black">
              ReFarm AI
            </h1>

            <p className="text-sm text-[var(--muted)]">
              Asisten untuk surplus dan circular recovery.
            </p>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 md:px-8">
        {messages.map((chatMessage, index) => {
          const isUser = chatMessage.role === "user";

          return (
            <div
              key={`${chatMessage.role}-${index}`}
              className={`mb-4 flex ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  isUser
                    ? "bg-[var(--green-800)] text-white"
                    : "card bg-white"
                }`}
              >
                {!isUser && (
                  <div className="mb-1 flex items-center gap-1 text-xs font-bold text-[var(--green-800)]">
                    <Leaf size={13} />
                    ReFarm AI
                  </div>
                )}

                {chatMessage.text}
              </div>
            </div>
          );
        })}

        {/* Loading State */}
        {loading && (
          <div className="card flex w-fit items-center gap-2 px-4 py-3 text-sm text-[var(--muted)]">
            <Loader2
              size={15}
              className="animate-spin"
            />
            Menganalisis...
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 border-t border-[var(--line)] bg-white p-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            type="text"
            className="input"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan tentang surplus atau recovery..."
            disabled={loading}
          />

          <button
            type="button"
            onClick={send}
            disabled={loading || !message.trim()}
            aria-label="Kirim pesan"
            className="btn-primary px-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}