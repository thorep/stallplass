function definePaginationTests(label: string, variant: "mobile" | "desktop") {
  describe(`Search stables pagination${label}`, () => {
    it("navigates next and previous pages", () => {
      cy.visit("/sok");

      if (variant === "desktop") {
        cy.get('[data-cy="mode-stables"]', { timeout: 20000 }).should("be.visible").click();
      } else {
        cy.get('[data-cy="mode-mobile-stables"]', { timeout: 20000 }).should("be.visible").click();
      }

      // Ensure URL reflects stables mode
      cy.location("search", { timeout: 10000 }).should("include", "mode=stables");

      // Ensure pagination visible; scroll into view if necessary
      cy.get('[data-cy="pagination"]', { timeout: 30000 }).scrollIntoView().should("be.visible");

      // Ensure we actually have results listed
      cy.get('[data-cy="search-results"]').within(() => {
        cy.get('[data-cy="search-result-stable"]').its("length").should("be.gte", 1);
      });

      // Next → page=2
      cy.get('[data-cy="pagination-next"]').should("not.be.disabled").click();
      cy.url().should("include", "page=2");

      // Still have results on page 2
      cy.get('[data-cy="search-results"]').within(() => {
        cy.get('[data-cy="search-result-stable"]').its("length").should("be.gte", 1);
      });

      // Prev → back to first page (no page param)
      cy.get('[data-cy="pagination-prev"]').should("not.be.disabled").click();
      cy.url({ timeout: 5000 }).should("include", "page=1");

      // Results exist again on page 1
      cy.get('[data-cy="search-results"]').within(() => {
        cy.get('[data-cy="search-result-stable"]').its("length").should("be.gte", 1);
      });

      // Jump directly to page 2 via number button if present
      cy.get("body").then(($b) => {
        const hasPage2 = $b.find('[data-cy="pagination-page-2"]').length > 0;
        if (hasPage2) {
          cy.get('[data-cy="pagination-page-2"]').click();
          cy.url().should("include", "page=2");
        }
      });
    });
  });
}

const runs: Array<{ label: string; setup: () => void; variant: "mobile" | "desktop" }> = [
  {
    label: " [mobile iPhone12]",
    setup: () => {
      /* default viewport via config */
    },
    variant: "mobile",
  },
  { label: " [desktop 1280x900]", setup: () => cy.viewport(1280, 900), variant: "desktop" },
];

runs.forEach(({ label, setup, variant }) => {
  context(label, () => {
    beforeEach(() => setup());
    definePaginationTests(label, variant);
  });
});
