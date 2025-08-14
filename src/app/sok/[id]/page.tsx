import { redirect } from 'next/navigation';

interface OldStablePageProps {
  params: Promise<{ id: string }>;
}

export default async function OldStablePage({ params }: OldStablePageProps) {
  const { id } = await params;
  
  // Redirect to the new URL structure
  redirect(`/staller/${id}`);
}