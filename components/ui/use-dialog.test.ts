import { renderHook, act } from '@testing-library/react'
import { useDialog } from './use-dialog'

describe('useDialog hook', () => {
  let originalOverflow: string

  beforeEach(() => {
    vi.clearAllMocks()
    originalOverflow = document.body.style.overflow
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = originalOverflow
  })

  describe('scroll lock', () => {
    it('should set body overflow to hidden when open', () => {
      renderHook(() =>
        useDialog({
          isOpen: true,
          onClose: vi.fn(),
        })
      )

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should restore body overflow when closed', () => {
      const { rerender } = renderHook(
        ({ isOpen }: { isOpen: boolean }) =>
          useDialog({
            isOpen,
            onClose: vi.fn(),
          }),
        { initialProps: { isOpen: true } }
      )

      expect(document.body.style.overflow).toBe('hidden')

      rerender({ isOpen: false })
      expect(document.body.style.overflow).toBe('')
    })

    it('should not lock scroll when lockScroll is false', () => {
      renderHook(() =>
        useDialog({
          isOpen: true,
          onClose: vi.fn(),
          lockScroll: false,
        })
      )

      expect(document.body.style.overflow).toBe('')
    })

    it('should restore body overflow on unmount', () => {
      const { unmount } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose: vi.fn(),
        })
      )

      expect(document.body.style.overflow).toBe('hidden')

      unmount()
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('dialog props', () => {
    it('should return correct dialog props', () => {
      const onClose = vi.fn()
      const { result } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose,
        })
      )

      expect(result.current.dialogProps.role).toBe('dialog')
      expect(result.current.dialogProps['aria-modal']).toBe(true)
      expect(result.current.dialogProps.ref).toBeDefined()
      expect(typeof result.current.dialogProps.onKeyDown).toBe('function')
    })

    it('should return overlay props with onClick handler', () => {
      const onClose = vi.fn()
      const { result } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose,
        })
      )

      expect(typeof result.current.overlayProps.onClick).toBe('function')
    })
  })

  describe('escape key', () => {
    it('should call onClose when Escape is pressed', () => {
      const onClose = vi.fn()
      const { result } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose,
        })
      )

      act(() => {
        const event = {
          key: 'Escape',
          stopPropagation: vi.fn(),
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent
        result.current.dialogProps.onKeyDown(event)
      })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose on Escape when closeOnEscape is false', () => {
      const onClose = vi.fn()
      const { result } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose,
          closeOnEscape: false,
        })
      )

      act(() => {
        const event = {
          key: 'Escape',
          stopPropagation: vi.fn(),
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent
        result.current.dialogProps.onKeyDown(event)
      })

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('outside click', () => {
    it('should call onClose when overlay is clicked directly', () => {
      const onClose = vi.fn()
      const { result } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose,
        })
      )

      const overlayElement = document.createElement('div')

      act(() => {
        const event = {
          target: overlayElement,
          currentTarget: overlayElement,
        } as unknown as React.MouseEvent
        result.current.overlayProps.onClick(event)
      })

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when dialog content is clicked', () => {
      const onClose = vi.fn()
      const { result } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose,
        })
      )

      const overlayElement = document.createElement('div')
      const dialogElement = document.createElement('div')

      act(() => {
        const event = {
          target: dialogElement,
          currentTarget: overlayElement,
        } as unknown as React.MouseEvent
        result.current.overlayProps.onClick(event)
      })

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should not call onClose on outside click when closeOnOutsideClick is false', () => {
      const onClose = vi.fn()
      const { result } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose,
          closeOnOutsideClick: false,
        })
      )

      const overlayElement = document.createElement('div')

      act(() => {
        const event = {
          target: overlayElement,
          currentTarget: overlayElement,
        } as unknown as React.MouseEvent
        result.current.overlayProps.onClick(event)
      })

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('focus management', () => {
    it('should return a dialogRef', () => {
      const { result } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose: vi.fn(),
        })
      )

      expect(result.current.dialogRef).toBeDefined()
      expect(result.current.dialogRef.current).toBeNull() // no DOM element attached in hook test
    })
  })

  describe('focus trap keyboard handling', () => {
    it('should handle Tab key without error when no dialog ref is set', () => {
      const onClose = vi.fn()
      const { result } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose,
        })
      )

      // Tab key should not throw when dialogRef has no element
      act(() => {
        const event = {
          key: 'Tab',
          shiftKey: false,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        } as unknown as React.KeyboardEvent
        result.current.dialogProps.onKeyDown(event)
      })

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should not trap focus when trapFocus is false', () => {
      const onClose = vi.fn()
      const { result } = renderHook(() =>
        useDialog({
          isOpen: true,
          onClose,
          trapFocus: false,
        })
      )

      const preventDefault = vi.fn()

      act(() => {
        const event = {
          key: 'Tab',
          shiftKey: false,
          preventDefault,
          stopPropagation: vi.fn(),
        } as unknown as React.KeyboardEvent
        result.current.dialogProps.onKeyDown(event)
      })

      // When trapFocus is false, we should not prevent default
      expect(preventDefault).not.toHaveBeenCalled()
    })
  })

  describe('options defaults', () => {
    it('should default all options to true', () => {
      const onClose = vi.fn()
      renderHook(() =>
        useDialog({
          isOpen: true,
          onClose,
        })
      )

      // Scroll lock should be active by default
      expect(document.body.style.overflow).toBe('hidden')
    })
  })
})
