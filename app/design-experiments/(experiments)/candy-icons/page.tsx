import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { CandyIconsContent } from './components/CandyIconsContent';

export const metadata: Metadata = experimentMetadata('candy-icons');

export default function CandyIconsPage() {
  return <CandyIconsContent />;
}
