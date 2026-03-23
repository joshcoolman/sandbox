import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { TerminatorContent } from './components/TerminatorContent';

export const metadata: Metadata = experimentMetadata('terminator');

export default function TerminatorPage() {
  return <TerminatorContent />;
}
