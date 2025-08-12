'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useId } from 'react'

export type HeroVariant = 'photo' | 'texture' | 'neutral'

interface HeroBannerProps {
  title: string
  subtitle?: string
  placeholder?: string
  ctaLabel?: string
  onSearch?: (query: string) => void
  stats?: Array<{ label: string }>
  imageSrc?: string
  imageAlt?: string
  variant?: HeroVariant
  className?: string
  /** When true, renders search inline form; otherwise consumer can slot children */
  withSearch?: boolean
  children?: React.ReactNode
}

export function HeroBanner({
  title,
  subtitle,
  placeholder = 'Søk etter stallplass…',
  ctaLabel = 'Søk',
  onSearch,
  stats = [
    { label: 'Over 500 stables' },
    { label: 'Trygg betaling' },
    { label: 'Gratis å bruke' },
  ],
  imageSrc,
  imageAlt = '',
  variant,
  className,
  withSearch = true,
  children,
}: HeroBannerProps) {
  const id = useId()
  const mode: HeroVariant = variant ?? (imageSrc ? 'photo' : 'texture')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!onSearch) return
    const formData = new FormData(e.currentTarget)
    const query = String(formData.get('q') || '')
    onSearch(query)
  }

  return (
    <section
      className={cn(
        'relative w-full isolate flex items-center justify-center text-center px-4 py-20 sm:py-28 md:py-36',
        mode === 'photo' && 'h-[420px] sm:h-[480px] md:h-[560px]',
        mode === 'texture' && 'bg-primary/10',
        mode === 'neutral' && 'bg-gray-50 text-gray-900',
        className,
      )}
      aria-labelledby={`hero-title-${id}`}
    >
      {mode === 'photo' && imageSrc && (
        <>
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover pointer-events-none -z-10"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
          {/* overlay gradient for legibility */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{
              background:
                'linear-gradient(180deg, rgba(47,139,58,.75) 0%, rgba(47,139,58,.35) 40%, rgba(47,139,58,0) 100%)',
            }}
          />
        </>
      )}

      {mode === 'texture' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-primary/10" /* optional noise mask below */
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        <h1
          id={`hero-title-${id}`}
          className={cn(
            'font-bold tracking-tight text-4xl sm:text-5xl',
            mode === 'photo' ? 'text-white' : 'text-gray-900',
          )}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className={cn(
              'max-w-xl mx-auto text-base sm:text-lg',
              mode === 'photo' ? 'text-gray-50' : 'text-gray-600',
            )}
          >
            {subtitle}
          </p>
        )}

        {withSearch && (
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-md items-center gap-2"
          >
            <label htmlFor={`hero-search-${id}`} className="sr-only">
              {placeholder}
            </label>
            <input
              id={`hero-search-${id}`}
              name="q"
              type="text"
              placeholder={placeholder}
              className="flex-1 rounded-md border border-gray-300 bg-gray-0/90 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-white font-medium hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {ctaLabel}
            </button>
          </form>
        )}

        {children}

        {!!stats?.length && (
          <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm sm:text-base">
            {stats.map((s, i) => (
              <li key={i} className={cn(
                "inline-flex items-center gap-1 sm:gap-2",
                mode === 'photo' ? 'text-white' : 'text-gray-900'
              )}>
                <Check aria-hidden className="h-4 w-4 text-primary" />
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}