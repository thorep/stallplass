import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger } from '@/lib/logger';

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload files to Supabase Storage
 *     description: |
 *       Uploads files to Supabase Storage buckets. Supports uploading images for
 *       stables, boxes, services, and users. Files are stored in organized folders
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
 *                 enum: [stable, box, service, user]
 *                 description: Type of entity the file belongs to
 *               entityId:
 *                 type: string
 *                 description: ID of the entity (used for folder organization)
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
 *               url: "https://supabase.co/storage/v1/object/public/stableimages/stable123/1642680000000-abc123.jpg"
 *               path: "stable123/1642680000000-abc123.jpg"
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
    endpoint: '/api/upload',
    method: 'POST',
    requestId,
  });

  apiLogger.info({ 
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    userAgent: request.headers.get('user-agent')
  }, 'Upload request started');

  try {
    // Get the authorization header (user token from frontend)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      apiLogger.warn('Missing or invalid authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const userToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    apiLogger.debug('Verifying user token with Supabase Auth');

    // Verify user token with Supabase Auth API
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text().catch(() => 'Unknown auth error');
      apiLogger.warn({ 
        authStatus: authResponse.status,
        authError: errorText
      }, 'User authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await authResponse.json();
    apiLogger.info({ userId: user.id }, 'User authenticated successfully');

    // Parse form data
    apiLogger.debug('Parsing form data');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const entityId = formData.get('entityId') as string | null;
    
    // Map type to bucket name
    const typeToBucketMap: Record<string, string> = {
      'stable': 'stableimages',
      'box': 'boximages', 
      'service': 'service-photos',
      'user': 'stableimages' // fallback to stableimages for user uploads
    };
    
    const bucket = type ? typeToBucketMap[type] : null;
    const folder = entityId;

    // Log form data details for debugging
    const formDataEntries = Array.from(formData.entries()).map(([key, value]) => ({
      key,
      value: value instanceof File ? {
        name: value.name,
        size: value.size,
        type: value.type,
        lastModified: value.lastModified
      } : value
    }));

    apiLogger.debug({ 
      formData: formDataEntries,
      type,
      entityId,
      mappedBucket: bucket
    }, 'Form data parsed');

    if (!file) {
      apiLogger.warn({ 
        hasFile: false,
        formDataKeys: Array.from(formData.keys())
      }, 'Missing required file parameter');
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    if (!type || !bucket) {
      apiLogger.warn({ 
        type,
        bucket,
        validTypes: Object.keys(typeToBucketMap),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }, 'Missing or invalid type parameter');
      return NextResponse.json({ error: 'Missing or invalid type parameter' }, { status: 400 });
    }

    // Validate bucket name
    const allowedBuckets = ['stableimages', 'boximages', 'service-photos'];
    if (!allowedBuckets.includes(bucket)) {
      apiLogger.warn({ 
        bucket,
        allowedBuckets,
        fileName: file.name,
        fileSize: file.size
      }, 'Invalid bucket name provided');
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    apiLogger.info({ 
      bucket,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      folder
    }, 'File validation passed, starting upload process');

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    apiLogger.debug({ 
      originalFileName: file.name,
      generatedFileName: fileName,
      filePath,
      fileExtension
    }, 'Generated unique filename');

    // Convert file to buffer for upload (skip compression for now)
    apiLogger.debug('Converting file to buffer');
    const fileBuffer = await file.arrayBuffer();
    apiLogger.debug({ bufferSize: fileBuffer.byteLength }, 'File converted to buffer');

    // Upload directly to Supabase Storage via HTTP API
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;
    apiLogger.info({ uploadUrl, filePath }, 'Starting Supabase storage upload');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': file.type,
        'Cache-Control': '3600',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => 'Unknown upload error');
      apiLogger.error({ 
        uploadStatus: uploadResponse.status,
        uploadStatusText: uploadResponse.statusText,
        uploadError: errorText,
        uploadUrl,
        filePath,
        fileSize: file.size,
        fileType: file.type
      }, 'Supabase storage upload failed');
      return NextResponse.json({ 
        error: 'Upload failed',
        details: `Storage upload failed with status ${uploadResponse.status}: ${uploadResponse.statusText}`
      }, { status: 500 });
    }

    // Build public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;

    apiLogger.info({ 
      publicUrl,
      filePath,
      uploadSuccess: true
    }, 'File upload completed successfully');

    return NextResponse.json({
      url: publicUrl,
      path: filePath
    });

  } catch (error) {
    apiLogger.error({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestId
    }, 'Unexpected error in upload endpoint');
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}