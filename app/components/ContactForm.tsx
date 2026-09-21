"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget;

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
          company: formData.get("system"),
          source: "homepage",
        }),
      });

      if (!response.ok) throw new Error("Failed");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-top">
        <span>◉ ARCHITECTURE BRIEF / v1.4</span>
        <small>RESPONSE: &lt; 48H</small>
      </div>
      <label>
        Name
        <input name="name" placeholder="Your name" required />
      </label>
      <label>
        Work email
        <input
          name="email"
          type="email"
          placeholder="you@company.com"
          required
        />
      </label>
      <label>
        Primary system
        <select name="system" defaultValue="">
          <option value="" disabled>
            Select a focus area
          </option>
          <option>SAP modernization</option>
          <option>AI &amp; data systems</option>
          <option>Cloud infrastructure</option>
        </select>
      </label>
      <label>
        What are you solving?
        <textarea
          name="message"
          rows={3}
          placeholder="Tell us where the system is under pressure..."
          required
        />
      </label>
      {status === "sent" ? (
        <div className="form-success">
          ✓ Thank you. Our architecture team will respond within 48 hours.
        </div>
      ) : status === "error" ? (
        <div className="form-error">
          Something went wrong. Please try again or email
          architect@nexucon.com directly.
        </div>
      ) : (
        <button
          type="submit"
          className="button button-primary"
          disabled={status === "sending"}
        >
          {status === "sending" ? (
            "Dispatching..."
          ) : (
            <>
              Dispatch Architecture Consultation{" "}
              <span aria-hidden="true" className="arrow">
                ↗
              </span>
            </>
          )}
        </button>
      )}
    </form>
  );
}
