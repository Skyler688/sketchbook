import { NextResponse } from "next/server";
import { validateCookie } from "../lib/session";

// Configuring the middleware to be used only on the private endpoints.
export const config = {
  matcher: ["/api/private/:path*"],
};

export function middleware(req) {
  const token = validateCookie(req.cookies);

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.next();
}
