import { database, database_id, Query, ID } from "../../../../lib/appwrite";
import { hashPassword } from "../../../../lib/bcrypt";
import { createSessionToken, setSessionCookie } from "../../../../lib/session";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    //--------------- Server side request validation ----------------

    // Username validation
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
          message: "Invalid password, must be more that 8 characters",
        }),
        { status: 400 },
      );
    }

    //--------------- User Creation ----------------

    // Check that the username is not taken.
    const user_taken = await database.listRows({
      databaseId: database_id,
      tableId: "users",
      queries: [Query.equal("username", username)],
    });

    if (user_taken.total > 0) {
      return new Response(
        JSON.stringify({ success: false, message: "User name is taken" }),
        {
          status: 409,
        },
      );
    }

    // Create user
    const hashed_password = await hashPassword(password);
    const user = await database.createRow({
      databaseId: database_id,
      tableId: "users",
      rowId: ID.unique(),
      data: { username: username, password: hashed_password },
    });

    if (!user.$id) {
      return new Response(
        JSON.stringify({ success: false, message: "Failed to create user" }),
        { status: 500 },
      );
    }

    // Creating the users session
    const token = createSessionToken(user.$id, username);
    const cookie = setSessionCookie(token);

    return new Response(
      JSON.stringify({
        success: true,
        message: "New user created",
      }),
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
