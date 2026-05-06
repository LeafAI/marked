import { useRef, useCallback, useEffect } from 'react'
import styles from './ResizeHandle.module.css'

interface ResizeHandleProps {
  direction: 'vertical' | 'horizontal'
  onDrag: (delta: number) => void
}

export default function ResizeHandle({ direction, onDrag }: ResizeHandleProps) {
  const startPos = useRef(0)
  const dragging = useRef(false)
  const onDragRef = useRef(onDrag)

  // Keep the callback ref up-to-date without triggering re-renders
  useEffect(() => {
    onDragRef.current = onDrag
  }, [onDrag])

  // Stable callbacks — no deps that change on every width update
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return
    const current = direction === 'vertical' ? e.clientX : e.clientY
    const delta = current - startPos.current
    startPos.current = current
    onDragRef.current(delta)
  }, [direction])

  const onMouseUp = useCallback(() => {
    dragging.current = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [onMouseMove])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      dragging.current = true
      startPos.current = direction === 'vertical' ? e.clientX : e.clientY
      document.body.style.cursor = direction === 'vertical' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [direction, onMouseMove, onMouseUp]
  )

  // Cleanup listeners on unmount
  useEffect(() => () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove, onMouseUp])

  return (
    <div
      className={`${styles.handle} ${direction === 'vertical' ? styles.vertical : styles.horizontal}`}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation={direction === 'vertical' ? 'vertical' : 'horizontal'}
    />
  )
}
