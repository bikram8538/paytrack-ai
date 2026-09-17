import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
export default async function Page() { const session = await getServerSession(); redirect(session ? "/dashboard" : "/login"); }
