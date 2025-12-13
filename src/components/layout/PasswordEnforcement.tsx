"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PasswordEnforcement({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (
            session?.user?.mustChangePassword &&
            pathname !== "/thong-tin-ca-nhan"
        ) {
            router.push("/thong-tin-ca-nhan");
        }
    }, [session, pathname, router]);

    return (
        <>
            {session?.user?.mustChangePassword && (
                <div className="bg-red-500 text-white text-center py-2 px-4 shadow-lg sticky top-0 z-50">
                    ⚠️ Bạn cần đổi mật khẩu mới để tiếp tục sử dụng hệ thống
                </div>
            )}
            {children}
        </>
    );
}
