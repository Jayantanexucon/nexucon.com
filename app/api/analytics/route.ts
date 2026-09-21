import { NextResponse } from "next/server";

import { recordAnalyticsEvent } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await recordAnalyticsEvent({
      event: body.event || "page_view",
      path: body.path || "/",
      referrer: request.headers.get("referer") || body.referrer || "",
      userAgent: request.headers.get("user-agent") || "",
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Unable to record analytics event." }, { status: 500 });
  }
}
