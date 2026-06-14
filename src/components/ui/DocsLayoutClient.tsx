"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";

export function DocsLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col md:flex-row flex-1 w-full container mx-auto px-4 sm:px-6 lg:px-8">
            <Sidebar />
            <main className="flex-1 min-w-0 py-8 md:py-16 w-full md:pl-8 lg:pl-12" key={pathname}>
                {children}
            </main>
        </div>
    );
}
