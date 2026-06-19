"use client";

import { useState } from "react";
import Send from "lucide-react/dist/esm/icons/send";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";

export function RequestAccessForm() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      // Format the message for the backend to reuse the existing /api/contact logic
      const finalMessage = formData.message.trim() 
        ? `Requesting API Access.\n\nMessage: ${formData.message}`
        : "Requesting API Access.";

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: finalMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
    } catch (err: unknown) {
      console.error("Form submission error:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  if (status === "success") {
    return (
      <div className="border border-green-500/20 bg-green-500/5 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-mono font-bold text-fg">Request Sent Successfully</h3>
          <p className="text-sm font-mono text-fg-dim mt-2 max-w-md mx-auto">
            We have received your API access request. Our team will review it and get back to you shortly via email.
          </p>
        </div>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="border border-border-alt bg-card p-6 md:p-8">
      <div className="mb-6 space-y-2">
        <h2 className="text-xl font-mono font-bold text-fg flex items-center gap-2">
          <Send className="w-5 h-5 text-red-500" /> Request Access
        </h2>
        <p className="text-sm font-mono text-fg-dim">
          Submit your details to request API access or GitHub repo access.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {status === "error" && (
          <div className="flex items-center gap-3 p-3 border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-mono text-fg-dim uppercase tracking-widest">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              disabled={status === "loading"}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-input border border-border-alt text-sm font-mono text-fg focus:outline-none focus:border-red-500/50 transition-colors disabled:opacity-50"
              placeholder="Your Name"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-mono text-fg-dim uppercase tracking-widest">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={status === "loading"}
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-input border border-border-alt text-sm font-mono text-fg focus:outline-none focus:border-red-500/50 transition-colors disabled:opacity-50"
              placeholder="your@email.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="message" className="text-xs font-mono text-fg-dim uppercase tracking-widest">
            Message <span className="text-fg-faint">(Optional)</span>
          </label>
          <textarea
            id="message"
            rows={3}
            disabled={status === "loading"}
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            className="w-full px-3 py-2 bg-input border border-border-alt text-sm font-mono text-fg focus:outline-none focus:border-red-500/50 transition-colors resize-y disabled:opacity-50"
            placeholder="Tell us about your use case..."
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full md:w-auto px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-mono font-bold transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                Submit Request <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
