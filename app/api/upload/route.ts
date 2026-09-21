import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireUserSession } from "@/lib/session";
import { saveMediaAsset } from "@/lib/store";

export const runtime = "nodejs";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const maxBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  await requireUserSession();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const altText = String(formData.get("altText") || "");

    if (!(file instanceof File) || !allowedTypes.has(file.type)) {
      return NextResponse.json({ message: "Upload a JPEG, PNG, WebP, GIF, or SVG image." }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json({ message: "Image must be 8 MB or smaller." }, { status: 400 });
    }

    const extension = path.extname(file.name).toLowerCase() || ".bin";
    const filename = `${randomUUID()}${extension}`;
    const uploadDirectory = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(path.join(uploadDirectory, filename), Buffer.from(await file.arrayBuffer()));

    const asset = await saveMediaAsset({
      filename: file.name,
      url: `/uploads/${filename}`,
      mimeType: file.type,
      size: file.size,
      altText,
    });

    return NextResponse.json({ success: true, asset }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Unable to upload image." }, { status: 500 });
  }
}
