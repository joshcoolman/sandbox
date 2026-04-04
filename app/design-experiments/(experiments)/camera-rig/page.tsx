import { Share_Tech_Mono, Barlow } from 'next/font/google'
import { CameraRig } from './components/CameraRig'

const mono = Share_Tech_Mono({ subsets: ['latin'], weight: '400', variable: '--cr-font-mono' })
const body = Barlow({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--cr-font-body' })

export default function CameraRigPage() {
  return (
    <CameraRig className={`${mono.variable} ${body.variable}`} />
  )
}
