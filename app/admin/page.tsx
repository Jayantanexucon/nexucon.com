import { redirect } from "next/navigation";

import { requireUserSession } from "@/lib/session";
import { getDashboardStats, getEnquiries, getSiteSettings, getUsers } from "@/lib/store";

export default async function AdminPage() {
  const user = await requireUserSession();
  const settings = await getSiteSettings();
  const dashboardStats = await getDashboardStats();
  const enquiries = await getEnquiries();
  const users = await getUsers();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Dashboard</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Nexucon admin portal</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{user.role}</div>
            <a href="/admin/content" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Content library
            </a>
            <a href="/admin/content/new" className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500">
              New page
            </a>
            <a href="/admin/media" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Media
            </a>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700">
                Logout
              </button>
            </form>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total pages", value: dashboardStats.totalPages },
            { label: "Blog posts", value: dashboardStats.totalBlogPosts },
            { label: "Users", value: dashboardStats.totalUsers },
            { label: "Enquiries", value: dashboardStats.totalEnquiries },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
          <section className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">SEO & content settings</h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  SEO ready
                </span>
              </div>

              <form action="/admin/save-settings" method="post" className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Meta title</span>
                  <input name="metaTitle" defaultValue={settings.metaTitle} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Canonical URL</span>
                  <input name="canonicalUrl" defaultValue={settings.canonicalUrl} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Meta description</span>
                  <textarea name="metaDescription" rows={3} defaultValue={settings.metaDescription} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Robots</span>
                  <input name="robots" defaultValue={settings.robots} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Index / noindex</span>
                  <input name="indexing" defaultValue={settings.indexing} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Follow / nofollow</span>
                  <input name="follow" defaultValue={settings.follow} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Open Graph title</span>
                  <input name="ogTitle" defaultValue={settings.ogTitle} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Open Graph description</span>
                  <textarea name="ogDescription" rows={3} defaultValue={settings.ogDescription} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">X card type</span>
                  <input name="twitterCard" defaultValue={settings.twitterCard} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Open Graph image</span>
                  <input name="ogImage" defaultValue={settings.ogImage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Feature image</span>
                  <input name="featureImage" defaultValue={settings.featureImage} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Schema markup</span>
                  <textarea name="schemaMarkup" rows={4} defaultValue={settings.schemaMarkup} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Header.php code access</span>
                  <textarea name="headerCode" rows={4} defaultValue={settings.headerCode} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Page title</span>
                  <input name="pageTitle" defaultValue={settings.pageTitle} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Page slug</span>
                  <input name="pageSlug" defaultValue={settings.pageSlug} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Blog category</span>
                  <input name="blogCategory" defaultValue={settings.blogCategory} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-700">Tags</span>
                  <input name="tags" defaultValue={(settings.tags || []).join(", ")} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Blog summary</span>
                  <textarea name="pageSummary" rows={3} defaultValue={settings.pageSummary} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Content editor</span>
                  <textarea name="contentBody" rows={6} defaultValue={settings.contentBody} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </label>

                <label className="flex items-center gap-3 md:col-span-1">
                  <input type="checkbox" name="breadcrumbs" defaultChecked={Boolean(settings.breadcrumbs)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                  <span className="text-sm font-medium text-slate-700">Breadcrumbs</span>
                </label>

                <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                  <input name="facebookUrl" defaultValue={settings.footerSocialLinks?.facebook} placeholder="Facebook URL" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                  <input name="linkedinUrl" defaultValue={settings.footerSocialLinks?.linkedin} placeholder="LinkedIn URL" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                  <input name="xUrl" defaultValue={settings.footerSocialLinks?.x} placeholder="X URL" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                  <input name="instagramUrl" defaultValue={settings.footerSocialLinks?.instagram} placeholder="Instagram URL" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                </div>

                <label className="flex items-center gap-3 md:col-span-1">
                  <input type="checkbox" name="socialsInFooter" defaultChecked={Boolean(settings.socialsInFooter)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                  <span className="text-sm font-medium text-slate-700">Social icons in footer</span>
                </label>

                <div className="md:col-span-2 flex justify-end">
                  <button type="submit" className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500">
                    Save settings
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">User management</h2>
              <form action="/admin/create-user" method="post" className="grid gap-4 md:grid-cols-2">
                <input name="name" placeholder="Admin or editor name" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                <input name="email" type="email" placeholder="user@example.com" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                <input name="password" type="password" placeholder="Password" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500" />
                <select name="role" defaultValue="editor" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-cyan-500">
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="marketing">Marketing</option>
                </select>
                <div className="md:col-span-2 flex justify-end">
                  <button type="submit" className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
                    Create user
                  </button>
                </div>
              </form>``
            </div>
          </section>

          <aside className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">Marketing overview</h2>
              <div className="space-y-4">
                <div className="rounded-2xl bg-cyan-50 p-4">
                  <p className="text-sm text-cyan-800">SEO score</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-900">{dashboardStats.seoScore}</p>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-4">
                  <p className="text-sm text-indigo-800">Conversion rate</p>
                  <p className="mt-2 text-3xl font-bold text-indigo-900">{dashboardStats.conversionRate}%</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">Monthly views</p>
                  <p className="mt-2 text-3xl font-bold text-amber-900">{dashboardStats.monthlyViews}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">User enquiries</h2>
              <div className="space-y-3">
                {enquiries.slice(0, 4).map((item) => (
                  <div key={String(item._id ?? item.id)} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.email}</p>
                    <p className="mt-2 text-sm text-slate-600">{item.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-xl font-semibold text-slate-900">Team access</h2>
              <div className="space-y-2">
                {(users.filter(Boolean) as Array<Record<string, unknown>>).map((person) => (
                  <div key={String(person._id || person.id)} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <div>
                      <p className="font-medium text-slate-800">{String(person.name || "")}</p>
                      <p className="text-xs text-slate-500">{String(person.email || "")}</p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">
                      {String(person.role || "user")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
