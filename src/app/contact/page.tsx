"use client";

import { useState, useRef } from "react";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import Mail from "lucide-react/dist/esm/icons/mail";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Send from "lucide-react/dist/esm/icons/send";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Clock from "lucide-react/dist/esm/icons/clock";
import Github from "lucide-react/dist/esm/icons/github";
import Link from "next/link";
import { event } from "@/lib/analytics";

const MAX_NAME = 128;
const MAX_MESSAGE = 2048;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const validate = (): boolean => {
    const e: FieldErrors = {};
    const trimmedName = name.trim();
    if (!trimmedName) e.name = "Name is required.";
    else if (trimmedName.length > MAX_NAME) e.name = `Name must be under ${MAX_NAME} characters.`;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) e.email = "Email is required.";
    else if (!EMAIL_RE.test(trimmedEmail)) e.email = "Invalid email format.";

    const trimmedMessage = message.trim();
    if (!trimmedMessage) e.message = "Message is required.";
    else if (trimmedMessage.length > MAX_MESSAGE) e.message = `Message must be under ${MAX_MESSAGE} characters.`;

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSent(true);
        event("form_submit", { form_type: "contact" });
      } else {
        setServerError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setServerError("Network error. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-dvh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 sm:space-y-16">
        {/* Header */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <MessageSquare className="w-3 h-3 text-red-500" />
                Get In Touch
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Contact<span className="text-red-500">.</span> Us
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-xl leading-relaxed">
                Have questions, feedback, or need support? We&apos;re here to help.
                Reach out through the form or any of the channels below.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-3 border border-border-alt bg-card p-8">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Send className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-fg">
                Send a Message
              </h2>
            </div>

            {sent ? (
              <div className="text-center py-8 sm:py-16 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <Mail className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-lg font-mono text-emerald-400 font-semibold">Message Sent</p>
                  <p className="text-xs font-mono text-fg-dim mt-2 max-w-sm mx-auto">
                    Thank you for reaching out. We&apos;ll respond within 24-48 hours.
                  </p>
                </div>
                <button
                  onClick={() => { setSent(false); setName(""); setEmail(""); setMessage(""); setErrors({}); setServerError(""); }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-hover text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-fg-dim flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-500/50" />
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                      required
                      placeholder="Your name"
                      className={`w-full bg-input border px-4 py-3 text-sm font-mono text-fg placeholder:text-fg-faint outline-none focus:ring-1 focus:ring-red-500/10 transition-all ${errors.name ? "border-red-500/60 focus:border-red-500/40" : "border-border-alt focus:border-red-500/30"}`}
                    />
                    {errors.name && (
                      <p className="text-[10px] font-mono text-red-400">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-fg-dim flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-red-500/50" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                      required
                      placeholder="your@email.com"
                      className={`w-full bg-input border px-4 py-3 text-sm font-mono text-fg placeholder:text-fg-faint outline-none focus:ring-1 focus:ring-red-500/10 transition-all ${errors.email ? "border-red-500/60 focus:border-red-500/40" : "border-border-alt focus:border-red-500/30"}`}
                    />
                    {errors.email && (
                      <p className="text-[10px] font-mono text-red-400">{errors.email}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-fg-dim flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-500/50" />
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); setErrors((p) => ({ ...p, message: undefined })); }}
                    required
                    rows={5}
                    placeholder="How can we help you?"
                    className={`w-full bg-input border px-4 py-3 text-sm font-mono text-fg placeholder:text-fg-faint outline-none focus:ring-1 focus:ring-red-500/10 transition-all resize-none ${errors.message ? "border-red-500/60 focus:border-red-500/40" : "border-border-alt focus:border-red-500/30"}`}
                  />
                  {errors.message && (
                    <p className="text-[10px] font-mono text-red-400">{errors.message}</p>
                  )}
                </div>
                {serverError && (
                  <p className="text-[11px] font-mono text-red-400 text-center">{serverError}</p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-fg font-mono text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending Message...
                    </>
                  ) : (
                    <>
                      Send Message <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Channels */}
            <div className="border border-border-alt bg-card p-6 space-y-5">
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-widest text-fg-dim">
                Contact Channels
              </h3>
              <div className="space-y-4">
                <a
                  href="mailto:contact@kheladekho.com"
                  className="flex items-start gap-4 p-4 border border-border bg-input hover:border-red-500/20 hover:bg-red-500/[0.03] transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-hover border border-border-alt flex items-center justify-center shrink-0 group-hover:border-red-500/20 group-hover:bg-red-500/10 transition-all">
                    <Mail className="w-4 h-4 text-fg-dim group-hover:text-red-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-fg font-semibold">Email</p>
                    <p className="text-[11px] font-mono text-fg-dim mt-0.5">contact@kheladekho.com</p>
                  </div>
                </a>

                <a
                  href="https://github.com/mosabbir-maruf"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => event("external_link_click", { link_url: "https://github.com/mosabbir-maruf", link_text: "GitHub" })}
                  className="flex items-start gap-4 p-4 border border-border bg-input hover:border-red-500/20 hover:bg-red-500/[0.03] transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-hover border border-border-alt flex items-center justify-center shrink-0 group-hover:border-red-500/20 group-hover:bg-red-500/10 transition-all">
                    <Github className="w-4 h-4 text-fg-dim group-hover:text-red-400 transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-fg font-semibold">GitHub</p>
                    <p className="text-[11px] font-mono text-fg-dim mt-0.5">View my GitHub profile</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Response Time */}
            <div className="border border-border-alt bg-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-fg">
                  Response Time
                </h3>
              </div>
              <p className="text-xs font-mono text-fg-dim leading-relaxed">
                We aim to reply to all inquiries within <span className="text-fg">24-48 hours</span> during
                business days. For urgent matters, please use GitHub Issues.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
