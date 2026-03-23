import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { DayAtAGlanceContent } from './components/DayAtAGlanceContent';

export const metadata: Metadata = experimentMetadata('day-at-a-glance');

export default function DayAtAGlancePage() {
  return <DayAtAGlanceContent />;
}
