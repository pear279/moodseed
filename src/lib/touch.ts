// Shared touch primitives (from beUI). iOS/Android run their own gestures
// on top of the page and win once they claim a touch, so gesture surfaces opt out.

export const TOUCH_GESTURE_CLASS = 'select-none [-webkit-touch-callout:none]'

export const TOUCH_GESTURE_CONTENT_CLASS = '[-webkit-touch-callout:none] pointer-coarse:select-none'

/** Suppress selection on `element` for as long as a gesture is running. Returns the release. */
export function holdSelection(element: HTMLElement) {
  element.style.setProperty('user-select', 'none')
  element.style.setProperty('-webkit-user-select', 'none')
  return () => {
    element.style.removeProperty('user-select')
    element.style.removeProperty('-webkit-user-select')
  }
}

/** Pointer capture, best effort. WebKit throws NotFoundError when the pointer is already gone. */
export function capturePointer(element: Element, pointerId: number) {
  try {
    element.setPointerCapture(pointerId)
  } catch {
    // Pointer is no longer active — implicit capture still applies on touch.
  }
}

export function releasePointer(element: Element, pointerId: number) {
  try {
    if (element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId)
    }
  } catch {
    // Capture was already dropped by the browser.
  }
}

/** Whether this event came from a pointer that is hovering (not touch, not currently pressed). */
export const isHoveringPointer = (event: { pointerType: string; buttons: number }) =>
  event.pointerType !== 'touch' && event.buttons === 0
