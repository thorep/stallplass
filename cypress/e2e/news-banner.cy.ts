describe('NewsBanner Component', () => {
  beforeEach(() => {
    // Intercept PostHog API calls to prevent real network requests
    cy.intercept('POST', '**/decide/**', (req) => {
      req.reply({
        flags: {
          banner: {
            tittel: 'Test Banner',
            innhold: 'This is a test banner content'
          }
        }
      });
    }).as('posthogDecide');

    // Mock PostHog client-side methods
    cy.window().then((win) => {
      (win as any).posthog = {
        getFeatureFlagPayload: cy.stub().returns({
          tittel: 'Test Banner',
          innhold: 'This is a test banner content'
        }),
        onFeatureFlags: cy.stub().callsFake((callback: () => void) => {
          // Simulate feature flag change
          setTimeout(() => callback(), 100);
        }),
        capture: cy.stub(),
      };
    });

    // Clear localStorage to ensure banner shows
    cy.clearLocalStorage();
  });

  it('should display the banner when feature flag is enabled', () => {
    cy.visit('/'); // Adjust to the page where NewsBanner is rendered

    // Wait for PostHog API call
    cy.wait('@posthogDecide');

    // Wait for banner to appear
    cy.get('[data-cy="site-banner"]', { timeout: 10000 }).should('be.visible');

    // Check banner content
    cy.get('[data-cy="site-banner-title"]').should('contain', 'Test Banner:');
    cy.get('[data-cy="site-banner-content"]').should('contain', 'This is a test banner content');
  });

  it('should hide the banner when close button is clicked', () => {
    cy.visit('/');

    cy.get('[data-cy="site-banner"]').should('be.visible');

    // Click the close button
    cy.get('[data-cy="site-banner-close"]').click();

    // Banner should disappear
    cy.get('[data-cy="site-banner"]').should('not.exist');

    // Check that dismissal is stored in localStorage
    cy.window().then((win) => {
      const dismissed = win.localStorage.getItem('dismissed-news-banner');
      expect(dismissed).to.not.be.null;
      const parsed = JSON.parse(dismissed!);
      expect(parsed.tittel).to.equal('Test Banner');
    });
  });

  it('should not show banner if previously dismissed', () => {
    // Pre-set localStorage to simulate previous dismissal
    cy.window().then((win) => {
      win.localStorage.setItem('dismissed-news-banner', JSON.stringify({
        tittel: 'Test Banner',
        innhold: 'This is a test banner content'
      }));
    });

    cy.visit('/');

    // Banner should not appear
    cy.get('[data-cy="site-banner"]').should('not.exist');
  });

  it('should track banner dismissal in PostHog', () => {
    cy.visit('/');

    cy.get('[data-cy="site-banner-close"]').click();

    // Verify PostHog capture was called
    cy.window().then((win) => {
      expect((win as any).posthog.capture).to.have.been.calledWith('news_banner_dismissed', {
        banner_title: 'Test Banner',
        banner_content: 'This is a test banner content'
      });
    });
  });

  it('should handle feature flag changes', () => {
    // Start with no banner
    cy.window().then((win) => {
      (win as any).posthog.getFeatureFlagPayload = cy.stub().returns(null);
    });

    cy.visit('/');
    cy.get('[data-cy="site-banner"]').should('not.exist');

    // Simulate feature flag update
    cy.window().then((win) => {
      (win as any).posthog.getFeatureFlagPayload = cy.stub().returns({
        tittel: 'Updated Banner',
        innhold: 'Updated content'
      });
      // Trigger the onFeatureFlags callback
      (win as any).posthog.onFeatureFlags(() => {});
    });

    // Banner should appear with new content
    cy.get('[data-cy="site-banner"]').should('be.visible');
    cy.get('[data-cy="site-banner-title"]').should('contain', 'Updated Banner:');
  });
});