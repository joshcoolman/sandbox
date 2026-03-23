import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { ImageToUiContent } from './components/ImageToUiContent';

export const metadata: Metadata = experimentMetadata('image-to-ui');

export default function ImageToUiPage() {
  return <ImageToUiContent />;
}
