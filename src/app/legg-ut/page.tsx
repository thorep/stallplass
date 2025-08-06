import { redirect } from 'next/navigation';

export default function LeggUtPage() {
  // Redirect to the dashboard where users can create a stable via modal
  redirect('/dashboard?tab=stables');
}