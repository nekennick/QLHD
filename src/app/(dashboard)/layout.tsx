import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import MobileSidebar from "@/components/layout/MobileSidebar";
import PasswordEnforcement from "@/components/layout/PasswordEnforcement";
import IdleTimerWrapper from "@/components/layout/IdleTimerWrapper";

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
        <IdleTimerWrapper>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
                <MobileSidebar />
                <Sidebar />

                <main className="min-h-screen transition-all pt-16 md:pt-0 md:ml-64">
                    <PasswordEnforcement>
                        <div className="p-4 md:p-8">{children}</div>
                    </PasswordEnforcement>
                </main>
            </div>
        </IdleTimerWrapper>
    );
}
