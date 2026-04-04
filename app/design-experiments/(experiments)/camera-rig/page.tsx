'use client'

import dynamic from 'next/dynamic'
import { Share_Tech_Mono, Barlow } from 'next/font/google'

const mono = Share_Tech_Mono({ subsets: ['latin'], weight: '400', variable: '--cr-font-mono' })
const body = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--cr-font-body' })

const CameraRig = dynamic(() => import('./components/CameraRig').then(m => ({ default: m.CameraRig })), {
  ssr: false,
})

export default function CameraRigPage() {
  return (
    <CameraRig
      className={`${mono.variable} ${body.variable}`}
      defaultImage="/design-experiments/camera-rig/default-image.jpg"
    />
  )
}
