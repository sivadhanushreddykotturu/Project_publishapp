import { redirect } from "next/navigation";
import { getFreshRole, roleHome } from "@/lib/role";

/** Single routing point after auth: send each role to its own surface. */
export async function GET() {
  const session = await getFreshRole();
  if (!session) redirect("/sign-in");
  redirect(roleHome(session.role));
}
