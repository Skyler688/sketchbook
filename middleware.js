import { NextResponse } from "next/server";
import { validateToken } from "./lib/session";

// Configuring the middleware to be used only on the private endpoints.
export const config = {
  matcher: ["/api/private/:path*"],
};

export async function middleware(req) {
  //   console.log("middleware is running");

  const cookie = req.cookies.get("session")?.value;
  const token = await validateToken(cookie);

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  console.log(token);

  const response = NextResponse.next();

  response.headers.set("user_id", token.user_id);
  response.headers.set("username", token.username);

  return response;
}
