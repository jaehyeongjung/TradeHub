import { SeoFooter } from "@/widgets/shared-modals/SeoFooter";

export default function GuideLayout({
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
