import {
  database,
  database_id,
  storage,
  storage_id,
  ID,
  Query,
} from "../../../../lib/appwrite";

// NOTE -> In a real production application that would be used by many people is would not be using this server as a middle man to appwrite,
// as doing it like this causes unesesary bandwidth and memory usage. It would be better to set up a temporary auth window to allow the user to send the file
// strait to appwrite, but for the sake of time and simplicity this will suffice.
export async function PUT(req) {
  try {
    const user_id = await req.headers.get("user_id"); // User data is added to the header in the middleware.

    const form_data = await req.formData();

    // NOTE -> For the sake of time i am not implementing any type of chunking/reassembly as the compressed drawing files are likely to be pretty small.
    // Ideally given the infanate draw space a custom file chunking system would be needed, but for now this works.

    const drawing_buffer = form_data.get("file");
    const drawing_name = form_data.get("name");

    if (drawing_name === "" || !drawing_name) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid drawing name" }),
        { status: 400 },
      );
    }

    if (!drawing_buffer) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid drawing file" }),
        { status: 400 },
      );
    }

    // First send request to database to determin if this is a create or update.
    const drawing_rows = await database.listRows({
      databaseId: database_id,
      tableId: "drawings",
      queries: [
        Query.equal("drawing_name", [drawing_name]),
        Query.equal("user", [user_id]),
      ],
    });

    // console.log(drawing_rows);

    // If the drawing exist update the drawing file.
    if (drawing_rows.total > 0) {
      // Log a warning if ever more than one copy of the row is found.
      if (drawing_rows.total > 1) {
        console.error(
          `WARNING -> More than one row with same drawing and user found, USER_ID-> ${user_id}, DRAWING_ID-> ${drawing_row.rows[0].drawing_id}, TOTAL_FOUND-> ${drawing_row.total}`,
        );
      }
      const drawing_row = drawing_rows.rows[0];

      // Just incase the file gets deleted but the create fails.
      try {
        await storage.deleteFile({
          bucketId: storage_id,
          fileId: String(drawing_row.drawing_id),
        });
      } catch (error) {
        console.log("No file to update, creating new.");
      }

      const create_result = await storage.createFile({
        bucketId: storage_id,
        fileId: String(drawing_row.drawing_id),
        file: drawing_buffer,
      });

      if (!create_result.$id) {
        throw new Error("Failed to update file");
      }
    } else {
      // If not found send back invalid request.
      return new Response(
        JSON.stringify(
          {
            success: false,
            message: "Failed to save file, no file found",
          },
          { status: 400 },
        ),
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
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
