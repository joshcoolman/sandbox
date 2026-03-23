// Top-level route (not in (experiments)/) -- fullscreen scroll/zoom animation
// conflicts with the shared layout wrapper's header/footer chrome
import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { CardStackContent } from './components/CardStackContent';

export const metadata: Metadata = experimentMetadata('card-stack');

export default function CardStackPage() {
  return <CardStackContent />;
}
