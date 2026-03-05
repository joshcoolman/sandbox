import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Candy Icons',
  description:
    'Ten 3D app icons crafted from pure CSS and SVG. Each squircle shell uses a four-layer gradient stack driven by a single --hue custom property.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
