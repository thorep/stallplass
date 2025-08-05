import { getApiDocs } from "@/lib/swagger"
import ReactSwagger from "./react-swagger"
import { requireAuth } from '@/lib/server-auth'
import { notFound } from 'next/navigation'

export default async function ApiDocsPage() {
  // Not available in production
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  
  // Require authentication to view API docs
  await requireAuth()
  
  const spec = await getApiDocs()
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-h1 font-bold mb-4">Stallplass API Documentation</h1>
        <div className="space-y-2 text-body text-muted-foreground">
          <p>
            Interactive documentation for the Stallplass marketplace API. 
            All endpoints require authentication unless marked as public.
          </p>
          <p>
            <strong>Authentication:</strong> Use Bearer token from Supabase Auth. 
            Your current session token is automatically included in requests.
          </p>
          <p>
            <strong>Base URL:</strong> {process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
          </p>
          <p>
            <strong>OpenAPI Spec:</strong>{" "}
            <a 
              href="/api/openapi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 underline"
            >
              /api/openapi
            </a>{" "}
            (JSON format for tools like Postman, Insomnia, etc.)
          </p>
        </div>
      </div>
      <ReactSwagger spec={spec as Record<string, unknown>} />
    </div>
  )
}