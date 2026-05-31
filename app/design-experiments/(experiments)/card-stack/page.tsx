// fullscreen: true in experiment data -- the (experiments) layout skips its
// header/footer chrome so the scroll/zoom animation owns the viewport
import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { CardStackContent } from './components/CardStackContent';

export const metadata: Metadata = experimentMetadata('card-stack');

export default function CardStackPage() {
  return <CardStackContent />;
}
