import { NextResponse } from "next/server";

import { requireUserSession } from "@/lib/session";
import { saveSiteSettings } from "@/lib/store";

export async function POST(request: Request) {
  await requireUserSession();

  const formData = await request.formData();
  const payload = Object.fromEntries(formData.entries());

  const settings = {
    metaTitle: String(payload.metaTitle || ""),
    metaDescription: String(payload.metaDescription || ""),
    canonicalUrl: String(payload.canonicalUrl || ""),
    robots: String(payload.robots || "index,follow"),
    indexing: String(payload.indexing || "index"),
    follow: String(payload.follow || "follow"),
    ogTitle: String(payload.ogTitle || ""),
    ogDescription: String(payload.ogDescription || ""),
    twitterCard: String(payload.twitterCard || "summary_large_image"),
    ogImage: String(payload.ogImage || ""),
    schemaMarkup: String(payload.schemaMarkup || ""),
    headerCode: String(payload.headerCode || ""),
    footerSocialLinks: {
      facebook: String(payload.facebookUrl || ""),
      linkedin: String(payload.linkedinUrl || ""),
      x: String(payload.xUrl || ""),
      instagram: String(payload.instagramUrl || ""),
    },
    pageTitle: String(payload.pageTitle || ""),
    pageSlug: String(payload.pageSlug || "/"),
    pageSummary: String(payload.pageSummary || ""),
    blogCategory: String(payload.blogCategory || "General"),
    tags: String(payload.tags || "seo, cms, growth")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    featureImage: String(payload.featureImage || "/images/default-feature.jpg"),
    contentBody: String(payload.contentBody || ""),
    breadcrumbs: payload.breadcrumbs === "on",
    socialsInFooter: payload.socialsInFooter === "on",
  };

  await saveSiteSettings(settings);

  return NextResponse.redirect(new URL("/admin", process.env.APP_URL || "http://localhost:3000"));
}
