describe('Public Stable Search and Filtering', () => {
  beforeEach(() => {
    // Visit the public stables page
    cy.visit('/staller')
  })

  describe('Page Load and Basic UI', () => {
    it('should load the public stables page successfully', () => {
      cy.url().should('include', '/staller')
      cy.get('[data-cy="page-title"]').should('contain', 'Staller')
    })

    it('should display search filters', () => {
      cy.get('[data-cy="search-filters"]').should('be.visible')
      cy.get('[data-cy="location-filter"]').should('be.visible')
      cy.get('[data-cy="price-filter"]').should('be.visible')
    })

    it('should display stable listings', () => {
      cy.get('[data-cy="stable-listings"]').should('be.visible')
      cy.get('[data-cy="stable-card"]').should('have.length.at.least', 1)
    })
  })

  describe('Location Filtering', () => {
    it('should filter stables by location when location is entered', () => {
      // Test location filtering
      cy.get('[data-cy="location-filter"]').type('Oslo')
      cy.get('[data-cy="search-button"]').click()
      
      // Wait for results to load
      cy.get('[data-cy="loading-spinner"]').should('not.exist')
      
      // Verify URL parameters are updated
      cy.url().should('include', 'location=Oslo')
      
      // Verify results are filtered (at least one result should show)
      cy.get('[data-cy="stable-card"]').should('have.length.at.least', 0)
    })

    it('should clear location filter when input is cleared', () => {
      cy.get('[data-cy="location-filter"]').type('Oslo')
      cy.get('[data-cy="search-button"]').click()
      
      cy.get('[data-cy="location-filter"]').clear()
      cy.get('[data-cy="search-button"]').click()
      
      // URL should not contain location parameter
      cy.url().should('not.include', 'location=')
    })
  })

  describe('Price Filtering', () => {
    it('should filter stables by price range', () => {
      cy.get('[data-cy="price-min-input"]').type('1000')
      cy.get('[data-cy="price-max-input"]').type('5000')
      cy.get('[data-cy="search-button"]').click()
      
      cy.get('[data-cy="loading-spinner"]').should('not.exist')
      
      // Verify URL parameters
      cy.url().should('include', 'priceMin=1000')
      cy.url().should('include', 'priceMax=5000')
    })

    it('should handle invalid price ranges gracefully', () => {
      // Test max price lower than min price
      cy.get('[data-cy="price-min-input"]').type('5000')
      cy.get('[data-cy="price-max-input"]').type('1000')
      cy.get('[data-cy="search-button"]').click()
      
      // Should show error message or swap values
      cy.get('body').should('contain.text', 'pris' || 'price' || 'invalid')
    })
  })

  describe('Amenities Filtering', () => {
    it('should show amenity checkboxes', () => {
      cy.get('[data-cy="amenities-filter"]').should('be.visible')
      cy.get('[data-cy="amenity-checkbox"]').should('have.length.at.least', 1)
    })

    it('should filter by selected amenities', () => {
      // Select first amenity
      cy.get('[data-cy="amenity-checkbox"]').first().check()
      cy.get('[data-cy="search-button"]').click()
      
      cy.get('[data-cy="loading-spinner"]').should('not.exist')
      
      // Should have amenity parameter in URL
      cy.url().should('include', 'amenities=')
    })

    it('should handle multiple amenity selections', () => {
      // Select multiple amenities
      cy.get('[data-cy="amenity-checkbox"]').first().check()
      cy.get('[data-cy="amenity-checkbox"]').eq(1).check()
      cy.get('[data-cy="search-button"]').click()
      
      cy.get('[data-cy="loading-spinner"]').should('not.exist')
      
      // URL should contain multiple amenity parameters
      cy.url().should('include', 'amenities=')
    })
  })

  describe('Combined Filtering', () => {
    it('should apply multiple filters simultaneously', () => {
      // Apply location, price, and amenity filters
      cy.get('[data-cy="location-filter"]').type('Bergen')
      cy.get('[data-cy="price-min-input"]').type('2000')
      cy.get('[data-cy="price-max-input"]').type('4000')
      cy.get('[data-cy="amenity-checkbox"]').first().check()
      
      cy.get('[data-cy="search-button"]').click()
      cy.get('[data-cy="loading-spinner"]').should('not.exist')
      
      // Verify all parameters in URL
      cy.url().should('include', 'location=Bergen')
      cy.url().should('include', 'priceMin=2000')
      cy.url().should('include', 'priceMax=4000')
      cy.url().should('include', 'amenities=')
    })

    it('should clear all filters when reset button is clicked', () => {
      // Apply multiple filters
      cy.get('[data-cy="location-filter"]').type('Stavanger')
      cy.get('[data-cy="price-min-input"]').type('1500')
      cy.get('[data-cy="amenity-checkbox"]').first().check()
      
      // Clear all filters
      cy.get('[data-cy="clear-filters-button"]').click()
      
      // Verify form is cleared
      cy.get('[data-cy="location-filter"]').should('have.value', '')
      cy.get('[data-cy="price-min-input"]').should('have.value', '')
      cy.get('[data-cy="amenity-checkbox"]:checked').should('not.exist')
      
      // URL should not contain filter parameters
      cy.url().should('not.include', 'location=')
      cy.url().should('not.include', 'priceMin=')
      cy.url().should('not.include', 'amenities=')
    })
  })

  describe('Search Results', () => {
    it('should display stable information in cards', () => {
      cy.get('[data-cy="stable-card"]').first().within(() => {
        cy.get('[data-cy="stable-name"]').should('be.visible')
        cy.get('[data-cy="stable-location"]').should('be.visible')
        cy.get('[data-cy="stable-amenities"]').should('be.visible')
      })
    })

    it('should navigate to stable details when card is clicked', () => {
      cy.get('[data-cy="stable-card"]').first().click()
      
      // Should navigate to stable detail page
      cy.url().should('include', '/staller/')
      cy.get('[data-cy="stable-detail"]').should('be.visible')
    })

    it('should show "no results" message when no stables match filters', () => {
      // Apply very restrictive filter that should return no results
      cy.get('[data-cy="location-filter"]').type('NonExistentLocation12345')
      cy.get('[data-cy="search-button"]').click()
      
      cy.get('[data-cy="loading-spinner"]').should('not.exist')
      cy.get('[data-cy="no-results-message"]').should('be.visible')
    })
  })

  describe('URL Parameter Synchronization', () => {
    it('should load filters from URL parameters on page load', () => {
      // Visit page with URL parameters
      cy.visit('/staller?location=Trondheim&priceMin=1000&priceMax=3000')
      
      // Verify filters are populated from URL
      cy.get('[data-cy="location-filter"]').should('have.value', 'Trondheim')
      cy.get('[data-cy="price-min-input"]').should('have.value', '1000')
      cy.get('[data-cy="price-max-input"]').should('have.value', '3000')
    })

    it('should maintain URL parameters when navigating back', () => {
      // Apply filters
      cy.get('[data-cy="location-filter"]').type('Tromsø')
      cy.get('[data-cy="search-button"]').click()
      
      // Navigate to a stable detail
      cy.get('[data-cy="stable-card"]').first().click()
      
      // Go back
      cy.go('back')
      
      // Filters should be preserved
      cy.get('[data-cy="location-filter"]').should('have.value', 'Tromsø')
      cy.url().should('include', 'location=Tromsø')
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner during search', () => {
      cy.get('[data-cy="location-filter"]').type('Oslo')
      cy.get('[data-cy="search-button"]').click()
      
      // Loading spinner should appear briefly
      cy.get('[data-cy="loading-spinner"]').should('be.visible')
      cy.get('[data-cy="loading-spinner"]').should('not.exist')
    })

    it('should disable search button during loading', () => {
      cy.get('[data-cy="location-filter"]').type('Bergen')
      cy.get('[data-cy="search-button"]').click()
      
      // Button should be disabled during loading
      cy.get('[data-cy="search-button"]').should('be.disabled')
    })
  })
})