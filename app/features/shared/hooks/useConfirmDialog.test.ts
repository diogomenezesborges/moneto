/**
 * Tests for useConfirmDialog Hook
 *
 * Ensures confirmation dialog state management works correctly.
 */

import { renderHook, act } from '@testing-library/react'
import { useConfirmDialog } from './useConfirmDialog'

describe('useConfirmDialog', () => {
  it('should initialize with closed dialog state', () => {
    const { result } = renderHook(() => useConfirmDialog())

    expect(result.current.dialogState).toEqual({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: expect.any(Function),
      variant: 'danger',
    })
  })

  it('should show dialog with correct state', () => {
    const { result } = renderHook(() => useConfirmDialog())
    const mockOnConfirm = vi.fn()

    act(() => {
      result.current.showConfirmDialog(
        'Delete Transaction',
        'Are you sure you want to delete this transaction?',
        mockOnConfirm,
        'danger'
      )
    })

    expect(result.current.dialogState).toEqual({
      isOpen: true,
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction?',
      onConfirm: mockOnConfirm,
      variant: 'danger',
    })
  })

  it('should default to danger variant when not specified', () => {
    const { result } = renderHook(() => useConfirmDialog())
    const mockOnConfirm = vi.fn()

    act(() => {
      result.current.showConfirmDialog('Confirm Action', 'Please confirm', mockOnConfirm)
    })

    expect(result.current.dialogState.variant).toBe('danger')
  })

  it('should support warning variant', () => {
    const { result } = renderHook(() => useConfirmDialog())
    const mockOnConfirm = vi.fn()

    act(() => {
      result.current.showConfirmDialog(
        'Warning',
        'This action may have consequences',
        mockOnConfirm,
        'warning'
      )
    })

    expect(result.current.dialogState.variant).toBe('warning')
  })

  it('should support info variant', () => {
    const { result } = renderHook(() => useConfirmDialog())
    const mockOnConfirm = vi.fn()

    act(() => {
      result.current.showConfirmDialog(
        'Information',
        'This is informational',
        mockOnConfirm,
        'info'
      )
    })

    expect(result.current.dialogState.variant).toBe('info')
  })

  it('should call onConfirm and close dialog when confirmed', () => {
    const { result } = renderHook(() => useConfirmDialog())
    const mockOnConfirm = vi.fn()

    act(() => {
      result.current.showConfirmDialog('Confirm', 'Message', mockOnConfirm, 'danger')
    })

    expect(result.current.dialogState.isOpen).toBe(true)

    act(() => {
      result.current.handleConfirm()
    })

    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    expect(result.current.dialogState.isOpen).toBe(false)
    expect(result.current.dialogState.title).toBe('')
    expect(result.current.dialogState.message).toBe('')
  })

  it('should close dialog without calling onConfirm when cancelled', () => {
    const { result } = renderHook(() => useConfirmDialog())
    const mockOnConfirm = vi.fn()

    act(() => {
      result.current.showConfirmDialog('Confirm', 'Message', mockOnConfirm, 'danger')
    })

    expect(result.current.dialogState.isOpen).toBe(true)

    act(() => {
      result.current.handleCancel()
    })

    expect(mockOnConfirm).not.toHaveBeenCalled()
    expect(result.current.dialogState.isOpen).toBe(false)
    expect(result.current.dialogState.title).toBe('')
    expect(result.current.dialogState.message).toBe('')
  })

  it('should reset to danger variant after cancel', () => {
    const { result } = renderHook(() => useConfirmDialog())
    const mockOnConfirm = vi.fn()

    act(() => {
      result.current.showConfirmDialog('Warning', 'Message', mockOnConfirm, 'warning')
    })

    expect(result.current.dialogState.variant).toBe('warning')

    act(() => {
      result.current.handleCancel()
    })

    expect(result.current.dialogState.variant).toBe('danger')
  })

  it('should reset to danger variant after confirm', () => {
    const { result } = renderHook(() => useConfirmDialog())
    const mockOnConfirm = vi.fn()

    act(() => {
      result.current.showConfirmDialog('Info', 'Message', mockOnConfirm, 'info')
    })

    expect(result.current.dialogState.variant).toBe('info')

    act(() => {
      result.current.handleConfirm()
    })

    expect(result.current.dialogState.variant).toBe('danger')
  })

  it('should allow showing dialog multiple times with different content', () => {
    const { result } = renderHook(() => useConfirmDialog())
    const mockOnConfirm1 = vi.fn()
    const mockOnConfirm2 = vi.fn()

    // First dialog
    act(() => {
      result.current.showConfirmDialog('First Dialog', 'First message', mockOnConfirm1)
    })

    expect(result.current.dialogState.title).toBe('First Dialog')
    expect(result.current.dialogState.message).toBe('First message')

    act(() => {
      result.current.handleConfirm()
    })

    expect(mockOnConfirm1).toHaveBeenCalledTimes(1)

    // Second dialog
    act(() => {
      result.current.showConfirmDialog('Second Dialog', 'Second message', mockOnConfirm2)
    })

    expect(result.current.dialogState.title).toBe('Second Dialog')
    expect(result.current.dialogState.message).toBe('Second message')

    act(() => {
      result.current.handleCancel()
    })

    expect(mockOnConfirm2).not.toHaveBeenCalled()
  })

  it('should handle onConfirm function that throws error', () => {
    const { result } = renderHook(() => useConfirmDialog())
    const mockOnConfirm = vi.fn(() => {
      throw new Error('Confirm error')
    })

    act(() => {
      result.current.showConfirmDialog('Confirm', 'Message', mockOnConfirm)
    })

    expect(() => {
      act(() => {
        result.current.handleConfirm()
      })
    }).toThrow('Confirm error')

    // Dialog should remain open if onConfirm throws (allows retry or cancel)
    expect(result.current.dialogState.isOpen).toBe(true)
  })
})
