import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { FontPairingsContent } from './components/FontPairingsContent';

export const metadata: Metadata = experimentMetadata('font-pairings');

export default function FontPairingsPage() {
  return <FontPairingsContent />;
}
