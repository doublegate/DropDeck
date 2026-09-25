import { auth } from '@/lib/auth';

export default auth;

export const config = {
  // Match all routes except:
  // - API routes (handled separately)
  // - The Sentry tunnel route (tunnelRoute in next.config.ts)
  // - Static files
  // - Next.js internals
  matcher: ['/((?!api|monitoring|_next/static|_next/image|favicon.ico|images|.*\\..*).*)'],
};
