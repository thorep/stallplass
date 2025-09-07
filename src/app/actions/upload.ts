"use server";

import { createApiLogger } from "@/lib/logger";
import { IMAGE_CONSTRAINTS } from "@/utils/constants";
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function uploadImageAction(formData: FormData) {
  const requestId = crypto.randomUUID();
  const apiLogger = createApiLogger({
    endpoint: "uploadImageAction",
    method: "POST",
    requestId,
  });

  try {
    // Authenticate the request
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      throw new Error("Unauthorized");
    }
    const user = authResult;

    apiLogger.info({ userId: user.id }, "User authenticated successfully");

    // Parse form data
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    // Map type to bucket name
    const typeToBucketMap: Record<string, string> = {
      stable: "stableimages",
      box: "boximages",
      service: "service-photos",
      horse: "horse",
      "horse-sale": "horse-sales",
      "part-loan-horse": "part-loan-horse",
      forum: "forum",
      user: "stableimages",
    };

    const bucket = type ? typeToBucketMap[type] : null;
    const folder = user.id;

    if (!file) {
      throw new Error("Missing file");
    }

    if (!type || !bucket) {
      throw new Error("Missing or invalid type parameter");
    }

    // Validate bucket
    const allowedBuckets = ["stableimages", "boximages", "service-photos", "horse", "horse-sales", "forum", "part-loan-horse"];
    if (!allowedBuckets.includes(bucket)) {
      throw new Error("Invalid bucket");
    }

    // Check file size
    if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
      throw new Error(`File too large: ${Math.round((file.size / (1024 * 1024)) * 100) / 100}MB exceeds limit`);
    }

    // Check file type
    if (!IMAGE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type as (typeof IMAGE_CONSTRAINTS.ALLOWED_TYPES)[number])) {
      throw new Error(`Invalid file type: ${file.type}`);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();

    // Upload to Supabase
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": file.type,
        "Cache-Control": "3600",
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => "Unknown upload error");
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
    }

    // Build public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;

    apiLogger.info({
      publicUrl,
      filePath,
      uploadSuccess: true,
      fileName: file.name,
      fileSize: file.size,
    }, "File upload completed successfully");

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    apiLogger.error({
      error: error instanceof Error ? error.message : "Unknown error",
      requestId,
    }, "Error in uploadImageAction");

    throw error;
  }
}