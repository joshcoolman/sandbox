export interface CanvasImage {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
}

export interface Transform {
  x: number
  y: number
  scale: number
}

export interface CanvasGroup {
  id: string
  imageIds: string[]
  columns: number
  padding: number
}

export interface PersistedState {
  images: CanvasImage[]
  transform: Transform
  groups?: CanvasGroup[]
}

export type DragMode = 'pan' | 'move' | 'marquee' | null
