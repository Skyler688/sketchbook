import {
  database,
  database_id,
  storage,
  storage_id,
  ID,
  Query,
} from "../../../../lib/appwrite";

export async function POST(req) {
  try {
    const user_id = await req.headers.get("user_id");

    const { drawing_name } = await req.json();

    // Verifying the user is requesting a valid drawing and that the drawing belongs to them.
    const drawing = await database.listRows({
      databaseId: database_id,
      tableId: "drawings",
      queries: [
        Query.equal("user", user_id),
        Query.equal("drawing_name", drawing_name),
      ],
    });

    if (drawing.rows.length === 0) {
      return new Response(JSON.stringify({ success: false }), { status: 400 });
    } else if (drawing.rows.length > 1) {
      console.error(
        "WARNING -> Multiple copies of a users drawing found in database.",
      );
    }

    const drawing_id = drawing.rows[0].drawing_id;

    // Downloading the file from appwrite bucket
    let drawing_file;
    try {
      drawing_file = await storage.getFileDownload({
        bucketId: storage_id,
        fileId: drawing_id,
      });
    } catch (error) {
      console.error("File failed to download from appwrite bucket-> ", error);
      return new Response(
        JSON.stringify(
          { success: false, message: "File not found" },
          { status: 404 },
        ),
      );
    }

    return new Response(drawing_file, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
      },
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
