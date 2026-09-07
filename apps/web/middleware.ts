import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Auth gate only. Authoritative role checks happen server-side in each role
 * area's layout (fresh Clerk read, not stale JWT claims) and again in the API.
 */
const isProtected = createRouteMatcher([
  "/client(.*)",
  "/tester(.*)",
  "/admin(.*)",
  "/onboarding(.*)",
  "/post-auth",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    const session = await auth();
    if (!session.userId) {
      return session.redirectToSignIn({ returnBackUrl: req.url });
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
