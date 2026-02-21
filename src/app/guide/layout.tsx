import SeoFooter from "@/components/SeoFooter";

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
