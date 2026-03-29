"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase-browser";
import { ToastProvider } from "@/shared/ui/Toast";

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(() => setReady(true));

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {});

        return () => subscription.unsubscribe();
    }, []);

    if (!ready) return null;
    return (
        <ToastProvider>
            {children}
        </ToastProvider>
    );
}
