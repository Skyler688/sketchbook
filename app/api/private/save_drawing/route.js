export const runtime = "nodejs";

import {
  database,
  database_id,
  storage,
  storage_id,
  ID,
} from "../../../../lib/appwrite";

// NOTE -> In a real production application that would be used by many people is would not be using this server as a middle man to appwrite,
// as doing it like this causes unesesary bandwidth and memory usage. It would be better to set up a temporary auth window to allow the user to send the file
// strait to appwrite, but for the sake of time and simplicity this will suffice.
export async function PUT(req) {
  try {
    const user_id = req.headers.get("user_id"); // User data is added to the header in the middleware.

    const form_data = await req.formData();

    // NOTE -> For the sake of time i am not implementing any type of chunking/reassembly as the compressed drawing files are likely to be pretty small.
    // Ideally given the infanate draw space a custom file chunking system would be needed, but for now this works.
    const file = form_data.get("file");
    const file_name = form_data.get("name");

    console.log(file);
    console.log(file_name);

    // convert te compressed buffer into a file object

    // Send file object back to appwrite storage.

    // If success add new row to drawings in data base linking the users id as the relationship.

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
