import { redirect } from "next/navigation";
import { getFreshRole, roleHome } from "@/lib/role";

/** Single routing point after auth: send each role to its own surface. */
export async function GET() {
  const session = await getFreshRole();
  if (session && "error" in session) {
    return new Response(
      "Couldn't verify your session — check CLERK_SECRET_KEY on this environment.",
      { status: 500 },
    );
  }
  if (!session) redirect("/sign-in");
  redirect(roleHome(session.role));
}
