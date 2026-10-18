import AdminConsole from "@/components/admin/AdminConsole";
export default async function AdminPage({params}:{params:Promise<{section?:string[]}>}) { const {section=[]}=await params; return <AdminConsole section={section}/>; }
