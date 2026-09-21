import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "admin" },
  },
  { timestamps: true },
);

const siteSettingsSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, default: "Nexucon CMS" },
    metaDescription: { type: String, default: "Headless CMS for marketing-first growth." },
    canonicalUrl: { type: String, default: "https://nexucon.com" },
    robots: { type: String, default: "index,follow" },
    indexing: { type: String, default: "index" },
    follow: { type: String, default: "follow" },
    ogTitle: { type: String, default: "Nexucon" },
    ogDescription: { type: String, default: "Growth-driven content and SEO optimization." },
    twitterCard: { type: String, default: "summary_large_image" },
    ogImage: { type: String, default: "/uploads/default-og-image.jpg" },
    schemaMarkup: { type: String, default: "{\"@context\": \"https://schema.org\", \"@type\": \"WebSite\"}" },
    headerCode: { type: String, default: "<!-- header.php -->" },
    footerSocialLinks: {
      type: Object,
      default: {
        facebook: "https://facebook.com",
        linkedin: "https://linkedin.com",
        x: "https://x.com",
      },
    },
    pageTitle: { type: String, default: "Home" },
    pageSlug: { type: String, default: "/" },
    pageSummary: { type: String, default: "Short summary for this page." },
    blogCategory: { type: String, default: "General" },
    tags: { type: [String], default: ["seo", "cms", "growth"] },
    featureImage: { type: String, default: "/images/default-feature.jpg" },
    contentBody: { type: String, default: "Content editor panel" },
    breadcrumbs: { type: Boolean, default: true },
    socialsInFooter: { type: Boolean, default: true },
    totalPages: { type: Number, default: 18 },
    totalBlogPosts: { type: Number, default: 12 },
    dashboardNote: { type: String, default: "Marketing CMS dashboard" },
  },
  { timestamps: true },
);

const pageSchema = new mongoose.Schema(
  {
    title: String,
    slug: String,
    type: { type: String, default: "page" },
    summary: String,
    category: String,
    tags: [String],
    featureImage: String,
    metaTitle: String,
    metaDescription: String,
    canonicalUrl: String,
    schemaMarkup: String,
    content: String,
    breadcrumbs: { type: Boolean, default: true },
    openGraph: Object,
    twitterCard: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    indexing: { type: String, enum: ["index", "noindex"], default: "index" },
    follow: { type: String, enum: ["follow", "nofollow"], default: "follow" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const enquirySchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    company: String,
    message: String,
    source: { type: String, default: "website" },
    status: { type: String, default: "new" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const analyticsEventSchema = new mongoose.Schema(
  {
    event: { type: String, required: true },
    path: { type: String, required: true },
    referrer: String,
    userAgent: String,
    metadata: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const mediaAssetSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: String,
    size: Number,
    altText: String,
  },
  { timestamps: true },
);

export const UserModel = mongoose.models.User ?? mongoose.model("User", userSchema);
export const SiteSettingsModel =
  mongoose.models.SiteSettings ?? mongoose.model("SiteSettings", siteSettingsSchema);
export const ContentPageModel =
  mongoose.models.ContentPage ?? mongoose.model("ContentPage", pageSchema);
export const EnquiryModel = mongoose.models.Enquiry ?? mongoose.model("Enquiry", enquirySchema);
export const AnalyticsEventModel =
  mongoose.models.AnalyticsEvent ?? mongoose.model("AnalyticsEvent", analyticsEventSchema);
export const MediaAssetModel =
  mongoose.models.MediaAsset ?? mongoose.model("MediaAsset", mediaAssetSchema);
