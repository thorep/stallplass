import Header from '@/components/organisms/Header';

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>
        {children}
      </main>
    </>
  );
}