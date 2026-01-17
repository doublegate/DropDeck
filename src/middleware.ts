import { auth } from '@/lib/auth';

export default auth;

export const config = {
  // Match all routes except:
  // - API routes (handled separately)
  // - Static files
  // - Next.js internals
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)'],
};
