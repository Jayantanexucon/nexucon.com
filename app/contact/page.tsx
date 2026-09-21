"use client";

import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    });
    setMessage(response.ok ? "Thanks. Your enquiry has been submitted." : "Please check the form and try again.");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-16 text-slate-900">
      <form onSubmit={submit} className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">Contact</p>
        <h1 className="mt-3 text-3xl font-bold">Send an enquiry</h1>
        <div className="mt-8 space-y-4">
          <input name="name" required placeholder="Your name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" />
          <input name="email" required type="email" placeholder="Email address" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" />
          <input name="company" placeholder="Company" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" />
          <textarea name="message" required rows={6} placeholder="How can we help?" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" />
          <button className="w-full rounded-xl bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-500">Submit enquiry</button>
          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      </form>
    </main>
  );
}
