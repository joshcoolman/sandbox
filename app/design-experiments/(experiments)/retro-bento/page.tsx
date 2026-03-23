import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { RetroBentoContent } from './components/RetroBentoContent';

export const metadata: Metadata = experimentMetadata('retro-bento');

export default function RetroBentoPage() {
  return <RetroBentoContent />;
}
