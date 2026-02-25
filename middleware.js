import { NextResponse } from "next/server";
import { validateToken } from "./lib/session";

// Configuring the middleware to be used only on the private endpoints.
export const config = {
  matcher: ["/api/private/:path*"],
};

export async function middleware(req) {
  console.log("middleware is running");

  const token = req.cookies.get("session")?.value;
  console.log(token);
  const valid = await validateToken(token);

  console.log(valid);

  if (!valid) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.next();
}
