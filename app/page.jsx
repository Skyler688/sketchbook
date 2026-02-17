import Sidebar from "../components/Sidebar/Sidebar";
import Canvas from "../components/Canvas/Canvas";

import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Home() {
  const cookie_store = await cookies();

  const token = cookie_store.get("session")?.value;

  if (!token) {
    redirect("/pages/login");
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    redirect("/pages/login");
  }

  return (
    <div className="app">
      <Sidebar />
      <Canvas />
    </div>
  );
}
