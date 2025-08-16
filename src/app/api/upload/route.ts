import { createApiLogger } from "@/lib/logger";
import { IMAGE_CONSTRAINTS } from "@/utils/constants";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from '@/lib/auth';

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload files to Supabase Storage
 *     description: |
 *       Uploads files to Supabase Storage buckets. Supports uploading images for
 *       stables, boxes, services, users, and horses. Files are stored in organized folders
 *       and given unique filenames to prevent conflicts. The endpoint validates
 *       user authentication and maps file types to appropriate storage buckets.
 *     tags:
 *       - Upload
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - type
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload (images supported)
 *               type:
 *                 type: string
 *                 enum: [stable, box, service, user, horse, part-loan-horse]
 *                 description: Type of entity the file belongs to
 *               entityId:
 *                 type: string
 *                 description: ID of the entity (optional, not used for folder structure)
 *                 nullable: true
 *           example:
 *             file: "(binary image file)"
 *             type: "stable"
 *             entityId: "stable123"
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                   description: Public URL of the uploaded file
 *                 path:
 *                   type: string
 *                   description: Storage path of the uploaded file
 *             example:
 *               url: "https://supabase.co/storage/v1/object/public/stable/user123/1642680000000-abc123.jpg"
 *               path: "user123/1642680000000-abc123.jpg"
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 *                   nullable: true
 *             examples:
 *               missingFile:
 *                 value:
 *                   error: "Missing file"
 *               invalidType:
 *                 value:
 *                   error: "Missing or invalid type parameter"
 *               invalidBucket:
 *                 value:
 *                   error: "Invalid bucket"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             examples:
 *               missingAuth:
 *                 value:
 *                   error: "Missing or invalid authorization header"
 *               unauthorized:
 *                 value:
 *                   error: "Unauthorized"
 *       500:
 *         description: Internal server error - upload failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 *             example:
 *               error: "Upload failed"
 *               details: "Storage upload failed with status 500: Internal Server Error"
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const apiLogger = createApiLogger({
    endpoint: "/api/upload",
    method: "POST",
    requestId,
  });

  const contentLength = request.headers.get("content-length");
  const contentLengthMB = contentLength
    ? Math.round((parseInt(contentLength) / (1024 * 1024)) * 100) / 100
    : null;

  apiLogger.info(
    {
      contentType: request.headers.get("content-type"),
      contentLength: contentLength,
      contentLengthMB: contentLengthMB,
      userAgent: request.headers.get("user-agent"),
      requestSize: contentLength ? `${contentLength} bytes (${contentLengthMB} MB)` : "unknown",
      maxAllowedSizeMB: IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024),
    },
    "Upload request started - checking against size limits"
  );

  try {
    // Authenticate the request
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const user = authResult;

    apiLogger.info({ userId: user.id }, "User authenticated successfully");

    // Parse form data
    apiLogger.debug("Parsing form data");
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const entityId = formData.get("entityId") as string | null;

    // Check for multiple files (which might indicate bulk upload attempt)
    const allFiles = formData.getAll("file");
    const hasMultipleFiles = allFiles.length > 1;

    if (hasMultipleFiles) {
      const fileSizes = allFiles.map((f) => (f instanceof File ? f.size : 0));
      const totalSize = fileSizes.reduce((sum, size) => sum + size, 0);
      const totalSizeMB = Math.round((totalSize / (1024 * 1024)) * 100) / 100;

      apiLogger.warn(
        {
          multipleFileAttempt: true,
          fileCount: allFiles.length,
          fileSizes,
          totalSize,
          totalSizeMB,
          maxSingleFileSizeMB: IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024),
          userId: user.id,
          type,
          entityId,
        },
        "MULTIPLE FILE UPLOAD ATTEMPT - This endpoint only handles single files"
      );

      return NextResponse.json(
        {
          error: "Multiple files not supported",
          details:
            "This endpoint only accepts one file at a time. Please upload files individually.",
          fileCount: allFiles.length,
          totalSizeMB,
        },
        { status: 400 }
      );
    }

    // Map type to bucket name (using the 5 buckets from Supabase)
    const typeToBucketMap: Record<string, string> = {
      stable: "stableimages",
      box: "boximages", 
      service: "service-photos",
      horse: "horse",
      "part-loan-horse": "part-loan-horse",
      forum: "forum", // New forum bucket for forum images
      user: "stableimages", // fallback to stableimages bucket for user uploads
    };

    const bucket = type ? typeToBucketMap[type] : null;
    
    // Create organized folder structure: userId only (bucket already indicates type)
    const folder = user.id;

    // Log form data details for debugging
    const formDataEntries = Array.from(formData.entries()).map(([key, value]) => ({
      key,
      value:
        value instanceof File
          ? {
              name: value.name,
              size: value.size,
              type: value.type,
              lastModified: value.lastModified,
            }
          : value,
    }));

    apiLogger.debug(
      {
        formData: formDataEntries,
        type,
        entityId,
        mappedBucket: bucket,
      },
      "Form data parsed"
    );

    if (!file) {
      apiLogger.warn(
        {
          hasFile: false,
          formDataKeys: Array.from(formData.keys()),
        },
        "Missing required file parameter"
      );
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!type || !bucket) {
      apiLogger.warn(
        {
          type,
          bucket,
          validTypes: Object.keys(typeToBucketMap),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
        "Missing or invalid type parameter"
      );
      return NextResponse.json({ error: "Missing or invalid type parameter" }, { status: 400 });
    }

    // Validate bucket name (actual bucket names in Supabase)
    const allowedBuckets = ["stableimages", "boximages", "service-photos", "horse", "forum", "part-loan-horse"];
    if (!allowedBuckets.includes(bucket)) {
      apiLogger.warn(
        {
          bucket,
          allowedBuckets,
          fileName: file.name,
          fileSize: file.size,
        },
        "Invalid bucket name provided"
      );
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }
    console.log("BUCKET!!!!!");
    // Check file size against our application limit (5MB)
    const fileSizeMB = file.size / (1024 * 1024);
    const maxSizeMB = IMAGE_CONSTRAINTS.MAX_FILE_SIZE / (1024 * 1024);

    apiLogger.info(
      {
        bucket,
        fileName: file.name,
        fileSize: file.size,
        fileSizeMB: Math.round(fileSizeMB * 100) / 100, // Round to 2 decimal places
        maxAllowedSizeMB: maxSizeMB,
        fileType: file.type,
        folder,
        exceedsLimit: file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE,
      },
      "File validation passed, checking size constraints"
    );

    // Log size violation specifically for 403 error analysis
    if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
      apiLogger.warn(
        {
          fileName: file.name,
          fileSize: file.size,
          fileSizeMB: Math.round(fileSizeMB * 100) / 100,
          maxAllowedSize: IMAGE_CONSTRAINTS.MAX_FILE_SIZE,
          maxAllowedSizeMB: maxSizeMB,
          exceedsBy: file.size - IMAGE_CONSTRAINTS.MAX_FILE_SIZE,
          exceedsByMB: Math.round((fileSizeMB - maxSizeMB) * 100) / 100,
          bucket,
          folder,
          userId: user.id,
        },
        "FILE SIZE LIMIT VIOLATION - This may result in 403 error"
      );

      return NextResponse.json(
        {
          error: "File too large",
          details: `File size ${
            Math.round(fileSizeMB * 100) / 100
          }MB exceeds the ${maxSizeMB}MB limit`,
          maxSize: IMAGE_CONSTRAINTS.MAX_FILE_SIZE,
          actualSize: file.size,
        },
        { status: 413 }
      ); // 413 Payload Too Large
    }

    // Check file type against allowed types
    if (
      !IMAGE_CONSTRAINTS.ALLOWED_TYPES.includes(
        file.type as (typeof IMAGE_CONSTRAINTS.ALLOWED_TYPES)[number]
      )
    ) {
      apiLogger.warn(
        {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          allowedTypes: IMAGE_CONSTRAINTS.ALLOWED_TYPES,
          bucket,
          folder,
          userId: user.id,
        },
        "INVALID FILE TYPE - This may result in rejection"
      );

      return NextResponse.json(
        {
          error: "Invalid file type",
          details: `File type ${file.type} is not allowed`,
          allowedTypes: IMAGE_CONSTRAINTS.ALLOWED_TYPES,
        },
        { status: 400 }
      );
    }

    apiLogger.info(
      {
        bucket,
        fileName: file.name,
        fileSize: file.size,
        fileSizeMB: Math.round(fileSizeMB * 100) / 100,
        fileType: file.type,
        folder,
        sizeCheckPassed: true,
        typeCheckPassed: true,
      },
      "All file validation passed, starting upload process"
    );

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    apiLogger.debug(
      {
        originalFileName: file.name,
        generatedFileName: fileName,
        filePath,
        fileExtension,
      },
      "Generated unique filename"
    );

    // Convert file to buffer for upload (skip compression for now)
    apiLogger.debug("Converting file to buffer");
    const fileBuffer = await file.arrayBuffer();
    apiLogger.debug({ bufferSize: fileBuffer.byteLength }, "File converted to buffer");

    // Upload directly to Supabase Storage via HTTP API
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;
    apiLogger.info({ uploadUrl, filePath }, "Starting Supabase storage upload");

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

      // Enhanced logging specifically for 403 and other errors
      const logData = {
        uploadStatus: uploadResponse.status,
        uploadStatusText: uploadResponse.statusText,
        uploadError: errorText,
        uploadUrl,
        filePath,
        fileName: file.name,
        fileSize: file.size,
        fileSizeMB: Math.round((file.size / (1024 * 1024)) * 100) / 100,
        fileType: file.type,
        bucket,
        folder,
        userId: user.id,
        supabaseUrl: SUPABASE_URL,
        timestamp: new Date().toISOString(),
      };

      if (uploadResponse.status === 403) {
        apiLogger.error(
          {
            ...logData,
            errorType: "PERMISSION_DENIED",
          },
          "403 FORBIDDEN ERROR - Supabase storage upload failed with permission denied"
        );
      } else if (uploadResponse.status === 413) {
        apiLogger.error(
          {
            ...logData,
            errorType: "PAYLOAD_TOO_LARGE",
          },
          "413 PAYLOAD TOO LARGE - File size exceeds Supabase storage limits"
        );
      } else if (uploadResponse.status === 400) {
        apiLogger.error(
          {
            ...logData,
            errorType: "BAD_REQUEST",
          },
          "400 BAD REQUEST - Invalid upload request to Supabase storage"
        );
      } else {
        apiLogger.error(
          {
            ...logData,
            errorType: "UNKNOWN_UPLOAD_ERROR",
          },
          `${uploadResponse.status} ${uploadResponse.statusText} - Supabase storage upload failed`
        );
      }

      // Return appropriate error response based on status
      const statusCode =
        uploadResponse.status === 403 ? 403 : uploadResponse.status === 413 ? 413 : 500;

      return NextResponse.json(
        {
          error: "Upload failed",
          details: `Storage upload failed with status ${uploadResponse.status}: ${uploadResponse.statusText}`,
          statusCode: uploadResponse.status,
          timestamp: new Date().toISOString(),
        },
        { status: statusCode }
      );
    }

    // Build public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;

    apiLogger.info(
      {
        publicUrl,
        filePath,
        uploadSuccess: true,
        fileName: file.name,
        fileSize: file.size,
        fileSizeMB: Math.round((file.size / (1024 * 1024)) * 100) / 100,
        fileType: file.type,
        bucket,
        folder,
        userId: user.id,
        processingTimeMs: Date.now() - timestamp,
        uploadComplete: true,
      },
      "File upload completed successfully"
    );

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    apiLogger.error(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        requestId,
      },
      "Unexpected error in upload endpoint"
    );

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
