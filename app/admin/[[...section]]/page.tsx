import { connection } from "next/server";
import AdminConsole from "@/components/admin/AdminConsole";
export default async function AdminPage({params}:{params:Promise<{section?:string[]}>}) { await connection(); const {section=[]}=await params; return <AdminConsole section={section}/>; }
