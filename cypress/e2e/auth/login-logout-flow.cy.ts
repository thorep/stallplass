describe('Authentication Flow', () => {
  const testUser = {
    email: 'user1@test.com',
    password: 'test123'
  }

  beforeEach(() => {
    // Clear any existing sessions
    cy.clearAllSessionStorage()
    cy.clearAllLocalStorage()
    cy.clearAllCookies()
  })

  describe('Login Flow', () => {
    it('should redirect unauthenticated users to login when accessing dashboard', () => {
      cy.visit('/dashboard')
      cy.url().should('include', '/logg-inn')
      cy.url().should('include', 'returnUrl=%2Fdashboard')
    })

    it('should redirect unauthenticated users to login when accessing protected pages', () => {
      // Test different protected routes
      const protectedRoutes = ['/dashboard', '/profil', '/meldinger', '/forslag']
      
      protectedRoutes.forEach(route => {
        cy.visit(route)
        cy.url().should('include', '/logg-inn')
        cy.url().should('include', `returnUrl=${encodeURIComponent(route)}`)
      })
    })

    it('should show login form elements', () => {
      cy.visit('/logg-inn')
      
      // Check all form elements are present
      cy.get('[data-cy="email-input"]').should('be.visible')
      cy.get('[data-cy="password-input"]').should('be.visible')
      cy.get('[data-cy="login-button"]').should('be.visible')
      
      // Check form labels
      cy.contains('E-postadresse').should('be.visible')
      cy.contains('Passord').should('be.visible')
      cy.contains('Logg inn').should('be.visible')
    })

    it('should show error for invalid credentials', () => {
      cy.visit('/logg-inn')
      
      cy.get('[data-cy="email-input"]').type('invalid@email.com')
      cy.get('[data-cy="password-input"]').type('wrongpassword')
      cy.get('[data-cy="login-button"]').click()
      
      // Should stay on login page and show error
      cy.url().should('include', '/logg-inn')
      cy.url().should('include', 'error=')
    })

    it('should successfully login with valid credentials', () => {
      cy.visit('/logg-inn')
      
      cy.get('[data-cy="email-input"]').type(testUser.email)
      cy.get('[data-cy="password-input"]').type(testUser.password)
      cy.get('[data-cy="login-button"]').click()
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.url().should('not.include', '/logg-inn')
    })

    it('should redirect to original destination after login', () => {
      // Try to access profile page without auth
      cy.visit('/profil')
      cy.url().should('include', '/logg-inn')
      cy.url().should('include', 'returnUrl=%2Fprofil')
      
      // Login
      cy.get('[data-cy="email-input"]').type(testUser.email)
      cy.get('[data-cy="password-input"]').type(testUser.password)
      cy.get('[data-cy="login-button"]').click()
      
      // Should redirect to original destination (profile page)
      cy.url().should('include', '/profil')
      cy.url().should('not.include', '/logg-inn')
    })

    it('should redirect authenticated users away from login page', () => {
      // First login
      cy.login(testUser.email, testUser.password)
      
      // Try to visit login page when already authenticated
      cy.visit('/logg-inn')
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard')
      cy.url().should('not.include', '/logg-inn')
    })
  })

  describe('Header Authentication State', () => {
    it('should show "Logg inn" button when not authenticated', () => {
      cy.visit('/')
      
      // Should show login button in header
      cy.contains('Logg inn').should('be.visible')
      cy.contains('Registrer').should('be.visible')
    })

    it('should show user info when authenticated', () => {
      // Login first
      cy.login(testUser.email, testUser.password)
      cy.visit('/')
      
      // Header should update to show authenticated state
      // Should show logout button instead of login
      cy.contains('Logg ut').should('be.visible')
      cy.contains('Logg inn').should('not.exist')
    })
  })

  describe('Logout Flow', () => {
    beforeEach(() => {
      // Login before each logout test
      cy.login(testUser.email, testUser.password)
    })

    it('should logout and redirect to home page', () => {
      cy.visit('/dashboard')
      
      // Find and click logout button
      cy.contains('Logg ut').click()
      
      // Should redirect to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      
      // Header should show login button again
      cy.contains('Logg inn').should('be.visible')
    })

    it('should prevent access to protected pages after logout', () => {
      cy.visit('/dashboard')
      
      // Logout
      cy.contains('Logg ut').click()
      
      // Try to access dashboard again
      cy.visit('/dashboard')
      
      // Should redirect to login
      cy.url().should('include', '/logg-inn')
    })

    it('should clear authentication state on logout', () => {
      cy.visit('/dashboard')
      
      // Verify we're logged in
      cy.url().should('include', '/dashboard')
      
      // Logout
      cy.contains('Logg ut').click()
      
      // Should be redirected to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      
      // Try to access protected page - should be redirected to login
      cy.visit('/dashboard')
      cy.url().should('include', '/logg-inn')
    })
  })

  describe('Session Persistence', () => {
    it('should maintain login state across page refreshes', () => {
      // Login
      cy.login(testUser.email, testUser.password)
      cy.visit('/dashboard')
      
      // Refresh the page
      cy.reload()
      
      // Should still be on dashboard and authenticated
      cy.url().should('include', '/dashboard')
      cy.contains('Logg ut').should('be.visible')
    })

    it('should maintain login state across different pages', () => {
      // Login
      cy.login(testUser.email, testUser.password)
      cy.visit('/dashboard')
      
      // Visit different protected pages
      cy.visit('/profil')
      cy.url().should('include', '/profil')
      
      cy.visit('/meldinger')
      cy.url().should('include', '/meldinger')
      
      // Should stay authenticated
      cy.contains('Logg ut').should('be.visible')
    })
  })

  describe('Route Protection', () => {
    const protectedRoutes = [
      '/dashboard',
      '/profil', 
      '/meldinger',
      '/forslag'
    ]

    it('should protect all designated routes', () => {
      protectedRoutes.forEach(route => {
        cy.visit(route)
        cy.url().should('include', '/logg-inn')
        cy.url().should('include', `returnUrl=${encodeURIComponent(route)}`)
      })
    })

    it('should allow access to protected routes when authenticated', () => {
      cy.login(testUser.email, testUser.password)
      
      protectedRoutes.forEach(route => {
        cy.visit(route)
        cy.url().should('include', route)
        cy.url().should('not.include', '/logg-inn')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // Intercept auth requests and simulate network error
      cy.intercept('POST', '**/auth/v1/token**', { forceNetworkError: true }).as('authError')
      
      cy.visit('/logg-inn')
      cy.get('[data-cy="email-input"]').type(testUser.email)
      cy.get('[data-cy="password-input"]').type(testUser.password)
      cy.get('[data-cy="login-button"]').click()
      
      // Should handle error gracefully (stay on login page or show error message)
      cy.url().should('include', '/logg-inn')
    })

    it('should handle malformed responses', () => {
      // Intercept auth requests and return malformed response
      cy.intercept('POST', '**/auth/v1/token**', { statusCode: 500, body: 'Internal Server Error' }).as('serverError')
      
      cy.visit('/logg-inn')
      cy.get('[data-cy="email-input"]').type(testUser.email)
      cy.get('[data-cy="password-input"]').type(testUser.password)
      cy.get('[data-cy="login-button"]').click()
      
      // Should handle error gracefully
      cy.url().should('include', '/logg-inn')
    })
  })
})