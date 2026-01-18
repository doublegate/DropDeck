/**
 * MSW server setup for Node.js environment (tests)
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server instance for use in tests
 */
export const server = setupServer(...handlers);
