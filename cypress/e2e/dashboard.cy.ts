describe("Dashboard - Stable Owner Features", () => {
  beforeEach(() => {
    cy.loginAsUser1();
  });

  it("logged in user can access dashboard with stable management", () => {
    // User is already logged in via beforeEach
    cy.visit("/dashboard");
    // Go to Mine staller tab
    cy.get('[data-cy="dashboard-tab-stables"]').click();

    // Wait for stables to load
    cy.wait(5000); // Give time for stables data to load
    // Should see dashboard content
    cy.get('[data-cy="stables"]');
  });

  it("stable owner can navigate to create stable from Mine staller tab", () => {
    cy.visit("/dashboard");
    // cy.waitForDashboard();

    // Navigate to Mine staller tab
    cy.get('[data-cy="dashboard-tab-stables"]').click();

    // Wait for stables data to load
    cy.wait(8000);

    // Look for and click the add stable button
    cy.get('[data-cy="add - stable - button"]').click();

    // Should navigate to create stable page
    cy.url().should("include", "/ny-stall");
    cy.get("h1").should("contain", "Legg til ny stall");
  });

  it("stable owner can navigate to create stable from main overview button", () => {
    cy.visit("/dashboard");
    cy.waitForDashboard();

    // Go to Mine staller tab and create new stable
    cy.get('[data-cy="dashboard-tab-stables"]').click();

    // Wait for stables data to load
    cy.wait(8000);

    // Look for and click the add stable button
    cy.get("button").contains("Legg til ny stall").should("be.visible").click();

    // Should navigate to create stable page
    cy.url().should("include", "/ny-stall");
    cy.get("h1").should("contain", "Legg til ny stall");
  });
});
