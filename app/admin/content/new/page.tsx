"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewContentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") || ""),
      slug: String(formData.get("slug") || ""),
      type: String(formData.get("type") || "page"),
      summary: String(formData.get("summary") || ""),
      category: String(formData.get("category") || "General"),
      tags: String(formData.get("tags") || "").split(",").map((tag) => tag.trim()).filter(Boolean),
      featureImage: String(formData.get("featureImage") || "/images/default-feature.jpg"),
      metaTitle: String(formData.get("metaTitle") || ""),
      metaDescription: String(formData.get("metaDescription") || ""),
      canonicalUrl: String(formData.get("canonicalUrl") || "https://nexucon.com"),
      ogTitle: String(formData.get("ogTitle") || ""),
      ogDescription: String(formData.get("ogDescription") || ""),
      ogImage: String(formData.get("ogImage") || ""),
      schemaMarkup: String(formData.get("schemaMarkup") || ""),
      content: String(formData.get("content") || ""),
      breadcrumbs: String(formData.get("breadcrumbs") || "on") === "on",
      twitterCard: String(formData.get("twitterCard") || "summary_large_image"),
      indexing: String(formData.get("indexing") || "index"),
      follow: String(formData.get("follow") || "follow"),
    };

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save content");
      }

      router.push("/admin/content");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Content save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">Create</p>
            <h1 className="mt-2 text-3xl font-bold">New page or blog</h1>
          </div>
          <a href="/admin/content" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Content library
          </a>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input name="title" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" required />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Slug</span>
            <input name="slug" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" placeholder="/slug" required />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Type</span>
            <select name="type" defaultValue="page" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500">
              <option value="page">Page</option>
              <option value="blog">Blog</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Category</span>
            <input name="category" defaultValue="General" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Summary</span>
            <textarea name="summary" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Tags</span>
            <input name="tags" defaultValue="seo, cms, marketing" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Feature image URL</span>
            <input name="featureImage" defaultValue="/images/default-feature.jpg" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
          </label>

          <label className="space-y-2 md:col-span-1">
            <span className="text-sm font-medium text-slate-700">Meta title</span>
            <input name="metaTitle" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
          </label>

          <label className="space-y-2 md:col-span-1">
            <span className="text-sm font-medium text-slate-700">Canonical URL</span>
            <input name="canonicalUrl" defaultValue="https://nexucon.com" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Meta description</span>
            <textarea name="metaDescription" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Indexing</span>
            <select name="indexing" defaultValue="index" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <option value="index">Index</option>
              <option value="noindex">Noindex</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Link following</span>
            <select name="follow" defaultValue="follow" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <option value="follow">Follow</option>
              <option value="nofollow">Nofollow</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Open Graph title</span>
            <input name="ogTitle" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Open Graph image URL</span>
            <input name="ogImage" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Open Graph description</span>
            <textarea name="ogDescription" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Schema markup</span>
            <textarea name="schemaMarkup" rows={4} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs outline-none focus:border-cyan-500" />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Content editor</span>
            <textarea name="content" rows={8} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
          </label>

          <label className="flex items-center gap-3 md:col-span-2">
            <input type="checkbox" name="breadcrumbs" defaultChecked className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
            <span className="text-sm font-medium text-slate-700">Breadcrumb enabled</span>
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={saving} className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? "Saving..." : "Save page"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
