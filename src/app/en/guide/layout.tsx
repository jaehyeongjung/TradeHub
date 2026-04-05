import { SeoFooter } from "@/widgets/shared-modals/SeoFooter";

export default function EnGuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <SeoFooter />
    </>
  );
}
