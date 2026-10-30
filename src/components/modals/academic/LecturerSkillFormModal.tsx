'use client'
import { useEffect, useMemo, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from '../shared/SuccessPopup'
import { FailurePopup } from '../shared/FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { MultiSelect } from '@/components/MultiSelect'
import { useEmployee, useEmployeeDropdown } from '@/hooks/employee/useEmployees'
import { useSearchSkillMastersInfinite } from '@/hooks/config/useSkillMaster'
import { useEmployeeSkills, useLecturerSkill } from '@/hooks/academic/useLecturerSkills'
import { CreateLecturerSkillInput, EMPTY_GUID, LecturerSkillItemInput, UpdateLecturerSkillsInput } from '@/lib/api/users/skills'
import { AuthError } from '@/lib/api/client'
import { flattenUniquePages } from '@/lib/pagination'
import { scrollToFirstError } from '@/lib/scrollToFirstError'

// Add and Edit both pick several skills for one faculty member (MultiSelect).
// Add attaches new skills with one shared proficiency (POST). Edit manages the
// lecturer's whole skill set through the full-list PUT: it starts from every
// skill they hold, each keeps its own proficiency, and a skill deselected
// here is removed. The faculty member is fixed in Edit, since the PUT
// replaces that person's entire set.
const PROFICIENCY_OPTIONS = [
  { value: '1', label: 'Familiar' },
  { value: '2', label: 'Proficient' },
  { value: '3', label: 'Expert' },
]

// Edit's option values: a skill the lecturer already holds is keyed by its
// stored row (so legacy rows with no catalog guid work), a newly picked one
// by its catalog skillGuid.
const ROW_PREFIX = 'row:'

interface LecturerSkillFormModalProps extends ModalProps {
  mode: 'new' | 'edit'
  lecturerSkillGuid: string | null
  createSkill: {
    mutate: (input: CreateLecturerSkillInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
  updateSkill: {
    mutate: (input: UpdateLecturerSkillsInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function LecturerSkillFormModal({ isOpen, onClose, showToast, mode, lecturerSkillGuid, createSkill, updateSkill }: LecturerSkillFormModalProps) {
  const isEdit = mode === 'edit'
  // Edit opens from one row: that record gives the faculty member, whose
  // full skill set is then loaded.
  const { data: skill, isLoading: skillLoading, isError: skillError, error: skillErr } = useLecturerSkill(lecturerSkillGuid, isOpen && isEdit)
  const employeeSkillsQ = useEmployeeSkills(skill?.employeeGuid || null, isOpen && isEdit)
  const ownedSkills = useMemo(() => employeeSkillsQ.data ?? [], [employeeSkillsQ.data])

  const [saved, setSaved]           = useState(false)
  const [failure, setFailure]       = useState<string | null>(null)
  const [employeeGuid, setEmployeeGuid] = useState('')
  const [skillIds, setSkillIds]     = useState<string[]>([])
  // Add: one proficiency for every picked skill. Edit: one per skill.
  const [proficiency, setProficiency] = useState('1')
  const [profById, setProfById]     = useState<Record<string, string>>({})
  // Labels of everything picked, for Edit's per-skill proficiency list —
  // catalog options drop out of `options` once the search changes.
  const [labels, setLabels]         = useState<Record<string, string>>({})
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [skillSearch, setSkillSearch] = useState('')
  const [committedSkillSearch, setCommittedSkillSearch] = useState('')

  const selectedEmployee = useEmployee(employeeGuid || null)
  const employeeDropdownQuery = useEmployeeDropdown(isOpen)
  const skillQuery = useSearchSkillMastersInfinite(committedSkillSearch, 20, isOpen)

  useEffect(() => {
    const timer = setTimeout(() => setCommittedSkillSearch(skillSearch.trim()), 300)
    return () => clearTimeout(timer)
  }, [skillSearch])

  useEffect(() => {
    if (!isOpen) return
    if (isEdit && skill && employeeSkillsQ.data) {
      setEmployeeGuid(skill.employeeGuid || '')
      setSkillIds(employeeSkillsQ.data.map(s => ROW_PREFIX + s.lecturerSkillGuid))
      setProfById(Object.fromEntries(employeeSkillsQ.data.map(s => [ROW_PREFIX + s.lecturerSkillGuid, String(s.proficiency || 1)])))
      setLabels(Object.fromEntries(employeeSkillsQ.data.map(s => [ROW_PREFIX + s.lecturerSkillGuid, s.skillName || 'Unnamed skill'])))
      setErrors({})
    } else if (!isEdit) {
      setEmployeeGuid(''); setSkillIds([]); setProficiency('1'); setProfById({}); setLabels({}); setErrors({})
    }
  }, [isOpen, isEdit, skill, employeeSkillsQ.data])

  const employeeOptions = useMemo(() => {
    const arr = (employeeDropdownQuery.data ?? []).map(e => ({
      value: e.employeeGuid,
      label: e.displayName,
    }))
    if (employeeGuid && !arr.some(option => option.value === employeeGuid) && selectedEmployee.data) {
      arr.unshift({ value: employeeGuid, label: selectedEmployee.data.empName })
    }
    return arr
  }, [employeeGuid, employeeDropdownQuery.data, selectedEmployee.data])

  const catalogOptions = useMemo(() => (
    flattenUniquePages(skillQuery.data?.pages ?? [], s => s.skillGuid).map(s => ({ value: s.skillGuid, label: s.skillName }))
  ), [skillQuery.data])

  // Edit: the lecturer's own skills first (selected or not, so a removed one
  // can be put back), then catalog skills they don't already hold — picking
  // a held skill again from the catalog would be a duplicate.
  const editOptions = useMemo(() => {
    const held = new Set(ownedSkills.map(s => s.skillGuid).filter(g => g && g !== EMPTY_GUID))
    return [
      ...ownedSkills.map(s => ({ value: ROW_PREFIX + s.lecturerSkillGuid, label: s.skillName || 'Unnamed skill' })),
      ...catalogOptions.filter(o => !held.has(o.value)),
    ]
  }, [ownedSkills, catalogOptions])

  if (!isOpen) return null

  function handleClose() {
    setSaved(false); setFailure(null)
    setEmployeeGuid(''); setSkillIds([]); setProficiency('1'); setProfById({}); setLabels({}); setErrors({})
    onClose()
  }

  function clearError(field: string) {
    setErrors(prev => (prev[field] ? { ...prev, [field]: '' } : prev))
  }

  function handleSkillIdsChange(vals: string[]) {
    setSkillIds(vals)
    if (isEdit) {
      const options = editOptions
      setLabels(prev => {
        const next = { ...prev }
        vals.forEach(v => { if (!next[v]) next[v] = options.find(o => o.value === v)?.label ?? v })
        return next
      })
      setProfById(prev => {
        const next = { ...prev }
        vals.forEach(v => { if (!next[v]) next[v] = '1' })
        return next
      })
    }
    clearError('skillIds')
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!employeeGuid) e.employeeGuid = 'Faculty member is required'
    // PUT rejects an empty list; removing every skill is done with Delete.
    if (skillIds.length === 0) e.skillIds = isEdit ? 'Keep at least one skill — use Delete in the list to remove the last one' : 'At least one skill / subject area is required'
    setErrors(e)
    scrollToFirstError(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    if (isEdit) {
      const byRow = new Map(ownedSkills.map(s => [ROW_PREFIX + s.lecturerSkillGuid, s]))
      const skills: LecturerSkillItemInput[] = skillIds.map(id => {
        const prof = Number(profById[id] ?? '1')
        const row = byRow.get(id)
        return row
          ? { lecturerSkillGuid: row.lecturerSkillGuid, skillGuid: row.skillGuid || EMPTY_GUID, proficiency: prof }
          : { skillGuid: id, proficiency: prof }
      })
      const removed = ownedSkills.length - skills.filter(s => s.lecturerSkillGuid).length
      updateSkill.mutate(
        { employeeGuid, skills },
        {
          onSuccess: () => { setSaved(true); showToast(removed > 0 ? `Skills updated · ${removed} removed` : 'Skills updated successfully') },
          onError: (error: Error) => setFailure(error.message || 'Failed to update skills. Please try again.'),
        },
      )
    } else {
      const input: CreateLecturerSkillInput = { employeeGuid, skillGuids: skillIds, proficiency: Number(proficiency) }
      createSkill.mutate(
        input,
        {
          onSuccess: () => { setSaved(true); showToast(`${skillIds.length} skill${skillIds.length !== 1 ? 's' : ''} added successfully`) },
          onError: (error: Error) => setFailure(error.message || 'Failed to add skill(s). Please try again.'),
        },
      )
    }
  }

  const isPending = isEdit ? updateSkill.isPending : createSkill.isPending
  const editLoading = skillLoading || employeeSkillsQ.isLoading || !skill || !employeeSkillsQ.data
  const loadError = skillError || employeeSkillsQ.isError
  const loadErr = skillErr ?? employeeSkillsQ.error
  // Edit: skills the lecturer holds now that would be dropped on save.
  const removedCount = isEdit ? ownedSkills.filter(s => !skillIds.includes(ROW_PREFIX + s.lecturerSkillGuid)).length : 0

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup
            title={isEdit ? 'Skills Updated!' : 'Skill Saved!'}
            subtitle={isEdit ? "The lecturer's skills have been saved." : "The skill(s) have been added to the lecturer's profile."}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title={isEdit ? "Couldn't Update Skills" : "Couldn't Add Skill"} subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  if (isEdit && loadError) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup
            title="Couldn't Load Skills"
            subtitle={loadErr instanceof AuthError ? (loadErr.message || "Failed to load the lecturer's skills.") : "Failed to load the lecturer's skills."}
            onClose={handleClose}
          />
        </div>
      </div>
    )
  }

  if (isEdit && editLoading) {
    return (
      <div className="modal-overlay open" id="edit-lecturer-skill-modal">
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-hdr modal-hdr-blue">
            <div className="modal-title"><i className="lni lni-pencil"></i> Edit Skills</div>
            <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
            <span style={{ color: 'var(--g400)' }}>Loading skills…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id={isEdit ? 'edit-lecturer-skill-modal' : 'add-skill-modal'}>
      <div className="modal modal-md" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr modal-hdr-blue">
          <div className="modal-title"><i className={`lni ${isEdit ? 'lni-pencil' : 'lni-bulb'}`}></i> {isEdit ? 'Edit Skills' : 'Add Skill'}</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div>
          <div className="fg">
            <div className="lbl">Faculty Member <span className="req">*</span></div>
            <SearchSelect
              placeholder="— Select faculty member —"
              options={employeeOptions}
              value={employeeGuid}
              isLoading={employeeDropdownQuery.isLoading}
              onChange={v => { setEmployeeGuid(v); clearError('employeeGuid') }}
              disabled={isEdit}
            />
            {errors.employeeGuid && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.employeeGuid}</p>}
          </div>

          <div className="sec-divider">Skills / Subject Areas</div>
          <div className="fg" style={skillIds.length === 0 ? { marginBottom: 0 } : undefined}>
            <div className="lbl">Skills <span className="req">*</span></div>
            <MultiSelect
              placeholder="— Select skills —"
              options={isEdit ? editOptions : catalogOptions}
              value={skillIds}
              onSearch={setSkillSearch}
              isLoading={skillQuery.isLoading}
              hasNextPage={skillQuery.hasNextPage}
              isFetchingNextPage={skillQuery.isFetchingNextPage}
              onLoadMore={() => skillQuery.fetchNextPage()}
              onChange={handleSkillIdsChange}
            />
            {errors.skillIds && <p className="field-err" style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{errors.skillIds}</p>}
            {removedCount > 0 && (
              <div style={{ fontSize: 12, color: 'var(--amber)', marginTop: 6 }}>
                <i className="lni lni-warning"></i> {removedCount} skill{removedCount !== 1 ? 's' : ''} the lecturer has now will be removed on save.
              </div>
            )}
          </div>

          {skillIds.length > 0 && (isEdit ? (
            <div className="fg" style={{ marginBottom: 0 }}>
              <div className="lbl">Proficiency</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {skillIds.map(id => (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: 'var(--g700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={labels[id]}>
                      {labels[id] ?? id}
                    </span>
                    <SearchSelect
                      style={{ width: 160, flexShrink: 0 }}
                      options={PROFICIENCY_OPTIONS}
                      value={profById[id] ?? '1'}
                      onChange={v => setProfById(prev => ({ ...prev, [id]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="fg" style={{ marginBottom: 0 }}>
              <div className="lbl">Proficiency</div>
              <div style={{ fontSize: 12, color: 'var(--g400)', marginBottom: 6 }}>
                Applies to all {skillIds.length} selected skill{skillIds.length !== 1 ? 's' : ''}.
              </div>
              <SearchSelect
                style={{ width: 160 }}
                options={PROFICIENCY_OPTIONS}
                value={proficiency}
                onChange={setProficiency}
              />
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <button className="btn btn-primary" disabled={isPending} onClick={handleSubmit}>
            <i className="lni lni-checkmark"></i> {isPending ? (isEdit ? 'Updating…' : 'Saving…') : (isEdit ? 'Update Skills' : 'Save Skill')}
          </button>
        </div>
      </div>
    </div>
  )
}
