import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { CrossfitBentoContent } from './components/CrossfitBentoContent';

export const metadata: Metadata = experimentMetadata('crossfit-bento');

export default function CrossfitBentoPage() {
  return <CrossfitBentoContent />;
}
