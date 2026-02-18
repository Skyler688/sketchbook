import { database, database_id, Query } from "../../../../lib/appwrite";
import { verifyPassword } from "../../../../lib/bcrypt";
import { createSessionToken, setSessionCookie } from "../../../../lib/session";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    //--------------- Server side request validation ----------------

    // Username validation

    // NOTE -> I am already reinforcing length rules on the client side, but is also reinforced again on server side just incase.
    // This is to prevent any possibility of invalid users getting into the database.
    if (username.length < 4) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid username, must be 4 or more characters",
        }),
      );
    }
    const trimmedUsername = username.trim();
    if (trimmedUsername !== username) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid username, cannot contain any whitespaces",
        }),
        { status: 400 },
      );
    }

    // Password validation
    const trimmedPassword = password.trim();
    if (trimmedPassword !== password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid password, cannot contain any whitespaces",
        }),
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid password, must be 8 or more characters",
        }),
        { status: 400 },
      );
    }

    // Data base validation
    const users = await database.listRows({
      databaseId: database_id,
      tableId: "users",
      queries: [Query.equal("username", username)],
    });

    if (users.total > 1) {
      throw new Error("Multiple user copies found in database");
    } else if (users.total !== 1) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid username, please try again",
        }),
        { status: 400 },
      );
    }

    console.log("TEST->", users);

    const user = users.rows[0];

    const is_valid = await verifyPassword(password, user.password);

    if (!is_valid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid password, please try again",
        }),
        { status: 400 },
      );
    }

    // If user is valid, creating sessionCookie and JWT token.
    const token = createSessionToken(user.$id, username);
    const cookie = setSessionCookie(token);

    return new Response(
      JSON.stringify({ success: true, message: "Logged in successfully" }),
      { status: 200, headers: { "Set-Cookie": cookie } },
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
