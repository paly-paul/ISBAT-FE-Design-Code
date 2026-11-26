'use client'
import { ModalProps } from '../types'
import { useProgramMasterFullDetails } from '@/hooks/academic/useProgramMaster'

// Read-only list of the specializations assigned to the selected programme
// (streamGuids / streamNames on full-details, which carry no code), per
// Program_Master_Change_Requests_Final.md's Home Page "Specialization"
// action. Managing them still happens on the Programme Details step (Step 1's
// Specialization(s) multi-select), reached through Edit.
//
// A short name-only list, so it's shown as a list rather than a one-column
// table: the programme it belongs to and the count up top, then one row per
// specialization.

interface SpecializationModalProps extends ModalProps {
  programGuid: string | null
  programName?: string
}

export function SpecializationModal({ isOpen, onClose, programGuid, programName }: SpecializationModalProps) {
  const { data: program, isLoading, isError } = useProgramMasterFullDetails(programGuid, isOpen)
  const specializations = (program?.streamGuids ?? []).map((guid, i) => ({ guid, name: program?.streamNames?.[i] || 'â€”' }))

  if (!isOpen) return null

  const count = specializations.length
  const ready = !isLoading && !isError

  return (
    <div className="modal-overlay open" id="specialization-modal">
      <div className="modal modal-md" role="dialog" aria-modal="true" aria-labelledby="specialization-modal-title" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title" id="specialization-modal-title"><i className="lni lni-target" aria-hidden="true"></i> Specializations</div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><i className="lni lni-close" aria-hidden="true"></i></button>
        </div>

        {/* Which programme this is, and how many â€” so a long programme name
            wraps here instead of being cut off in the header. */}
        <div className="flex items-start justify-between gap-3" style={{ marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div className="text-g500" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Programme</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--g900)', lineHeight: 1.35, overflowWrap: 'anywhere' }}>
              {programName || 'â€”'}
            </div>
            {program?.programCode && <div className="font-mono text-g500" style={{ fontSize: 12, marginTop: 2 }}>{program.programCode}</div>}
          </div>
          {ready && (
            <span className={`badge ${count ? 'badge-blue' : 'badge-grey'} shrink-0`} style={{ marginTop: 2 }}>
              {count} {count === 1 ? 'specialization' : 'specializations'}
            </span>
          )}
        </div>

        <div style={{ border: '1px solid var(--g200)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
          {isLoading ? (
            <div role="status" aria-label="Loading specializations">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-3" style={{ padding: '12px 14px', borderTop: i ? '1px solid var(--g100)' : undefined }}>
                  <span className="animate-pulse" style={{ width: 30, height: 30, borderRadius: 'var(--rxs)', background: 'var(--g100)' }} />
                  <span className="animate-pulse" style={{ height: 12, width: `${55 - i * 12}%`, borderRadius: 6, background: 'var(--g100)' }} />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center" style={{ padding: '28px 16px' }} role="alert">
              <i className="lni lni-warning" aria-hidden="true" style={{ fontSize: 24, color: 'var(--red)' }}></i>
              <div style={{ fontWeight: 700, color: 'var(--g900)', marginTop: 8 }}>Couldn&apos;t load specializations</div>
              <div className="text-g500" style={{ fontSize: 13, marginTop: 2 }}>Close this and try again.</div>
            </div>
          ) : count === 0 ? (
            <div className="text-center" style={{ padding: '28px 16px' }}>
              <i className="lni lni-target" aria-hidden="true" style={{ fontSize: 24, color: 'var(--g400)' }}></i>
              <div style={{ fontWeight: 700, color: 'var(--g900)', marginTop: 8 }}>No specializations yet</div>
              <div className="text-g500" style={{ fontSize: 13, marginTop: 2 }}>Add them from Edit â†’ Programme Details.</div>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 320, overflowY: 'auto' }}>
              {specializations.map((s, i) => (
                <li
                  key={s.guid}
                  className="flex items-center gap-3"
                  style={{ padding: '11px 14px', borderTop: i ? '1px solid var(--g100)' : undefined }}
                >
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 30, height: 30, borderRadius: 'var(--rxs)', background: 'var(--b50)', color: 'var(--b600)', fontSize: 14 }}
                  >
                    <i className="lni lni-target"></i>
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--g900)', overflowWrap: 'anywhere' }}>{s.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
