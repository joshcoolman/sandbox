import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { CrossfitChallengeContent } from './components/CrossfitChallengeContent';

export const metadata: Metadata = experimentMetadata('crossfit-challenge');

export default function CrossfitChallengePage() {
  return <CrossfitChallengeContent />;
}
