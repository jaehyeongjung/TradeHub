"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isTrading = pathname === "/trading";
    const isDashboard = pathname === "/dashboard";

    if (!isTrading && !isDashboard) {
        return <>{children}</>;
    }

    return (
        <div className="overflow-hidden">
            <motion.div
                initial={{
                    opacity: 0,
                    x: isTrading ? "100%" : "-100%",
                }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                    x: { type: "tween", duration: 0.3, ease: "easeInOut" },
                    opacity: { duration: 0.2 },
                }}
            >
                {children}
            </motion.div>
        </div>
    );
}
