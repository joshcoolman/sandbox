'use client'

import { Pencil, Check } from 'lucide-react'
import { useNewsEdit, useIsLocal } from './NewsEditContext'
import styles from '../news.module.css'

export default function NewsEditToggle() {
  const { editing, setEditing } = useNewsEdit()
  const isLocal = useIsLocal()

  if (!isLocal) return null

  return (
    <button
      type="button"
      className={`${styles.editToggle} ${editing ? styles.editToggleActive : ''}`}
      onClick={() => setEditing(!editing)}
      aria-pressed={editing}
    >
      {editing ? <Check size={12} /> : <Pencil size={12} />}
      {editing ? 'Done' : 'Edit'}
    </button>
  )
}
