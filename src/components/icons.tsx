import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
}

export const IconRecord = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
)

export const IconPuzzle = (p: P) => (
  <svg {...base} {...p}>
    <path d="M9 3h6M9 3a2 2 0 1 0-2 2M9 3v0M15 3v0M13 3a2 2 0 1 1 2 2M15 5v4M9 5v4M5 9h4M5 9a2 2 0 1 0-2-2M5 9v0M19 9h-4M19 9a2 2 0 1 1 2-2M5 13v0M9 13v8M15 13v8M5 13h14M5 13a2 2 0 1 0-2 2M19 13a2 2 0 1 1 2 2" />
  </svg>
)

export const IconMe = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
)

export const IconPlus = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconCheck = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const IconSparkle = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" />
  </svg>
)

export const IconBottle = (p: P) => (
  <svg {...base} {...p}>
    <path d="M10 2h4M11 2v3.5c-3 1-5 3.8-5 7.5v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-6c0-3.7-2-6.5-5-7.5V2" />
    <path d="M8 15h8" />
  </svg>
)

export const IconHeart = (p: P) => (
  <svg {...base} {...p}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
)

export const IconComment = (p: P) => (
  <svg {...base} {...p}>
    <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
  </svg>
)

export const IconChevronDown = (p: P) => (
  <svg {...base} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const IconClose = (p: P) => (
  <svg {...base} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

export const IconArrowLeft = (p: P) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

export const IconImage = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-5-5-9 9" />
  </svg>
)

export const IconCalendar = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
)

export const IconLeaf = (p: P) => (
  <svg {...base} {...p}>
    <path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16z" />
    <path d="M4 21c4-6 7-10 12-13" />
  </svg>
)

export const IconLock = (p: P) => (
  <svg {...base} {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)
