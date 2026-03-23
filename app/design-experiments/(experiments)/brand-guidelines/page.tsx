import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { BrandGuidelinesContent } from './components/BrandGuidelinesContent';

export const metadata: Metadata = experimentMetadata('brand-guidelines');

export default function BrandGuidelinesPage() {
    return <BrandGuidelinesContent />;
}
