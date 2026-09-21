"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserSession } from "@/lib/session";
import { createEnquiry, createUserRecord, saveSiteSettings } from "@/lib/store";

export async function saveSiteSettingsAction(formData: FormData) {
  await requireUserSession();

  const settings = {
    metaTitle: formData.get("metaTitle")?.toString() || "",
    metaDescription: formData.get("metaDescription")?.toString() || "",
    canonicalUrl: formData.get("canonicalUrl")?.toString() || "",
    robots: formData.get("robots")?.toString() || "index,follow",
    indexing: formData.get("indexing")?.toString() || "index",
    follow: formData.get("follow")?.toString() || "follow",
    ogTitle: formData.get("ogTitle")?.toString() || "",
    ogDescription: formData.get("ogDescription")?.toString() || "",
    twitterCard: formData.get("twitterCard")?.toString() || "summary_large_image",
    schemaMarkup: formData.get("schemaMarkup")?.toString() || "",
    headerCode: formData.get("headerCode")?.toString() || "",
    footerSocialLinks: {
      facebook: formData.get("facebookUrl")?.toString() || "",
      linkedin: formData.get("linkedinUrl")?.toString() || "",
      x: formData.get("xUrl")?.toString() || "",
      instagram: formData.get("instagramUrl")?.toString() || "",
    },
    pageTitle: formData.get("pageTitle")?.toString() || "",
    pageSlug: formData.get("pageSlug")?.toString() || "/",
    pageSummary: formData.get("pageSummary")?.toString() || "",
    blogCategory: formData.get("blogCategory")?.toString() || "General",
    tags: (formData.get("tags")?.toString() || "seo, cms, growth")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    featureImage: formData.get("featureImage")?.toString() || "/images/default-feature.jpg",
    contentBody: formData.get("contentBody")?.toString() || "",
    breadcrumbs: formData.get("breadcrumbs") === "on",
    socialsInFooter: formData.get("socialsInFooter") === "on",
  };

  await saveSiteSettings(settings);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function createUserAction(formData: FormData) {
  await requireUserSession();

  const name = formData.get("name")?.toString() || "";
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const role = formData.get("role")?.toString() || "editor";

  if (!name || !email || !password) {
    redirect("/admin");
  }

  await createUserRecord({ name, email, password, role });
  revalidatePath("/admin");
  redirect("/admin");
}

export async function submitLeadAction(formData: FormData) {
  await requireUserSession();

  await createEnquiry({
    name: formData.get("name")?.toString() || "Anonymous",
    email: formData.get("email")?.toString() || "",
    company: formData.get("company")?.toString() || "",
    message: formData.get("message")?.toString() || "",
    source: formData.get("source")?.toString() || "website",
  });

  revalidatePath("/admin");
  redirect("/admin");
}
