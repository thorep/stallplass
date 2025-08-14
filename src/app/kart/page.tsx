import MapPage from './MapPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kart - Stallplass',
  description: 'Se alle staller på kartet'
};

export default function Page() {
  return <MapPage />;
}