// Custom Cypress commands and helpers

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;
      setReactInput(selectorOrSubject: string | JQuery<HTMLElement>, value: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add('dataCy', (value: string) => cy.get(`[data-cy="${value}"]`));

// Reliably set value on React-controlled inputs by dispatching native events
Cypress.Commands.add('setReactInput', (selectorOrSubject: string | JQuery<HTMLElement>, value: string) => {
  const getSubject = () =>
    typeof selectorOrSubject === 'string' ? cy.get(selectorOrSubject) : cy.wrap(selectorOrSubject);

  getSubject().then(($el) => {
    const el = $el.get(0) as HTMLInputElement | HTMLTextAreaElement;
    el.focus();
    // Set the value and dispatch input/change so React updates state
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(el.__proto__, 'value')?.set;
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value);
    } else {
      (el as any).value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

// Cache session to speed up multi-spec runs
Cypress.Commands.add('login', () => {
  cy.session('user1@test.com', () => {
    cy.visit('/logg-inn?returnUrl=/dashboard');
    cy.dataCy('email-input').clear().type('user1@test.com');
    cy.dataCy('password-input').clear().type('test123', { log: false });
    cy.dataCy('login-button').click();
    cy.location('pathname').should('eq', '/dashboard');
  });
});

export {};
