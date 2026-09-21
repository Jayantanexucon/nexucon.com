import { requireUserSession } from "@/lib/session";
import { getAnalyticsSummary } from "@/lib/store";

export default async function AnalyticsPage() {
  await requireUserSession();
  const analytics = await getAnalyticsSummary();

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">Analytics</p>
            <h1 className="mt-2 text-3xl font-bold">Marketing performance</h1>
          </div>
          <a href="/admin" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Dashboard</a>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Page views, last 30 days</p><p className="mt-3 text-4xl font-bold">{analytics.monthlyViews}</p></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Enquiry conversion</p><p className="mt-3 text-4xl font-bold">{analytics.conversionRate}%</p></div>
          <div className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">Technical SEO score</p><p className="mt-3 text-4xl font-bold text-emerald-600">{analytics.seoScore}/100</p></div>
        </div>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Tracked events</h2>
          <p className="mt-2 text-sm text-slate-600">Page views are recorded through the CMS analytics endpoint and can later be extended with campaigns, conversions, and Search Console imports.</p>
        </div>
      </div>
    </main>
  );
}