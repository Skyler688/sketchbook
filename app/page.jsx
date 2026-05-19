import Main from "../components/Main/Main";

// import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { validateToken } from "../lib/server/session";
import { verify } from "crypto";

export default async function Home() {
    const cookie_store = await cookies();

    const cookie = cookie_store.get("session")?.value;

    if (!cookie) {
        redirect("/login");
    }

    const token = validateToken(cookie);

    if (!token) {
        redirect("/login");
    }

    return <Main />;
}
