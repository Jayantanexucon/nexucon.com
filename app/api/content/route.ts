import { NextResponse } from "next/server";

import { requireUserSession } from "@/lib/session";
import { getPageBySlug, savePageEntry } from "@/lib/store";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") || "/";
  const page = await getPageBySlug(slug);

  if (!page) {
    return NextResponse.json({ message: "Content not found." }, { status: 404 });
  }

  return NextResponse.json({ page });
}

export async function POST(request: Request) {
  await requireUserSession();

  try {
    const body = await request.json();
    if (body.schemaMarkup) {
      try {
        JSON.parse(String(body.schemaMarkup));
      } catch {
        return NextResponse.json({ message: "Schema markup must be valid JSON." }, { status: 400 });
      }
    }
    const page = await savePageEntry(body);
    return NextResponse.json({ success: true, page });
  } catch {
    return NextResponse.json({ message: "Failed to save content." }, { status: 500 });
  }
}
