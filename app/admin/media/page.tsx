import { requireUserSession } from "@/lib/session";

export default async function MediaPage() {
  await requireUserSession();

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">Media</p>
            <h1 className="mt-2 text-3xl font-bold">Upload feature image</h1>
          </div>
          <a href="/admin" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Dashboard</a>
        </div>
        <form action="/api/upload" method="post" encType="multipart/form-data" className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Image file</span>
            <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" required className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Alt text</span>
            <input name="altText" required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3" placeholder="Describe the image for accessibility and SEO" />
          </label>
          <button className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-500">Upload image</button>
        </form>
      </div>
    </main>
  );
}
