import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Single MSW server instance shared by all tests.
// Individual tests can call server.use(...) to override specific handlers.
export const server = setupServer(...handlers);
