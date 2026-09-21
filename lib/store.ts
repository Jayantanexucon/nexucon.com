import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

import { connectToDatabase } from "@/lib/db";
import {
  AnalyticsEventModel,
  ContentPageModel,
  EnquiryModel,
  MediaAssetModel,
  SiteSettingsModel,
  UserModel,
} from "@/models/cms";

type StoreRecord = Record<string, unknown>;

const memoryStore = {
  users: [] as StoreRecord[],
  settings: null as StoreRecord | null,
  enquiries: [] as StoreRecord[],
  pages: [] as StoreRecord[],
  analytics: [] as StoreRecord[],
  media: [] as StoreRecord[],
};

let isSeeded = false;

export function defaultSiteSettings() {
  return {
    metaTitle: "Nexucon Digital Growth Studio",
    metaDescription:
      "A modern CMS and marketing portal for content, SEO, analytics, and conversion-focused brand publishing.",
    canonicalUrl: "https://nexucon.com",
    robots: "index,follow",
    indexing: "index",
    follow: "follow",
    ogTitle: "Nexucon Digital Growth Studio",
    ogDescription:
      "Performance marketing resources, SEO content systems, and CRO strategy built for digital brands.",
    twitterCard: "summary_large_image",
    ogImage: "/uploads/default-og-image.jpg",
    schemaMarkup: '{"@context":"https://schema.org","@type":"WebSite","name":"Nexucon","url":"https://nexucon.com"}',
    headerCode: "<!-- Example header.php code -->\n<?php echo get_header(); ?>",
    footerSocialLinks: {
      facebook: "https://facebook.com/nexucon",
      linkedin: "https://linkedin.com/company/nexucon",
      x: "https://x.com/nexucon",
      instagram: "https://instagram.com/nexucon",
    },
    pageTitle: "Home",
    pageSlug: "/",
    pageSummary: "Landing page summary for marketing and conversion goals.",
    blogCategory: "SEO",
    tags: ["seo", "cms", "digital-marketing"],
    featureImage: "/images/feature-image.jpg",
    contentBody: "Use this content editor to update the page structure and on-page optimization.",
    breadcrumbs: true,
    socialsInFooter: true,
    totalPages: 18,
    totalBlogPosts: 12,
    dashboardNote: "This CMS keeps metadata, SEO, schemas, forms, and content centrally managed.",
  };
}

export async function ensureSeedData() {
  if (isSeeded) {
    return;
  }

  const db = await connectToDatabase();
  const adminEmail = process.env.ADMIN_EMAIL || "admin@nexucon.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  if (db) {
    const existingUser = await UserModel.findOne({ email: adminEmail.toLowerCase() }).lean();
    if (!existingUser) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await UserModel.create({
        id: randomUUID(),
        name: "System Admin",
        email: adminEmail,
        passwordHash,
        role: "admin",
      });
    }

    const existingSettings = await SiteSettingsModel.findOne({}).lean();
    if (!existingSettings) {
      await SiteSettingsModel.create(defaultSiteSettings());
    }
  } else {
    if (!memoryStore.users.length) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      memoryStore.users.push({
        id: randomUUID(),
        name: "System Admin",
        email: adminEmail,
        passwordHash,
        role: "admin",
      });
    }

    if (!memoryStore.settings) {
      memoryStore.settings = defaultSiteSettings();
    }
  }

  isSeeded = true;
}

function sanitizeUser(user: StoreRecord) {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  return safeUser;
}

export async function getUsers() {
  await ensureSeedData();
  const db = await connectToDatabase();

  if (db) {
    const users = await UserModel.find({}).lean();
    return users.map((user) => sanitizeUser(user as StoreRecord));
  }

  return memoryStore.users.map((user) => sanitizeUser(user));
}

export async function getUserByEmail(email: string) {
  await ensureSeedData();
  const db = await connectToDatabase();

  if (db) {
    return UserModel.findOne({ email: email.toLowerCase() }).lean();
  }

  return memoryStore.users.find((user) => String(user.email).toLowerCase() === email.toLowerCase()) || null;
}

export async function createUserRecord(data: { name: string; email: string; password: string; role?: string }) {
  await ensureSeedData();
  const db = await connectToDatabase();
  const passwordHash = await bcrypt.hash(data.password || "ChangeMe123!", 10);
  const payload = {
    id: randomUUID(),
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    role: data.role || "editor",
  };

  if (db) {
    const created = await UserModel.create(payload);
    return sanitizeUser(created.toObject());
  }

  memoryStore.users.push(payload);
  return sanitizeUser(payload);
}

export async function getSiteSettings() {
  await ensureSeedData();
  const db = await connectToDatabase();

  if (db) {
    const settings = await SiteSettingsModel.findOne({}).lean();
    return settings || defaultSiteSettings();
  }

  if (!memoryStore.settings) {
    memoryStore.settings = defaultSiteSettings();
  }

  return memoryStore.settings;
}

export async function saveSiteSettings(data: StoreRecord) {
  await ensureSeedData();
  const db = await connectToDatabase();
  const payload = { ...defaultSiteSettings(), ...data };

  if (db) {
    const existing = await SiteSettingsModel.findOne({});
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return existing.toObject();
    }

    const created = await SiteSettingsModel.create(payload);
    return created.toObject();
  }

  memoryStore.settings = payload;
  return payload;
}

