'use client'

import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

type Props = {
  spec: Record<string, unknown>
}

function ReactSwagger({ spec }: Props) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const getToken = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        setToken(session.access_token)
      }
    }
    getToken()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          setToken(session.access_token)
        } else {
          setToken(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const requestInterceptor = (req: Record<string, unknown>) => {
    if (token && req.headers && typeof req.headers === 'object') {
      (req.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }
    return req
  }

  return (
    <div className="swagger-ui-container">
      <SwaggerUI 
        spec={spec}
        requestInterceptor={requestInterceptor}
        persistAuthorization={true}
        tryItOutEnabled={true}
        displayRequestDuration={true}
        defaultModelsExpandDepth={2}
        defaultModelExpandDepth={2}
        docExpansion="list"
        filter={true}
        showCommonExtensions={true}
        showExtensions={true}
      />
    </div>
  )
}

export default ReactSwagger