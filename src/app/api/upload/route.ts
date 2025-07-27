import { NextRequest, NextResponse } from 'next/server';
import imageCompression from 'browser-image-compression';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header (user token from frontend)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const userToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify user token with Supabase Auth API
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    });

    if (!authResponse.ok) {
      console.error('Auth verification failed:', authResponse.status);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await authResponse.json();
    console.log('Authenticated user:', user.id);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const folder = formData.get('folder') as string | null;

    if (!file || !bucket) {
      return NextResponse.json({ error: 'Missing file or bucket' }, { status: 400 });
    }

    // Validate bucket name
    const allowedBuckets = ['stableimages', 'boximages', 'service-photos'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Convert file to buffer for upload (skip compression for now)
    const fileBuffer = await file.arrayBuffer();

    // Upload directly to Supabase Storage via HTTP API
    const uploadResponse = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': file.type,
        'Cache-Control': '3600',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Storage upload failed:', uploadResponse.status, errorText);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Build public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;

    return NextResponse.json({
      url: publicUrl,
      path: filePath
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}