import styles from './SelectionActions.module.css'

interface SelectionActionsProps {
  count: number
  isGrouped: boolean
  onArrange: (cols: number) => void
  onGroup: (cols: number) => void
  onUngroup: () => void
}

const DEFAULT_COLUMNS = 4

export function SelectionActions({ count, isGrouped, onArrange, onGroup, onUngroup }: SelectionActionsProps) {
  return (
    <div className={styles.bar} onPointerDown={e => e.stopPropagation()}>
      <span className={styles.label}>{count} selected</span>

      <div className={styles.divider} />

      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={() => onArrange(DEFAULT_COLUMNS)}
        >
          Arrange
        </button>
        {isGrouped ? (
          <button
            className={styles.actionBtn}
            onClick={onUngroup}
          >
            Ungroup
          </button>
        ) : (
          <button
            className={styles.actionBtn}
            onClick={() => onGroup(DEFAULT_COLUMNS)}
          >
            Group
          </button>
        )}
      </div>
    </div>
  )
}
