'use client'
import { useState, useEffect } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { ProgramLevelInput } from '@/lib/api/academic/programLevel'
import { useProgramLevel } from '@/hooks/academic/useProgramLevels'
import { useCurrencies } from '@/hooks/config/useCurrencies'
import { AuthError } from '@/lib/api/client'

interface EditProgrammeLevelModalProps extends ModalProps {
  programLevelGuid: string | null
  updateProgramLevel: {
    mutate: (variables: { guid: string; input: ProgramLevelInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function EditProgrammeLevelModal({ isOpen, onClose, showToast, programLevelGuid, updateProgramLevel }: EditProgrammeLevelModalProps) {
  const { data: programLevel, isLoading, isError, error } = useProgramLevel(programLevelGuid, isOpen)

  const [saved, setSaved]                 = useState(false)
  const [failure, setFailure]             = useState<string | null>(null)
  const [levelCode, setLevelCode]         = useState('')
  const [levelName, setLevelName]         = useState('')
  const [yearCount, setYearCount]         = useState('')
  const [minCreditLoad, setMinCreditLoad] = useState('')
  const [appFee, setAppFee]               = useState('')
  const [lateFee, setLateFee]             = useState('')
  const [currency, setCurrency]           = useState('')
  const [errors, setErrors]               = useState<Record<string, string>>({})

  const { data: currencies = [] } = useCurrencies()
  const currencyOptions = currencies.map(c => ({ value: String(c.intCurrency), label: `${c.currencyCode} — ${c.currencyName}` }))

  // Prefill the form once the programme level has loaded. Re-runs whenever a
  // different guid is fetched (react-query resets `programLevel` to
  // undefined when programLevelGuid changes, so stale data never leaks
  // between edits).
  useEffect(() => {
    if (!isOpen || !programLevel) return
    setLevelCode(programLevel.levelCode)
    setLevelName(programLevel.levelName)
    setYearCount(String(programLevel.yearCount))
    setMinCreditLoad(String(programLevel.minCreditLoad))
    setAppFee(String(programLevel.appFee))
    setLateFee(String(programLevel.lateFee))
    setCurrency(String(programLevel.intCurrency))
    setErrors({})
  }, [isOpen, programLevel])

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
    if (!levelCode.trim()) e.levelCode = 'Level Code is required'
    if (!levelName.trim()) e.levelName = 'Level Name is required'
    if (!yearCount || +yearCount <= 0) e.yearCount = 'Year Count must be greater than 0'
    if (!minCreditLoad || +minCreditLoad < 0) e.minCreditLoad = 'Minimum Credit Load is required'
    if (!appFee || +appFee < 0) e.appFee = 'Application Fee is required'
    if (!lateFee || +lateFee < 0) e.lateFee = 'Late Fee is required'
    if (!currency) e.currency = 'Select a currency before proceeding'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // Maps the backend's { code, errors } failure shape to an inline field
  // error where the cause is actionable right there (duplicate levelCode);
  // anything else shows the failure popup instead — same convention as
  // ProgrammeLevelModal's create-error handling.
  function handleUpdateError(error: Error) {
    const code = error instanceof AuthError ? error.code : undefined
    if (code === 'bad_request') {
      setErrors(prev => ({ ...prev, levelCode: error.message || 'A programme level with this code already exists.' }))
      return
    }
    setFailure(error.message || 'Failed to update programme level. Please try again.')
  }

  function handleUpdate() {
    if (!programLevelGuid || !validate()) return
    updateProgramLevel.mutate(
      {
        guid: programLevelGuid,
        input: {
          levelCode,
          levelName,
          yearCount: +yearCount,
          minCreditLoad: +minCreditLoad,
          appFee: +appFee,
          lateFee: +lateFee,
          intCurrency: +currency,
        },
      },
      {
        onSuccess: () => { setSaved(true); showToast('Programme Level updated successfully') },
        onError: handleUpdateError,
      },
    )
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title="Programme Level Updated!" subtitle="Your changes have been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Update Programme Level" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Programme Level"
            subtitle={error instanceof AuthError ? (error.message || 'Failed to load programme level details.') : 'Failed to load programme level details.'}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isLoading || !programLevel) {
    return (
      <div className="modal-overlay open" id="edit-alevel-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Programme Level</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading programme level details…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="edit-alevel-modal">
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-pencil"></i> Edit Programme Level — <span className="font-mono">{programLevel.levelCode}</span></div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="g2">
          <div className="fg">
            <div className="lbl">Level Code <span className="req">*</span></div>
            <input
              className="ctrl"
              placeholder="e.g. DIP"
              value={levelCode}
              onChange={e => { setLevelCode(e.target.value); clearError('levelCode') }}
              style={errors.levelCode ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.levelCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.levelCode}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Level Name <span className="req">*</span></div>
            <input
              className="ctrl"
              placeholder="e.g. Diploma"
              value={levelName}
              onChange={e => { setLevelName(e.target.value); clearError('levelName') }}
              style={errors.levelName ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.levelName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.levelName}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Year Count <span className="req">*</span></div>
            <input
              className="ctrl"
              type="number"
              placeholder="e.g. 2"
              min={1}
              max={10}
              value={yearCount}
              onChange={e => { setYearCount(e.target.value); clearError('yearCount') }}
              style={errors.yearCount ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.yearCount && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.yearCount}</p>}
          </div>

          {/* Not part of the confirmed PUT /api/v1/academic/program-levels/:guid
          payload (semCount is presumably server-derived from yearCount) —
          kept for reference until/unless the backend accepts it.
          <div className="fg"><div className="lbl">Semester Count <span className="req">*</span></div><input className="ctrl" type="number" placeholder="e.g. 6" min={1} max={20} /></div>
          */}

          <div className="fg">
            <div className="lbl">Minimum Credit Load <span className="req">*</span></div>
            <input
              className="ctrl"
              type="number"
              placeholder="e.g. 15"
              min={0}
              value={minCreditLoad}
              onChange={e => { setMinCreditLoad(e.target.value); clearError('minCreditLoad') }}
              style={errors.minCreditLoad ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.minCreditLoad && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.minCreditLoad}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Application Fee <span className="req">*</span></div>
            <input
              className="ctrl"
              type="number"
              placeholder="e.g. 50000"
              min={0}
              value={appFee}
              onChange={e => { setAppFee(e.target.value); clearError('appFee') }}
              style={errors.appFee ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.appFee && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.appFee}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Late Fee <span className="req">*</span></div>
            <input
              className="ctrl"
              type="number"
              placeholder="e.g. 10000"
              min={0}
              value={lateFee}
              onChange={e => { setLateFee(e.target.value); clearError('lateFee') }}
              style={errors.lateFee ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.lateFee && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.lateFee}</p>}
          </div>
          <div className="fg">
            <div className="lbl">Currency <span className="req">*</span></div>
            <SearchSelect
              placeholder="Select currency…"
              options={currencyOptions}
              value={currency}
              onChange={v => { setCurrency(v); clearError('currency') }}
            />
            {errors.currency && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.currency}</p>}
          </div>

          {/* Not part of the confirmed PUT /api/v1/academic/program-levels/:guid
          payload — kept for reference until/unless the backend accepts it.
          <div className="fg">
            <div className="lbl">No Internal Assessment?</div>
            <div className="tgl-group">
              <button className="tgl-btn tgl-active">No (Standard)</button>
              <button className="tgl-btn">Yes (e.g. PhD)</button>
            </div>
          </div>
          */}
        </div>
        <div className="info-box mt-3"><i className="lni lni-information"></i> These values auto-populate the Programme Master when this level is selected.</div>
        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={updateProgramLevel.isPending} onClick={handleUpdate}>
            <i className="lni lni-checkmark"></i> {updateProgramLevel.isPending ? 'Saving…' : 'Update Level'}
          </button>
        </div>
      </div>
    </div>
  )
}
