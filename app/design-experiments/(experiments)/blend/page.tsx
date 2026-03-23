import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { BlendContent } from './components/BlendContent';

export const metadata: Metadata = experimentMetadata('blend');

export default function BlendPage() {
  return <BlendContent />;
}
