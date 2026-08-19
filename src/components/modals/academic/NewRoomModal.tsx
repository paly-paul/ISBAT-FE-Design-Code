'use client'
import { useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { RoomInput } from '@/lib/api/academic/room'
import { AuthError } from '@/lib/api/client'

interface NewRoomModalProps extends ModalProps {
  createRoom: {
    mutate: (input: RoomInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function NewRoomModal({ isOpen, onClose, showToast, createRoom }: NewRoomModalProps) {
  const [saved, setSaved]     = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [errors, setErrors]   = useState<Record<string, string>>({})

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null)
    setRoomCode(''); setLocation(''); setCapacity(''); setErrors({})
    onClose()
  }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!roomCode.trim()) e.roomCode = 'Room Code is required'
    // 10-char cap per post-room.md's CreateRoomCommandValidator.
    else if (roomCode.trim().length > 10) e.roomCode = 'Room Code must not exceed 10 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Only roomCode uniqueness is an actionable field error (409 conflict);
  // anything else shows the failure popup — same convention as
  // ProgrammeGroupModal's create-error handling.
  function handleCreateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    if (code === 'conflict') {
      setErrors(prev => ({ ...prev, roomCode: error.message || 'A room with this code already exists.' }))
      return
    }
    setFailure(error.message || 'Failed to add room. Please try again.')
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Room Added!" subtitle="The new room has been added successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Add Room" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-home"></i> Add Room</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g2">
          <div className="fg">
            <div className="lbl">Room Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              placeholder="e.g. RM-FCT-004"
              maxLength={10}
              value={roomCode}
              onChange={e => { setRoomCode(e.target.value); clearError('roomCode') }}
              style={errors.roomCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.roomCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.roomCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Capacity</div>
            <input className="ctrl" type="number" placeholder="e.g. 40" min={0} value={capacity} onChange={e => setCapacity(e.target.value)} />
          </div>
          <div className="fg span2">
            <div className="lbl">Location</div>
            <input className="ctrl" placeholder="e.g. Main Campus — Kampala, Block A" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={createRoom.isPending}
            onClick={() => {
              if (!validate()) return
              createRoom.mutate(
                { roomCode: roomCode.trim(), location: location.trim() || null, capacity: capacity.trim() ? Number(capacity) : null },
                {
                  onSuccess: () => { setSaved(true); showToast('Room added successfully') },
                  onError: handleCreateError,
                },
              )
            }}
          >
            <i className="lni lni-checkmark"></i> {createRoom.isPending ? 'Adding…' : 'Save Room'}
          </button>
        </div>
      </div>
    </div>
  )
}
