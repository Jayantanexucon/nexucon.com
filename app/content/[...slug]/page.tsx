import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getPageBySlug } from "@/lib/store";

function getSlug(parts: string[]) {
  return `/${parts.join("/")}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(getSlug(slug));
  if (!page) return {};

  return {
    title: page.metaTitle || page.title || "Nexucon",
    description: page.metaDescription || page.summary || "",
    robots: { index: page.indexing !== "noindex", follow: page.follow !== "nofollow" },
    alternates: { canonical: page.canonicalUrl || undefined },
    openGraph: {
      title: page.ogTitle || page.metaTitle || page.title || "Nexucon",
      description: page.ogDescription || page.metaDescription || page.summary || "",
      images: page.ogImage || page.featureImage ? [page.ogImage || page.featureImage] : undefined,
      type: page.type === "blog" ? "article" : "website",
    },
    twitter: {
      card: page.twitterCard === "summary" ? "summary" : "summary_large_image",
      title: page.ogTitle || page.metaTitle || page.title || "Nexucon",
      description: page.ogDescription || page.metaDescription || page.summary || "",
      images: page.ogImage || page.featureImage ? [page.ogImage || page.featureImage] : undefined,
    },
  };
}

export default async function PublicContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(getSlug(slug));
  if (!page) notFound();

  let schema: unknown = null;
  try {
    schema = page.schemaMarkup ? JSON.parse(page.schemaMarkup) : null;
  } catch {
    schema = null;
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-16 text-slate-900">
      {page.breadcrumbs ? <p className="mb-6 text-sm text-slate-500">Home / {page.title}</p> : null}
      <h1 className="text-5xl font-bold tracking-tight">{page.title}</h1>
      {page.summary ? <p className="mt-5 text-xl text-slate-600">{page.summary}</p> : null}
      {page.featureImage ? <Image src={page.featureImage} alt={page.title || "Feature image"} width={1200} height={675} className="mt-8 aspect-video w-full rounded-2xl object-cover" /> : null}
      <article className="prose prose-slate mt-10 max-w-none whitespace-pre-wrap">{page.content}</article>
      {schema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /> : null}
    </main>
  );
}
