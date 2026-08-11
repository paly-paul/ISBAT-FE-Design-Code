'use client'
import { ModalProps } from '../types'
import { useProgramLevel } from '@/hooks/academic/useProgramLevels'
import { useFinanceCurrencies } from '@/hooks/finance/useFinanceCurrencies'
import { AuthError } from '@/lib/api/client'
import { FailurePopup } from './FailurePopup'

interface ViewProgrammeLevelModalProps extends ModalProps {
  programLevelGuid: string | null
}

export function ViewProgrammeLevelModal({ isOpen, onClose, programLevelGuid }: ViewProgrammeLevelModalProps) {
  const { data: programLevel, isLoading, isError, error } = useProgramLevel(programLevelGuid, isOpen)

  const { data: currencies = [] } = useFinanceCurrencies()

  if (!isOpen) return null

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Programme Level"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load programme level details.') : 'Failed to load programme level details.'}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !programLevel) {
    return (
      <div className="modal-overlay open" id="view-alevel-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-eye"></i> View Programme Level</div>
            <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading programme level details…</span>
          </div>
        </div>
      </div>
    )
  }

  const currencyName = currencies.find(c => c.currencyGuid === programLevel.currencyGuid)?.currencyCode || '—'

  return (
    <div className="modal-overlay open" id="view-alevel-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className="lni lni-eye"></i> View Programme Level — <span className="font-mono">{programLevel.levelCode}</span></div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Level Code</div>
            <div className="ctrl font-mono uppercase" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {programLevel.levelCode}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Level Name</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {programLevel.levelName}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Year Count</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {programLevel.yearCount}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Minimum Credit Load</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {programLevel.minCreditLoad}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Application Fee</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {programLevel.appFee}
            </div>
          </div>
          <div className="fg">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Late Fee</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {programLevel.lateFee}
            </div>
          </div>
          <div className="fg span2">
            <div className="lbl" style={{ color: 'var(--g500)', marginBottom: 4 }}>Currency</div>
            <div className="ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--g50)', color: 'var(--g900)', fontWeight: 500, minHeight: 34, fontSize: 13.5, border: '1.5px solid var(--g200)', borderRadius: 'var(--rxs)' }}>
              {currencyName}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <span className="flex-1"></span>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
