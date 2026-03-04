import { database, database_id, Query } from "../../../../lib/appwrite";

export async function GET(req) {
  try {
    const user_id = await req.headers.get("user_id"); // Is put in the header in the middleware.

    const drawing_rows = await database.listRows({
      databaseId: database_id,
      tableId: "drawings",
      queries: [Query.equal("user", user_id)],
    });

    const drawings = [];

    for (let i = 0; i < drawing_rows.rows.length; i++) {
      const row = drawing_rows.rows[i];

      drawings.push(row.drawing_name);
    }

    return new Response(JSON.stringify({ success: true, drawings: drawings }), {
      status: 200,
    });
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
