import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session) return false;
  return true;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate that it's actually an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Limit file size to 4MB to prevent excessive storage use
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size must be less than 4MB" }, { status: 400 });
    }

    // Generate a unique filename using timestamp to avoid namespace collisions
    const fileExtension = file.name.split(".").pop();
    const uniqueFilename = `show-images/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

    // Securely upload the file to Vercel Blob
    const blob = await put(uniqueFilename, file, {
      access: "public",
      token: process.env.BLOB_SCHOOL_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Vercel Blob upload error:", error);
    return NextResponse.json({ error: "Failed to upload image. Make sure BLOB_READ_WRITE_TOKEN is set." }, { status: 500 });
  }
}