export async function getDashboardStats() {
  await ensureSeedData();
  const enquiries = await getEnquiries();
  const users = await getUsers();

  const db = await connectToDatabase();
  let totalPages = 0;
  let totalBlogPosts = 0;
  if (db) {
    const totals = await ContentPageModel.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);
    totalPages = totals.find((item: { _id: string; count: number }) => item._id === "page")?.count || 0;
    totalBlogPosts = totals.find((item: { _id: string; count: number }) => item._id === "blog")?.count || 0;
  } else {
    const totals = memoryStore.pages.reduce<Record<string, number>>((counts, page) => {
      const type = String(page.type || "page");
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
    totalPages = totals.page || 0;
    totalBlogPosts = totals.blog || 0;
  }

  const analytics = await getAnalyticsSummary();
  return {
    totalPages,
    totalBlogPosts,
    totalUsers: users.length,
    totalEnquiries: enquiries.length,
    seoScore: analytics.seoScore,
    conversionRate: analytics.conversionRate,
    monthlyViews: analytics.monthlyViews,
  };
}

export async function getEnquiries() {
  await ensureSeedData();
  const db = await connectToDatabase();

  if (db) {
    return EnquiryModel.find({}).sort({ createdAt: -1 }).lean();
  }

  return memoryStore.enquiries;
}

export async function createEnquiry(data: StoreRecord) {
  await ensureSeedData();
  const db = await connectToDatabase();
  const payload = {
    id: randomUUID(),
    name: data.name || "New enquiry",
    email: data.email || "",
    company: data.company || "",
    message: data.message || "",
    source: data.source || "website",
    status: "new",
    createdAt: new Date(),
  };

  if (db) {
    const created = await EnquiryModel.create(payload);
    return created.toObject();
  }

  memoryStore.enquiries.unshift(payload);
  return payload;
}

export async function getPages() {
  await ensureSeedData();
  const db = await connectToDatabase();

  if (db) {
    return ContentPageModel.find({}).sort({ createdAt: -1 }).lean();
  }

  return memoryStore.pages;
}

export async function getPageBySlug(slug: string) {
  await ensureSeedData();
  const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`;
  const db = await connectToDatabase();

  if (db) {
    return ContentPageModel.findOne({ slug: normalizedSlug }).lean();
  }

  return memoryStore.pages.find((page) => page.slug === normalizedSlug) || null;
}

export async function savePageEntry(data: StoreRecord) {
  await ensureSeedData();
  const db = await connectToDatabase();

  const payload = {
    title: data.title || "New content",
    slug: data.slug || "/new-page",
    type: data.type || "page",
    summary: data.summary || "",
    category: data.category || "General",
    tags: Array.isArray(data.tags) ? data.tags : String(data.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    featureImage: data.featureImage || "/images/default-feature.jpg",
    metaTitle: data.metaTitle || data.title || "New content",
    metaDescription: data.metaDescription || "",
    canonicalUrl: data.canonicalUrl || "https://nexucon.com",
    schemaMarkup: data.schemaMarkup || "",
    content: data.content || "",
    breadcrumbs: data.breadcrumbs !== undefined ? Boolean(data.breadcrumbs) : true,
    openGraph: data.openGraph || {},
    twitterCard: data.twitterCard || "summary_large_image",
    ogTitle: data.ogTitle || data.metaTitle || data.title || "",
    ogDescription: data.ogDescription || data.metaDescription || "",
    ogImage: data.ogImage || data.featureImage || "/uploads/default-og-image.jpg",
    indexing: data.indexing === "noindex" ? "noindex" : "index",
    follow: data.follow === "nofollow" ? "nofollow" : "follow",
  };

  if (db) {
    if (data.id) {
      const updated = await ContentPageModel.findByIdAndUpdate(data.id, payload, { new: true });
      return updated?.toObject?.() ?? payload;
    }

    const created = await ContentPageModel.create(payload);
    return created.toObject();
  }

  if (data.id) {
    const index = memoryStore.pages.findIndex((page) => String(page._id || page.id) === String(data.id));
    if (index >= 0) {
      memoryStore.pages[index] = { ...memoryStore.pages[index], ...payload };
      return memoryStore.pages[index];
    }
  }

  memoryStore.pages.unshift({ id: randomUUID(), ...payload });
  return memoryStore.pages[0];
}

export async function recordAnalyticsEvent(data: StoreRecord) {
  const db = await connectToDatabase();
  const payload = {
    event: String(data.event || "page_view"),
    path: String(data.path || "/"),
    referrer: String(data.referrer || ""),
    userAgent: String(data.userAgent || ""),
    metadata: data.metadata || {},
    createdAt: new Date(),
  };

  if (db) {
    return (await AnalyticsEventModel.create(payload)).toObject();
  }

  memoryStore.analytics.unshift({ id: randomUUID(), ...payload });
  return memoryStore.analytics[0];
}

export async function getAnalyticsSummary() {
  const db = await connectToDatabase();
  if (db) {
    const [views, enquiries] = await Promise.all([
      AnalyticsEventModel.countDocuments({ event: "page_view", createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }),
      EnquiryModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }),
    ]);
    return {
      views,
      monthlyViews: views.toLocaleString(),
      conversionRate: views ? Number(((enquiries / views) * 100).toFixed(1)) : 0,
      seoScore: 100,
    };
  }

  const views = memoryStore.analytics.filter((item) => item.event === "page_view").length;
  const enquiries = memoryStore.enquiries.length;
  return {
    views,
    monthlyViews: views.toLocaleString(),
    conversionRate: views ? Number(((enquiries / views) * 100).toFixed(1)) : 0,
    seoScore: 100,
  };
}

export async function saveMediaAsset(data: StoreRecord) {
  const db = await connectToDatabase();
  if (db) {
    return (await MediaAssetModel.create(data)).toObject();
  }
  const asset = { id: randomUUID(), ...data, createdAt: new Date() };
  memoryStore.media.unshift(asset);
  return asset;
}
