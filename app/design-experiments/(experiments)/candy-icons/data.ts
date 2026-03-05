import type { CandyIcon } from './types'

export const animalMap = [
  'squirrel-svgrepo-com.svg',
  'penguin-svgrepo-com.svg',
  'fox-svgrepo-com.svg',
  'rabbit-svgrepo-com.svg',
  'raccoon-svgrepo-com.svg',
]

export const defaultIcons: CandyIcon[] = [
  {
    label: 'Heart',
    hue: 340,
    path: 'M32 56.5C18 44.5 8 37 8 26a14 14 0 0 1 24-9.8A14 14 0 0 1 56 26c0 11-10 18.5-24 30.5z',
  },
  {
    label: 'Star',
    hue: 45,
    path: 'M32 6L38 24 58 25 42 36 48 55 32 44 16 55 22 36 6 25 26 24Z',
  },
  {
    label: 'Bolt',
    hue: 268,
    path: 'M36 4L16 34h16l-4 26 22-32H34z',
  },
  {
    label: 'Play',
    hue: 208,
    path: 'M20 10a4 4 0 0 0-4 4.5v35a4 4 0 0 0 6 3.5l28-17.5a4 4 0 0 0 0-7L22 11a4 4 0 0 0-2-1z',
  },
  {
    label: 'Flame',
    hue: 18,
    path: 'M32 6C22 20 14 30 14 40a18 18 0 0 0 36 0C50 30 42 20 32 6z',
  },
]
