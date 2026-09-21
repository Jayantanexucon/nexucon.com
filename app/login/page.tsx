"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Login failed");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-slate-900/40 backdrop-blur xl:grid-cols-2">
          <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-900 p-10 xl:flex">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),transparent_38%)]" />
            <div className="relative z-10">
              <div className="mb-10 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-[0.18em] uppercase text-cyan-100">
                Nexucon CMS
              </div>
              <h1 className="max-w-sm text-4xl font-semibold leading-tight">Headless CMS for SEO, content, and growth.</h1>
              <p className="mt-5 max-w-sm text-sm text-blue-50/80">
                Manage page metadata, schema markup, blog content, forms, and analytics from one centralized admin portal.
              </p>
            </div>

            <div className="relative z-10 space-y-4 text-sm text-blue-50/85">
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">• SEO metadata control</div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">• Schema markup and social cards</div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">• Digital marketing workflow dashboard</div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-slate-900 p-8 sm:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan-300">Welcome back</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Admin login</h2>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue="admin@nexucon.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    placeholder="admin@nexucon.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm text-slate-300">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    defaultValue="Admin@123"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-400">
                Default admin: admin@nexucon.com / Admin@123
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
