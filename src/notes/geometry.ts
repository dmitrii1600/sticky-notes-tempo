import type { Point, Rect, Size } from './types'

export const MIN_NOTE_SIZE: Size = { width: 140, height: 120 }
export const DEFAULT_NOTE_SIZE: Size = { width: 220, height: 180 }

export function clamp(value: number, min: number, max: number): number {
  // max drops below min when the board is smaller than the note, so min wins.
  return Math.min(Math.max(value, min), Math.max(min, max))
}

/** Builds a positive-width rect from two opposite corners, in any order. */
export function rectFromCorners(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  }
}

/**
 * Keeps a note fully inside the board by shifting it, never by shrinking it.
 * Coordinates are rounded here and in resizeWithin so notes always land on whole
 * pixels - fractional offsets make the text inside them render blurry.
 */
export function placeWithin(rect: Rect, board: Size): Rect {
  return {
    ...rect,
    x: Math.round(clamp(rect.x, 0, board.width - rect.width)),
    y: Math.round(clamp(rect.y, 0, board.height - rect.height)),
  }
}

/** Keeps a note inside the board by resizing it from its top-left corner. */
export function resizeWithin(rect: Rect, board: Size): Rect {
  return {
    ...rect,
    width: Math.round(clamp(rect.width, MIN_NOTE_SIZE.width, board.width - rect.x)),
    height: Math.round(clamp(rect.height, MIN_NOTE_SIZE.height, board.height - rect.y)),
  }
}

/** Used after the window shrinks: pull a note back into view, resizing only if it no longer fits. */
export function fitWithin(rect: Rect, board: Size): Rect {
  return placeWithin(
    {
      ...rect,
      width: clamp(rect.width, MIN_NOTE_SIZE.width, board.width),
      height: clamp(rect.height, MIN_NOTE_SIZE.height, board.height),
    },
    board,
  )
}

export function containsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

export function centerOn(point: Point, size: Size): Rect {
  return {
    x: point.x - size.width / 2,
    y: point.y - size.height / 2,
    ...size,
  }
}
