'use client'

import { useEffect } from 'react'

export default function Analytics() {
  useEffect(() => {
    // Create and append the counter.dev script
    const script = document.createElement('script')
    script.src = 'https://cdn.counter.dev/script.js'
    script.setAttribute('data-id', '2f6b6146-e438-4e7d-9fb7-58d892c4b546')
    script.setAttribute('data-utcoffset', '2')
    script.async = true
    
    document.head.appendChild(script)
    
    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[src="https://cdn.counter.dev/script.js"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [])

  return null
}