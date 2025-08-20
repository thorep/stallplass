// Load custom commands
import './commands';

// Reduce flake on slow CI/dev by increasing default command timeout locally in tests
Cypress.config('defaultCommandTimeout', 10000);

