import "./globals.css";
import AuthGate from "@/components/AuthGate";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" className="bg-black">
            <body>
                <AuthGate>{children}</AuthGate>
            </body>
        </html>
    );
}
