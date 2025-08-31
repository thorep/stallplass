import './commands'

beforeEach(() => {
  cy.window().then((win) => {
    // Skjul PostHog overlays for stabilitet i tester
    if (win.posthog) {
      win.posthog.opt_out_capturing()
    }
  })
})