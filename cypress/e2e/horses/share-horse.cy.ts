

function navigateToSharingTab() {
  // Click on the "Del" tab
  cy.get('[data-cy="nav-del"]').should("be.visible").click();

  // Wait for the sharing page to load
  cy.url({ timeout: 10000 }).should("include", "/del");
}

function shareHorseWithUser(searchQuery: string, expectedUserName: string) {
  // Wait for the sharing component to load
  cy.contains("Deling og tilgang", { timeout: 20000 }).should("be.visible");

  // Type in the search input
  cy.get('input[placeholder*="Søk"]').clear().type(searchQuery);

  // Wait for search results to appear
  cy.contains("Søkeresultater", { timeout: 10000 }).should("be.visible");

  // Find the user in search results and click "Del" button
  cy.contains(expectedUserName).parents().contains("button", "Del").click();

  // Wait for success toast
  cy.contains(`Hesten er delt med ${expectedUserName}`, { timeout: 10000 }).should("be.visible");

  // Verify the user appears in the "Delt med" section
  cy.contains("Delt med").should("be.visible");
  cy.contains(expectedUserName).should("be.visible");
}

function verifyHorseIsShared(expectedUserName: string) {
  // Check that the user is listed in the shares
  cy.contains("Delt med").should("be.visible");
  cy.contains(expectedUserName).should("be.visible");

  // Verify permissions are shown
  cy.contains("Vis").should("be.visible");
  cy.contains("Legg til logg").should("be.visible");
}

describe("share-horse", () => {
  it("shares a horse with user2 and verifies user2 can see it", () => {
    // First share the horse as user1
    cy.login();
    cy.visit("/mine-hester");

    // Ensure we are on the correct page
    cy.url({ timeout: 10000 }).should("include", "/mine-hester");

    // Wait for horses to load
    cy.get('[data-cy="owned-horses-grid"]', { timeout: 20000 }).should("be.visible");

    // Find the Testhest horse card and click its "Vis" button
    cy.contains("Testhest").parents('[data-cy="horse-card"]').find('[data-cy="vis-horse-button"]').click();

    // Wait for the horse page to load
    cy.url({ timeout: 10000 }).should("match", /\/mine-hester\/[^\/]+$/);

    // Navigate to the sharing tab
    navigateToSharingTab();

    // Share the horse with user2
    shareHorseWithUser("user2", "user2");

    // Verify the horse is shared from user1's perspective
    verifyHorseIsShared("user2");

    // Logout user1
    cy.logout();

    // Now login as user2
    cy.login("user2@test.com", "test123");
    cy.visit("/mine-hester");

    // Wait for horses to load
    cy.contains("Hester delt med meg", { timeout: 20000 }).should("be.visible");

    // Verify that Testhest appears in user2's shared horses section
    cy.contains("Testhest").should("be.visible");

    // Verify that it shows as shared in the shared horses section
    cy.contains("Testhest").parents('[data-cy="horse-card"]').within(() => {
      cy.contains("Delt").should("be.visible");
      cy.contains("Delt av user1").should("be.visible");
    });

    // Click on the shared horse to verify access to horse details
    cy.contains("Testhest").parents('[data-cy="horse-card"]').find('[data-cy="vis-horse-button"]').click();

    // Wait for the horse page to load
    cy.url({ timeout: 10000 }).should("match", /\/mine-hester\/[^\/]+$/);

    // Verify that user2 can access the horse details
    cy.contains("Testhest").should("be.visible");

    // Verify that user2 can see the Logg tab (but not Budget tab)
    cy.get('[data-cy="nav-logg"]').should("be.visible");
    cy.get('[data-cy="nav-stall"]').should("be.visible");
    cy.get('[data-cy="nav-del"]').should("be.visible");
    cy.get('[data-cy="nav-budsjett"]').should("not.exist");

    // Test that user2 can access the logg page
    cy.get('[data-cy="nav-logg"]').click();
    cy.url({ timeout: 10000 }).should("include", "/logg");
    cy.contains("Du må opprette minst én kategori").should("be.visible");
  });
});