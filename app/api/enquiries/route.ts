import { NextResponse } from "next/server";

import { createEnquiry } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json({ message: "Name, email, and message are required." }, { status: 400 });
    }

    const enquiry = await createEnquiry({
      name,
      email,
      message,
      company: String(body.company || ""),
      source: String(body.source || "website"),
    });

    return NextResponse.json({ success: true, enquiry }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to save enquiry." }, { status: 500 });
  }
}
