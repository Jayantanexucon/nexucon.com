import { requireUserSession } from "@/lib/session";
import { getPages } from "@/lib/store";

export default async function ContentLibraryPage() {
  await requireUserSession();
  const pages = await getPages();

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">Content</p>
            <h1 className="mt-2 text-3xl font-bold">Page and blog content library</h1>
          </div>
          <a href="/admin" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Back to dashboard
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <article key={String(page._id || page.id)} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-700">
                  {page.type || "page"}
                </span>
                <span className="text-xs text-slate-500">{page.slug || "/"}</span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">{page.title || "Untitled"}</h2>
              <p className="mt-3 text-sm text-slate-600">{page.summary || page.metaDescription || "No summary added yet."}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(Array.isArray(page.tags) ? page.tags : [page.tags]).filter(Boolean).slice(0, 4).map((tag: string) => (
                  <span key={String(tag)} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
