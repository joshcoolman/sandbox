import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { ModularGridContent } from './components/ModularGridContent';

export const metadata: Metadata = experimentMetadata('modular-grid');

export default function ModularGridPage() {
  return <ModularGridContent />;
}
