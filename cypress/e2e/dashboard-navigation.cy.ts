describe("Dashboard Navigation - Tab Functionality", () => {
  beforeEach(() => {
    cy.loginAsUser1();
  });

  it("logged in stable owner can click all dashboard navigation tabs and content loads correctly", () => {
    cy.visit("/dashboard");
    cy.waitForDashboard();

    // Test "Oversikt" tab - should show some statistics or metrics
    cy.get('[data-cy="dashboard-tab-overview"]').click();
    cy.get('[data-cy="overview"]');
    // Test "Mine staller" tab - should show stable management interface
    cy.get('[data-cy="dashboard-tab-stables"]').click();
    cy.wait(2000); // Wait for tab content to load
    cy.get('[data-cy="stables"]');

    // Test "Leieforhold" tab - should show rental relationships interface
    cy.get('[data-cy="dashboard-tab-rentals"]').click();
    cy.wait(2000); // Wait for tab content to load
    cy.get('[data-cy="rentals"]');

    // Test "Tjenester" tab - should show services management interface
    cy.get('[data-cy="dashboard-tab-services"]').click();
    cy.wait(2000); // Wait for tab content to load
    cy.get('[data-cy="services"]');

    // Test "Analyse" tab - should show analytics interface
    cy.get('[data-cy="dashboard-tab-analytics"]').click();
    cy.wait(2000); // Wait for tab content to load
    cy.get('[data-cy="analytics"]');
  });
});
