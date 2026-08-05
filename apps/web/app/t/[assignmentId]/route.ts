import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

/** Per-tester tracked testing link — proxies the API redirect (click metric). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const { assignmentId } = await params;
  const base = API.replace(/\/api\/v1$/, "");
  const res = await fetch(`${base}/t/${assignmentId}`, { redirect: "manual" });
  const location = res.headers.get("location");
  if (res.status === 302 && location) {
    return NextResponse.redirect(location, 302);
  }
  return new NextResponse("This testing link isn't available.", { status: 404 });
}
