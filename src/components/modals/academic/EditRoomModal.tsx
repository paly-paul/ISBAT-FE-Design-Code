'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { RoomInput } from '@/lib/api/academic/room'
import { useRoom } from '@/hooks/academic/useRooms'
import { AuthError } from '@/lib/api/client'

interface EditRoomModalProps extends ModalProps {
  roomGuid: string | null
  updateRoom: {
    mutate: (variables: { guid: string; input: RoomInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditRoomModal({ isOpen, onClose, showToast, roomGuid, updateRoom }: EditRoomModalProps) {
  const { data: room, isLoading, isError, error } = useRoom(roomGuid, isOpen)

  const [saved, setSaved]       = useState(false)
  const [failure, setFailure]   = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')
  const [errors, setErrors]     = useState<Record<string, string>>({})

  // Prefill the form once the room has loaded. Re-runs whenever a different
  // guid is fetched (react-query resets `room` to undefined when roomGuid
  // changes, so stale data never leaks between edits).
  useEffect(() => {
    if (!isOpen || !room) return
    setRoomCode(room.roomCode)
    setLocation(room.location ?? '')
    setCapacity(room.capacity != null ? String(room.capacity) : '')
    setErrors({})
  }, [isOpen, room])

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null); setErrors({})
    onClose()
  }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!roomCode.trim()) e.roomCode = 'Room Code is required'
    else if (roomCode.trim().length > 10) e.roomCode = 'Room Code must not exceed 10 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleUpdateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    if (code === 'conflict') {
      setErrors(prev => ({ ...prev, roomCode: error.message || 'A room with this code already exists.' }))
      return
    }
    setFailure(error.message || 'Failed to update room. Please try again.')
  }

  function handleUpdate() {
    if (!roomGuid || !validate()) return
    // PUT is a full replacement — omitting location/capacity clears them
    // (see put-room.md), so both are always sent even when blank.
    updateRoom.mutate(
      { guid: roomGuid, input: { roomCode: roomCode.trim(), location: location.trim() || null, capacity: capacity.trim() ? Number(capacity) : null } },
      {
        onSuccess: () => { setSaved(true); showToast('Room updated successfully') },
        onError: handleUpdateError,
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Room Updated!" subtitle="The room details have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Room" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Room"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load room details.') : 'Failed to load room details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !room) {
    return (
      <div className="modal-overlay open">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Room</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading room details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Room — <span className="font-mono">{room.roomCode}</span></div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="g2">
          <div className="fg">
            <div className="lbl">Room Code <span className="req">*</span></div>
            <input
              className="ctrl font-mono uppercase"
              maxLength={10}
              value={roomCode}
              onChange={e => { setRoomCode(e.target.value); clearError('roomCode') }}
              style={errors.roomCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.roomCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.roomCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Capacity</div>
            <input className="ctrl" type="number" min={0} value={capacity} onChange={e => setCapacity(e.target.value)} />
          </div>
          <div className="fg span2">
            <div className="lbl">Location</div>
            <input className="ctrl" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateRoom.isPending} onClick={handleUpdate}>
            <i className="lni lni-checkmark"></i> {updateRoom.isPending ? 'Saving…' : 'Update Room'}
          </button>
        </div>
      </div>
    </div>
  )
}
