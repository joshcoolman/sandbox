import type { Metadata } from 'next';
import { experimentMetadata } from '@/lib/experiments/metadata';
import { RetroTechPanel } from './components/RetroTechPanel';
import { EditorialBrief } from '../../components/EditorialBrief';
import type { EditorialImage } from '../../components/EditorialBrief';
import styles from './page.module.css';

export const metadata: Metadata = experimentMetadata('retro-tech');

const images: EditorialImage[] = [
  { src: '/design-experiments/retro-tech/sample-product-design-2.jpg', alt: 'Control surface detail', cropClass: 'imageCropped' },
  { src: '/design-experiments/retro-tech/sample-product-design-4.jpg', alt: 'Panel layout reference', cropClass: 'imageCroppedDown' },
];

export default function RetroTechPage() {
  return (
    <div className={styles.page}>
      <RetroTechPanel />
      <EditorialBrief
        headline="Designing hardware that only exists on screen"
        lede="A skeuomorphic audio interface built through voice-driven pairing between a designer and an AI agent, one conversation at a time."
        images={images}
      >
        <p>
          This experiment started with a handful of product photos&mdash;close-ups
          of audio equipment, machined knobs, brushed aluminum panels. The kind of
          objects where every shadow has a reason and every radius was chosen by an
          engineer with strong opinions. The question was simple: could we recreate
          that physicality in the browser?
        </p>
        <p>
          The process was entirely conversational. No wireframes, no mockups. Just
          voice dictation driving an agent that writes code. &ldquo;The shadow
          shouldn&rsquo;t rotate with the knob&mdash;only the notch moves.&rdquo;
          &ldquo;The drag should be left-right, not circular.&rdquo; &ldquo;Those
          numbers can&rsquo;t shift when the value changes&mdash;pad with zeros.&rdquo;
          Each observation pushed the fidelity higher.
        </p>
        <p>
          The equalizer was a turning point. Animated bars were eye candy until the
          low, mid, and high controls started driving them. Suddenly a static layout
          became an instrument. The frequency and gain readouts followed&mdash;fixed-width
          numerals that update without jittering, lit slightly brighter than the
          surrounding chrome to suggest a backlit display.
        </p>
        <p>
          The track name scramble was a late addition, borrowed from a Terminator-style
          text effect built in a separate experiment. It had no business working here,
          but it did. That kind of cross-pollination is what makes this sandbox worth
          maintaining&mdash;ideas migrate between experiments without planning.
        </p>
      </EditorialBrief>
    </div>
  );
}
