import { useEffect, useRef } from 'react'
import { Sequencer, type SequencerController } from '../../step-sequencer'

type Props = {
  open: boolean
  onClose: () => void
  controller: SequencerController
}

export function MusicEditModal({ open, onClose, controller }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
      className="monono-music-modal"
      aria-label="Edit background music pattern"
    >
      <div className="monono-music-modal__body">
        <button
          type="button"
          className="monono-music-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <Sequencer controller={controller} />
      </div>
    </dialog>
  )
}
