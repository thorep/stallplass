import { NextResponse } from 'next/server'
import { getApiDocs } from '@/lib/swagger'
// Removed unused PostHog import
import { captureApiError } from '@/lib/posthog-capture'

/**
 * @swagger
 * /api/openapi:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the complete OpenAPI 3.0 specification for the Stallplass API in JSON format
 *     tags:
 *       - Documentation
 *     security: []
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Complete OpenAPI 3.0 specification
 */
export async function GET() {
  // In production, you should protect this endpoint
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'OpenAPI specification not available in production' },
      { status: 404 }
    )
  }

  try {
    const spec = await getApiDocs()
    
    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    try { captureApiError({ error, context: 'openapi_get', route: '/api/openapi', method: 'GET' }); } catch {}
    return NextResponse.json(
      { error: 'Failed to generate OpenAPI specification' },
      { status: 500 }
    )
  }
}
