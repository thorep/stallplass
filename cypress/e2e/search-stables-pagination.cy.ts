function selectStablesMode() {
  const desktopSelector = '[data-cy="mode-stables"]';
  const mobileSelector = '[data-cy="mode-mobile-stables"]';

  cy.get('body').then(($body) => {
    if ($body.find(desktopSelector).length) {
      cy.get(desktopSelector).scrollIntoView().click({ force: true });
    } else {
      cy.get(mobileSelector, { timeout: 20000 }).should('be.visible').click();
    }
  });

  // Verify mode switched; if not, fallback to direct URL navigation
  cy.location('search', { timeout: 10000 }).then((search) => {
    if (!search.includes('mode=stables')) {
      cy.visit('/sok?mode=stables');
    }
  });
}

function definePaginationTests(label: string) {
  describe(`Search stables pagination${label}`, () => {
    it('navigates next and previous pages', () => {
      cy.visit('/sok');

      selectStablesMode();

      // Ensure pagination visible; scroll into view if necessary
      cy.get('[data-cy="pagination"]', { timeout: 30000 })
        .scrollIntoView()
        .should('be.visible');

      // Ensure we actually have results listed
      cy.get('[data-cy="search-results"]').within(() => {
        cy.get('[data-cy="search-result-stable"]').its('length').should('be.gte', 1);
      });

      // Next → page=2
      cy.get('[data-cy="pagination-next"]').should('not.be.disabled').click();
      cy.url().should('include', 'page=2');

      // Still have results on page 2
      cy.get('[data-cy="search-results"]').within(() => {
        cy.get('[data-cy="search-result-stable"]').its('length').should('be.gte', 1);
      });

      // Prev → back to first page (no page param)
      cy.get('[data-cy="pagination-prev"]').should('not.be.disabled').click();
      cy.url().should('not.include', 'page=');

      // Results exist again on page 1
      cy.get('[data-cy="search-results"]').within(() => {
        cy.get('[data-cy="search-result-stable"]').its('length').should('be.gte', 1);
      });

      // Jump directly to page 2 via number button if present
      cy.get('body').then(($b) => {
        const hasPage2 = $b.find('[data-cy="pagination-page-2"]').length > 0;
        if (hasPage2) {
          cy.get('[data-cy="pagination-page-2"]').click();
          cy.url().should('include', 'page=2');
        }
      });
    });
  });
}

const runs: Array<{ label: string; setup: () => void }> = [
  { label: ' [mobile iPhone12]', setup: () => { /* default viewport via config */ } },
  { label: ' [desktop 1280x900]', setup: () => cy.viewport(1280, 900) },
];

runs.forEach(({ label, setup }) => {
  context(label, () => {
    beforeEach(() => setup());
    definePaginationTests(label);
  });
});
