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
    const user_id = await req.headers.get("user_id"); // Grabbing the user id placed in the header extracted from the JWT token in the middleware.

    const form_data = await req.formData();

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

    // Checking if a drawing with the same name already exists for that user.
    const drawing_rows = await database.listRows({
      databaseId: database_id,
      tableId: "drawings",
      queries: [
        Query.equal("drawing_name", [drawing_name]),
        Query.equal("user", [user_id]),
      ],
    });

    if (drawing_rows.total > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Drawing with the name of ${drawing_name} already exist.`,
        }),
        { status: 400 },
      );
    }

    // Create the drawing file.
    const drawing_id = ID.unique();

    const drawing_row = await database.createRow({
      databaseId: database_id,
      tableId: "drawings",
      rowId: ID.unique(),
      data: {
        user: user_id,
        drawing_name: drawing_name,
        drawing_id: drawing_id,
      },
    });

    if (!drawing_row.$id) {
      return new Response(
        JSON.stringify({ success: false, message: "Failed save drawing" }),
        { status: 500 },
      );
    }

    // Sending file to appwrite storage bucket. NOTE -> no file name needed just and id.
    const result = await storage.createFile({
      bucketId: storage_id,
      fileId: drawing_id,
      file: drawing_buffer,
    });

    if (!result) {
      console.error(
        "Failed to create drawing file on appwrite, RESULT-> ",
        result,
      );

      // If failed remove the row just created.
      const deleted = await database.deleteRow({
        databaseId: database_id,
        tableId: "drawings",
        rowId: drawing_row.$id,
      });

      console.log("Row deleted-> ", deleted);

      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to create file for drawing in bucket",
        }),
        { status: 400 },
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Drawing file created" }),
      { status: 201 },
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
