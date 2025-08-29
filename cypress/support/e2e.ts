/// <reference types="cypress" />

import './commands'

// Globally hide PostHog survey overlays and widgets that may intercept clicks/typing
Cypress.on('window:before:load', (win) => {
  try {
    const style = win.document.createElement('style')
    style.setAttribute('data-cy', 'hide-posthog')
    style.innerHTML = `
      [class^="PostHogSurvey-"],
      .PostHogFloatingButton,
      [data-attr="ph-survey"],
      [data-ph-cy-overlay] {
        display: none !important;
        pointer-events: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `
    win.document.head.appendChild(style)

    const remove = () => {
      win.document
        .querySelectorAll('[class^="PostHogSurvey-"], .PostHogFloatingButton, [data-attr="ph-survey"]')
        .forEach((n) => (n as HTMLElement).remove())
    }
    remove()
    const mo = new win.MutationObserver(() => remove())
    mo.observe(win.document.documentElement, { childList: true, subtree: true })
  } catch {
    // best-effort only
  }
})

beforeEach(() => {
  // Belt-and-suspenders: clean overlays after each navigation
  cy.window({ log: false }).then((win) => {
    const overlays = win.document.querySelectorAll('[class^="PostHogSurvey-"], .PostHogFloatingButton, [data-attr="ph-survey"]')
    overlays.forEach((n) => (n as HTMLElement).remove())
  })
})
