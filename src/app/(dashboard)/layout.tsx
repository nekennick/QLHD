import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import PasswordEnforcement from "@/components/layout/PasswordEnforcement";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <main className="ml-64 min-h-screen">
                <PasswordEnforcement>
                    <div className="p-8">{children}</div>
                </PasswordEnforcement>
            </main>
        </div>
    );
}
