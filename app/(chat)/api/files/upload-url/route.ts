import { NextResponse } from "next/server";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";

const MAX_FILE_SIZE_BYTES = 32 * 1024 * 1024; // 32MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "image/gif",
  "image/webp",
];

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }

    const token = await generateClientTokenFromReadWriteToken({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowedContentTypes: ALLOWED_TYPES,
      maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
      contentType,
      access: "public",
      addRandomSuffix: true,
      pathname: filename,
    });

    return NextResponse.json({ token, pathname: filename });
  } catch (error) {
    console.error("Failed to generate upload token", error);
    return NextResponse.json({ error: "Failed to generate upload token" }, { status: 500 });
  }
}

