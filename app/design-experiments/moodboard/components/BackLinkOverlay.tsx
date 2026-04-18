'use client'

import CurtainLink from '@/app/components/CurtainLink'
import { useExperimentBack } from '../../useExperimentBack'
import styles from './BackLinkOverlay.module.css'

export function BackLinkOverlay() {
  const back = useExperimentBack()

  return (
    <CurtainLink
      href={back.href}
      className={styles.link}
      curtainTransition
      curtainReverse
    >
      <span className={styles.arrow}>&larr;</span> {back.label}
    </CurtainLink>
  )
}
