import {
  database,
  database_id,
  storage,
  storage_id,
  ID,
} from "../../../../lib/appwrite";

export async function PUT(req) {
  try {
    // Take the compressed file and send it to appwrite to update or create the file in the storage bucket.
    const body = await req.json();

    console.log(body);

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
