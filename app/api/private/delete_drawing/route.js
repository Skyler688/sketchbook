import {
    database,
    database_id,
    storage,
    storage_id,
    Query,
} from "@/lib/server/appwrite";

export async function DELETE(req) {
    try {
        const user_id = await req.headers.get("user_id");

        const { drawing_name } = await req.json();

        const drawings = await database.listRows({
            databaseId: database_id,
            tableId: "drawings",
            queries: [
                Query.equal("user", user_id),
                Query.equal("drawing_name", drawing_name),
            ],
        });

        if (drawings.rows.length === 0) {
            throw new Error("No drawing found, failed to delete drawing.");
        } else if (drawings.rows.length > 1) {
            // Better to handle the duplicates and delete them and log the problem in a production environment.
            // But for development this is better to catch possible bugs.
            throw new Error("Duplicate drawings found in tablesDB database.");
        }

        const drawing = drawings.rows[0];

        const file_result = await storage.deleteFile({
            bucketId: storage_id,
            fileId: drawing.drawing_id,
        });

        console.log(file_result);

        const row_result = await database.deleteRow({
            databaseId: database_id,
            tableId: "drawings",
            rowId: drawing.$id,
        });

        console.log(row_result);

        return new Response(
            JSON.stringify({
                success: true,
                message: "Drawing deleted successfully",
            }),
            { status: 200 },
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
