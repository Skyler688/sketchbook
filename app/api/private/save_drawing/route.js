import {
  database,
  database_id,
  storage,
  storage_id,
  ID,
} from "../../../../lib/appwrite";

export async function PUT(req) {
  try {
    const drawing_data = req.formData();

    // Need to get and verify the drawing file.

    // Save the file in the storage bucket and then create the users drawing info in the database.

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
