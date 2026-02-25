import { clearSessionCookie } from "../../../../lib/session";

export function POST(req) {
  try {
    return new Response(
      JSON.stringify({ success: true, message: "Logged out" }),
      { status: 200, headers: { "Set-Cookie": clearSessionCookie() } },
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Unknown internal server error",
      }),
      { status: 500 },
    );
  }
}
