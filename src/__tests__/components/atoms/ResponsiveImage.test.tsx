import { render, screen } from '@testing-library/react'
import ResponsiveImage from '@/components/atoms/ResponsiveImage'

describe('ResponsiveImage Component', () => {
  it('renders with alt text when src provided', () => {
    render(<ResponsiveImage src="/test-image.jpg" alt="Test image" />)
    expect(screen.getByAltText('Test image')).toBeInTheDocument()
  })

  it('renders fallback when no src provided', () => {
    render(<ResponsiveImage alt="Test image" />)
    // Should show fallback text "Ingen bilde" 
    expect(screen.getByText('Ingen bilde')).toBeInTheDocument()
  })

  it('renders without aspect ratio container when disabled', () => {
    render(<ResponsiveImage alt="Test image" showAspectRatioContainer={false} />)
    expect(screen.getByText('Ingen bilde')).toBeInTheDocument()
  })
})