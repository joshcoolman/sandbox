import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { ContactSheetBrowser } from './components/ContactSheetBrowser';

export const metadata: Metadata = experimentMetadata('contact-sheet');

export default function ContactSheetPage() {
  return <ContactSheetBrowser />;
}
