// Helper functions for filter tests

export const filterHelpers = {
  // Select a location filter
  selectLocation: (fylke: string, kommune?: string) => {
    cy.get('select').first().select(fylke);
    
    if (kommune) {
      // Wait for kommune dropdown to appear
      cy.contains('Kommune').should('be.visible');
      cy.get('select').eq(1).select(kommune);
    }
  },

  // Set price range using slider
  setPriceRange: (minSteps: number, maxSteps: number) => {
    // Move minimum price slider
    if (minSteps > 0) {
      cy.get('[role="slider"]').first().click().type('{rightarrow}'.repeat(minSteps));
    }
    
    // Move maximum price slider
    if (maxSteps > 0) {
      cy.get('[role="slider"]').last().click().type('{leftarrow}'.repeat(maxSteps));
    }
  },

  // Select amenities by name
  selectAmenities: (amenityNames: string[]) => {
    amenityNames.forEach(name => {
      cy.contains('button', name).click();
    });
  },

  // Clear all filters
  clearAllFilters: () => {
    cy.contains('button', 'Nullstill filtre').click();
  },

  // Switch search mode
  switchToMode: (mode: 'boxes' | 'stables') => {
    const buttonText = mode === 'boxes' ? 'Bokser' : 'Staller';
    cy.contains('button', buttonText).click();
  },

  // Verify filter is applied in URL
  verifyFilterInUrl: (filterName: string, value?: string) => {
    if (value) {
      cy.url().should('include', `${filterName}=${value}`);
    } else {
      cy.url().should('include', filterName);
    }
  },

  // Verify active filter count
  verifyActiveFilterCount: (count: number) => {
    if (count > 0) {
      cy.get('span').contains(count.toString()).should('be.visible');
    } else {
      // No badge should be shown when count is 0
      cy.get('span').contains(/^\d+$/).should('not.exist');
    }
  },

  // Wait for search results to load
  waitForSearchResults: () => {
    cy.intercept('GET', '/api/search?*').as('searchRequest');
    cy.wait('@searchRequest', { timeout: 10000 });
  },

  // Verify pill selection state
  verifyPillSelected: (pillText: string, isSelected: boolean, mode: 'boxes' | 'stables' = 'stables') => {
    const borderClass = mode === 'boxes' ? 'border-emerald-500' : 'border-blue-500';
    
    if (isSelected) {
      cy.contains('button', pillText).should('have.class', borderClass);
    } else {
      cy.contains('button', pillText).should('not.have.class', borderClass);
    }
  },

  // Set box-specific filters
  setBoxFilters: {
    occupancyStatus: (status: 'available' | 'occupied' | 'all') => {
      const labelMap = {
        available: 'Kun ledige bokser',
        occupied: 'Kun opptatte bokser',
        all: 'Alle bokser'
      };
      cy.contains('Beleggsstatus').parent().find('select').select(labelMap[status]);
    },
    
    boxSize: (size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'any') => {
      const labelMap = {
        SMALL: 'Liten',
        MEDIUM: 'Middels',
        LARGE: 'Stor',
        any: 'Alle størrelser'
      };
      cy.contains('Boks størrelse').parent().find('select').select(labelMap[size]);
    },
    
    boxType: (type: 'boks' | 'utegang' | 'any') => {
      const labelMap = {
        boks: 'Boks',
        utegang: 'Utegang',
        any: 'Alle typer'
      };
      cy.contains('Boks type').parent().find('select').select(labelMap[type]);
    },
    
    horseSize: (size: 'pony' | 'small' | 'medium' | 'large' | 'any') => {
      const labelMap = {
        pony: 'Ponni',
        small: 'Liten hest',
        medium: 'Middels hest',
        large: 'Stor hest',
        any: 'Alle størrelser'
      };
      cy.contains('Hestestørrelse').parent().find('select').select(labelMap[size]);
    }
  },

  // Verify search results
  verifySearchResults: {
    hasResults: () => {
      cy.get('[data-cy="search-results"]').should('exist');
      cy.get('[data-cy="stable-card"], [data-cy="box-card"]').should('have.length.greaterThan', 0);
    },
    
    noResults: () => {
      cy.contains(/Ingen (staller|bokser) funnet|Feil ved lasting/).should('be.visible');
    },
    
    resultsContain: (text: string) => {
      cy.get('[data-cy="search-results"]').should('contain', text);
    }
  }
};