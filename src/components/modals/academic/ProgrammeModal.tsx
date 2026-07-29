'use client'
import { useEffect, useState } from 'react'
import { ModalProps } from '../types'
import { SuccessPopup } from './SuccessPopup'
import { FailurePopup } from './FailurePopup'
import { SearchSelect } from '@/components/SearchSelect'
import { ProgramMasterInput } from '@/lib/api/academic/programMaster'
import { useProgramLevels } from '@/hooks/academic/useProgramLevels'
import { useProgramGroups } from '@/hooks/academic/useProgramGroups'
import { useFaculties } from '@/hooks/config/useFaculties'
import { useCurrencies } from '@/hooks/finance/useCurrencies'
import { useFinanceCurrencies } from '@/hooks/finance/useFinanceCurrencies'
import { useStreams } from '@/hooks/config/useStreams'
import { useCourseUnits } from '@/hooks/academic/useCourseUnits'
import { useIntakes } from '@/hooks/academic/useIntakes'
import { useUnitTypes } from '@/hooks/config/useUnitTypes'
import { useUnitCategories } from '@/hooks/config/useUnitCategories'
import { useLedgers } from '@/hooks/finance/useLedgers'
import { ProgramUnitInput, FeeStructureInput, ProgramUnitUpdateInput, FeeStructureUpdateInput, ProgramMasterUpdateInput, useProgramMasterFullDetails } from '@/hooks/academic/useProgramMaster'
import { AuthError } from '@/lib/api/client'

// Toggle between UGX and USD.
const LOCAL_OR_FOREIGN_OPTS = [
  { value: 'false', label: 'UGX' },
  { value: 'true', label: 'USD' },
]

// Map discount types to the API values.
const CALC_TYPES = [
  { value: '1', label: 'Amount' },
  { value: '2', label: 'Percentage' },
]

const NUM_SEMS = 6

// SearchSelect works with strings, so store the selected currency id as text.
// currencyGuid is the edit-mode counterpart of currency (intCurrency) — Update
// wants a real currencyGuid on FeeLines where Create wants intCurrency, see
// the note on ProgramMasterUpdateInput in lib/api/academic/programMaster.ts.
type FeeItem     = { id: number; title: string; amount: string; currency: string; currencyGuid: string; ledger: string }
type SemFees     = FeeItem[][]
type CUItem      = { id: number; guid: string; code: string; name: string; credits: number; unitType: string; unitCat: string }
type SemUnits    = CUItem[][]
// type SpecRow     = { id: number; value: string } — only used by the commented-out multi-specialization list below
// All fields here map onto FeeStructureInput on submit (see
// handleFinalSubmit): feeCode→feeCode, description→feeDesc,
// localOrForeign→localOrForeign, lateralEntryFee/-Currency→lef/lec,
// creditExemptionFee/-Currency→cef/cec,
// aptechCreditExemptionFee/-Currency→ace/acec,
// discountType/discountAmount→calcType/amtPer, intakeCode→intakeCode, and
// semFees (the per-semester Fee Title/Amount/Currency/Ledger accordion) is
// the source of FeeStructureInput.feeLines.
type FeeStructure = {
  id: number
  feeCode: string
  description: string
  localOrForeign: string
  intakeCode: string
  // Edit-mode counterpart of intakeCode — Update wants a real intakeGuid on
  // each FeeStructure where Create wants intakeCode, see the note on
  // ProgramMasterUpdateInput in lib/api/academic/programMaster.ts.
  intakeGuid: string
  discountType: string
  discountAmount: string
  lateralEntryFee: string
  lateralEntryFeeCurrency: string
  creditExemptionFee: string
  creditExemptionFeeCurrency: string
  aptechCreditExemptionFee: string
  aptechCreditExemptionFeeCurrency: string
  semFees: SemFees
}

function blankItem(id: number): FeeItem {
  return { id, title: '', amount: '', currency: '', currencyGuid: '', ledger: '' }
}

const DEFAULT_SEM_FEES: SemFees = Array.from({ length: NUM_SEMS }, (_, i) =>
  i === 0
    ? [
        { id: 1, title: 'Tuition Fee',       amount: '750000', currency: '', currencyGuid: '', ledger: '' },
        { id: 2, title: 'Semester Entry Fee', amount: '50000',  currency: '', currencyGuid: '', ledger: '' },
      ]
    : []
)

function blankFeeStructure(id: number): FeeStructure {
  return {
    id,
    feeCode: '',
    description: '',
    localOrForeign: 'false',
    intakeCode: '',
    intakeGuid: '',
    discountType: '1',
    discountAmount: '',
    lateralEntryFee: '',
    lateralEntryFeeCurrency: '',
    creditExemptionFee: '',
    creditExemptionFeeCurrency: '',
    aptechCreditExemptionFee: '',
    aptechCreditExemptionFeeCurrency: '',
    semFees: DEFAULT_SEM_FEES,
  }
}

function makeDefaultFeeStructures(): FeeStructure[] {
  return [blankFeeStructure(1)]
}

// Keep the old course-unit options only as a reference; the live list now comes from the hook.
// const COURSE_UNIT_OPTS = [
//   { value: 'IT101', label: 'IT101 — Introduction to Programming (3 cr)',    code: 'IT101', name: 'Introduction to Programming',    credits: 3 },
//   { value: 'IT102', label: 'IT102 — Data Structures and Algorithms (3 cr)', code: 'IT102', name: 'Data Structures and Algorithms', credits: 3 },
//   { value: 'IT103', label: 'IT103 — Database Management Systems (3 cr)',    code: 'IT103', name: 'Database Management Systems',    credits: 3 },
//   { value: 'IT104', label: 'IT104 — Computer Networks (3 cr)',              code: 'IT104', name: 'Computer Networks',              credits: 3 },
//   { value: 'IT201', label: 'IT201 — Operating Systems (3 cr)',              code: 'IT201', name: 'Operating Systems',              credits: 3 },
//   { value: 'IT202', label: 'IT202 — Software Engineering (3 cr)',           code: 'IT202', name: 'Software Engineering',           credits: 3 },
//   { value: 'IT203', label: 'IT203 — Web Development (3 cr)',                code: 'IT203', name: 'Web Development',                credits: 3 },
//   { value: 'IT204', label: 'IT204 — Artificial Intelligence (3 cr)',        code: 'IT204', name: 'Artificial Intelligence',        credits: 3 },
//   { value: 'BA101', label: 'BA101 — Business Communication (2 cr)',         code: 'BA101', name: 'Business Communication',         credits: 2 },
//   { value: 'BA102', label: 'BA102 — Entrepreneurship (2 cr)',               code: 'BA102', name: 'Entrepreneurship',               credits: 2 },
//   { value: 'MT101', label: 'MT101 — Mathematics for Computing (3 cr)',      code: 'MT101', name: 'Mathematics for Computing',      credits: 3 },
//   { value: 'MT102', label: 'MT102 — Statistics and Probability (3 cr)',     code: 'MT102', name: 'Statistics and Probability',     credits: 3 },
// ]

let nextId        = 100
let nextCUId      = 200
// let nextSpecId    = 300 — only used by the commented-out multi-specialization list below
let nextFeeStructId = 10

// const SPEC_OPTS = [
//   'Computer Science',
//   'Information Technology',
//   'Software Engineering',
//   'Networking & Security',
//   'Data Science & Analytics',
//   'Business Administration',
//   'Finance & Accounting',
//   'Human Resource Management',
//   'Marketing Management',
//   'Civil Engineering',
//   'Electrical Engineering',
// ]

interface ProgrammeModalProps extends ModalProps {
  mode?: 'edit'
  // Which programme is being edited — only relevant when mode === 'edit'.
  programGuid?: string | null
  // GetFullDetails.bru doesn't return a currency for the programme, but
  // GetByGuid.bru's own docs confirm it returns "the same shape as the
  // list" — and the list's ProgramMaster.currencyGuid, while nullable, is
  // already loaded in page.tsx. Passed in from there rather than issuing a
  // second network call for data already in memory.
  initialCurrencyGuid?: string | null
  createProgramMaster: {
    mutate: (input: ProgramMasterInput, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
  updateProgramMasterComplete?: {
    mutate: (vars: { programGuid: string; input: ProgramMasterUpdateInput }, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
    isPending: boolean
  }
}

export function ProgrammeModal({ isOpen, onClose, showToast, mode, programGuid, initialCurrencyGuid, createProgramMaster, updateProgramMasterComplete }: ProgrammeModalProps) {
  const [step, setStep]           = useState(1)
  const [saved, setSaved]         = useState(false)
  const [failure, setFailure]     = useState<string | null>(null)
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(makeDefaultFeeStructures)
  const [activeFeeIdx, setActiveFeeIdx]   = useState(0)
  const [feeAccordion, setFeeAccordion]   = useState(0)
  const [semUnits, setSemUnits]     = useState<SemUnits>(() => Array.from({ length: NUM_SEMS }, () => []))
  const [pendingSel, setPendingSel] = useState<string[]>(() => Array(NUM_SEMS).fill(''))
  const [activeAcc, setActiveAcc]   = useState<number>(0)
  // The create payload only accepts one stream selection, so the old multi-select list is no longer used.
  // const [specs, setSpecs]           = useState<SpecRow[]>([])

  // These are the fields accepted by the programme create API.
  const [programCode, setProgramCode] = useState('')
  const [programName, setProgramName] = useState('')
  const [programGroupGuid, setProgramGroupGuid] = useState('')
  const [programLevelGuid, setProgramLevelGuid] = useState('')
  const [facultyGuid, setFacultyGuid] = useState('')
  const [appFee, setAppFee] = useState('')
  const [lateFee, setLateFee] = useState('')
  const [currencyCode, setCurrencyCode] = useState('')
  // Edit-mode counterpart of currencyCode — Update wants a real currencyGuid
  // where Create wants Currency.intCurrency. Prefilled from initialCurrencyGuid
  // (the list row's own currencyGuid) below, not from full-details, which
  // doesn't return one — but that list field has been observed null in every
  // real sample seen so far, so this may still come up empty and need picking.
  const [currencyGuid, setCurrencyGuid] = useState('')

  useEffect(() => {
    if (isOpen && mode === 'edit') setCurrencyGuid(initialCurrencyGuid ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, initialCurrencyGuid])
  const [unitCount, setUnitCount] = useState('')
  const [dateAcc, setDateAcc] = useState('')
  const [streamGuid, setStreamGuid] = useState('')
  const [intakeGuid, setIntakeGuid] = useState('')
  const [pgmStatus, setPgmStatus] = useState(true)
  const [noIa, setNoIa] = useState(false)
  const [accLetterFile, setAccLetterFile] = useState<File | null>(null)
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({})

  const { data: programLevels = [] } = useProgramLevels()
  const programLevelOptions = programLevels.map(p => ({ value: p.programLevelGuid, label: p.levelName }))
  const selectedProgramLevel = programLevels.find(p => p.programLevelGuid === programLevelGuid)

  const { data: programGroups = [] } = useProgramGroups()
  const programGroupOptions = programGroups.map(g => ({ value: g.programGroupGuid, label: `${g.groupCode} — ${g.groupName}` }))

  const { data: faculties = [] } = useFaculties()
  const facultyOptions = faculties.map(f => ({ value: f.facultyGuid, label: `${f.facultyCode} — ${f.facultyName}` }))
  const selectedFaculty = faculties.find(f => f.facultyGuid === facultyGuid)

  const { data: currencies = [] } = useCurrencies()
  // Every currency field on this payload (this Step 1 picker included) takes
  // Currency.intCurrency (a number), not the currency code — see the
  // ProgramMasterInput/FeeStructureInput comments for why.
  const currencyIntOptions = currencies.map(c => ({ value: String(c.intCurrency), label: `${c.currencyCode} — ${c.currencyName}` }))

  // Edit-only: Update wants a real currencyGuid, confirmed via the "three
  // currency guid spaces" gotcha elsewhere in this app — useFinanceCurrencies()
  // carries the real one, unlike useCurrencies() (Currency Master) above.
  const { data: financeCurrencies = [] } = useFinanceCurrencies()
  const financeCurrencyOptions = financeCurrencies.map(c => ({ value: c.currencyGuid, label: `${c.currencyCode} — ${c.currencyName}` }))

  const { data: streams = [] } = useStreams()
  const streamOptions = streams.map(s => ({ value: s.streamGuid, label: `${s.streamCode} — ${s.streamName}` }))

  const { data: courseUnits = [] } = useCourseUnits()
  const courseUnitOptions = courseUnits.map(u => ({
    value: u.courseUnitGuid,
    label: `${u.courseUnitCode} — ${u.courseUnitName} (${u.maxCredits} cr)`,
    code: u.courseUnitCode,
    name: u.courseUnitName,
    credits: u.maxCredits,
  }))

  // Unit Type / Unit Category dropdowns in Course Unit Allocation — real
  // masters from src/app/config/unit-type & unit-category. ProgramUnitInput.
  // unitType/unitCat send the guid directly (unitTypeGuid/unitCatGuid), the
  // same guid-based convention used elsewhere in this backend (e.g.
  // programLevelGuid, courseUnitRepetitionGuid).
  const { data: unitTypes = [] } = useUnitTypes()
  const unitTypeOptions = unitTypes.map(t => ({ value: t.unitTypeGuid, label: t.unitTypeName }))

  const { data: unitCategories = [] } = useUnitCategories()
  const unitCategoryOptions = unitCategories.map(c => ({ value: c.unitCatGuid, label: c.unitCatName }))

  const { data: ledgers = [] } = useLedgers()
  const ledgerOptions = ledgers.map(l => ({ value: l.ledgerGuid, label: l.ledgerName }))

  const { data: intakes = [] } = useIntakes()
  // Per-fee-structure Intake picker (kept as a live-but-unsent field —
  // see FeeStructure type) uses intakeCode; the top-level programme Intake
  // (intakeGuid on ProgramMasterInput) uses the real intakeGuid instead.
  const intakeOptions = intakes.map(i => ({ value: String(i.intakeCode), label: `${i.intakeCode} — ${i.description}` }))
  const programIntakeOptions = intakes.map(i => ({ value: i.intakeGuid, label: `${i.intakeCode} — ${i.description}` }))

  // Full course-unit/fee-structure breakdown for the programme being edited —
  // update-complete fully replaces both collections, so this is required to
  // prefill Steps 2/3 before saving, not just a nicety. See the note on
  // ProgramMasterFullDetails in lib/api/academic/programMaster.ts.
  const { data: fullDetails } = useProgramMasterFullDetails(programGuid ?? null, isOpen && mode === 'edit' && !!programGuid)

  useEffect(() => {
    if (mode !== 'edit' || !fullDetails) return

    setProgramCode(fullDetails.programCode)
    setProgramName(fullDetails.programName)
    setProgramGroupGuid(fullDetails.programGroupGuid)
    setProgramLevelGuid(fullDetails.programLevelGuid)
    setFacultyGuid(fullDetails.facultyGuid)
    setAppFee(String(fullDetails.appFee))
    setLateFee(String(fullDetails.lateFee))
    setUnitCount(String(fullDetails.unitCount))
    setDateAcc(fullDetails.dateAcc ? fullDetails.dateAcc.slice(0, 10) : '')
    // full-details returns streamGuids (plural) but update-complete only
    // accepts one — same "create only accepts one streamGuid" limitation
    // documented on ProgramMasterInput.
    setStreamGuid(fullDetails.streamGuids[0] ?? '')
    setIntakeGuid(fullDetails.intakeGuid ?? '')
    setPgmStatus(fullDetails.pgmStatus)
    setNoIa(fullDetails.noIa)

    const units: SemUnits = Array.from({ length: NUM_SEMS }, () => [])
    fullDetails.programUnits.forEach(u => {
      const si = u.semCode - 1
      if (si < 0 || si >= NUM_SEMS) return
      const cu = courseUnits.find(c => c.courseUnitGuid === u.courseUnitGuid)
      units[si].push({
        id: nextCUId++,
        guid: u.courseUnitGuid,
        code: u.courseUnitCode,
        name: u.courseUnitName,
        credits: cu?.maxCredits ?? 0,
        unitType: u.unitTypeGuid,
        unitCat: u.unitCatGuid,
      })
    })
    setSemUnits(units)

    const structures: FeeStructure[] = fullDetails.feeStructures.length > 0
      ? fullDetails.feeStructures.map(s => {
          const semFees: SemFees = Array.from({ length: NUM_SEMS }, () => [])
          s.feeLines.forEach(l => {
            const si = l.semCode - 1
            if (si < 0 || si >= NUM_SEMS) return
            semFees[si].push({
              id: nextId++,
              title: '',
              amount: String(l.amount),
              currency: '',
              currencyGuid: l.currencyGuid,
              ledger: l.ledgerGuid,
            })
          })
          return {
            id: nextFeeStructId++,
            feeCode: s.feeCode,
            description: s.feeDesc,
            localOrForeign: String(s.localOrForeign),
            intakeCode: '',
            intakeGuid: s.intakeGuid ?? '',
            discountType: String(s.calcType),
            discountAmount: s.amtPer != null ? String(s.amtPer) : '',
            lateralEntryFee: s.lef != null ? String(s.lef) : '',
            lateralEntryFeeCurrency: s.lec != null ? String(s.lec) : '',
            creditExemptionFee: s.cef != null ? String(s.cef) : '',
            creditExemptionFeeCurrency: s.cec != null ? String(s.cec) : '',
            aptechCreditExemptionFee: s.ace != null ? String(s.ace) : '',
            aptechCreditExemptionFeeCurrency: s.acec != null ? String(s.acec) : '',
            semFees,
          }
        })
      : makeDefaultFeeStructures()
    setFeeStructures(structures)
    setActiveFeeIdx(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullDetails, mode])

  function selectProgramLevel(guid: string) {
    setProgramLevelGuid(guid)
    if (step1Errors.programLevelGuid) setStep1Errors(p => ({ ...p, programLevelGuid: '' }))
    const level = programLevels.find(p => p.programLevelGuid === guid)
    if (level) {
      setAppFee(String(level.appFee))
      setLateFee(String(level.lateFee))
    }
  }

  function validateStep1() {
    const e: Record<string, string> = {}
    if (!programCode.trim()) e.programCode = 'Programme Code is required'
    if (!programName.trim()) e.programName = 'Programme Name is required'
    if (!programGroupGuid) e.programGroupGuid = 'Please select a Programme Group'
    if (!programLevelGuid) e.programLevelGuid = 'Please select a Programme Level'
    if (!facultyGuid) e.facultyGuid = 'Please select a Faculty'
    if (!appFee) e.appFee = 'Application Fee is required'
    if (!lateFee) e.lateFee = 'Late Fee is required'
    if (mode === 'edit' ? !currencyGuid : !currencyCode) e.currencyCode = 'Please select a Currency'
    if (!unitCount) e.unitCount = 'No. of Course Units is required'
    if (!dateAcc) e.dateAcc = 'Accreditation Date is required'
    if (!streamGuid) e.streamGuid = 'Please select a Specialization'
    if (!intakeGuid) e.intakeGuid = 'Please select an Intake'
    setStep1Errors(e)
    return Object.keys(e).length === 0
  }

  if (!isOpen) return null

  const activeFeeStruct = feeStructures[activeFeeIdx]

  function feeStructComplete(s: FeeStructure) {
    return !!(s.feeCode.trim() && s.description.trim())
  }
  // Every fee item needs a currency and ledger selected; otherwise the payload sends 0/empty and the backend rejects it.
  function feeStructHasCurrencyGaps(s: FeeStructure) {
    return s.semFees.some(items => items.some(item => (mode === 'edit' ? !item.currencyGuid : !item.currency)))
  }
  function feeStructHasLedgerGaps(s: FeeStructure) {
    return s.semFees.some(items => items.some(item => !item.ledger))
  }
  const activeFeeComplete = feeStructComplete(activeFeeStruct)
  const anyCurrencyGaps   = feeStructures.some(feeStructHasCurrencyGaps)
  const anyLedgerGaps     = feeStructures.some(feeStructHasLedgerGaps)
  const allFeeComplete    = feeStructures.every(feeStructComplete) && !anyCurrencyGaps && !anyLedgerGaps
  const isSaving = mode === 'edit' ? !!updateProgramMasterComplete?.isPending : createProgramMaster.isPending

  function handleClose() {
    setStep(1); setSaved(false); setFailure(null)
    setFeeStructures(makeDefaultFeeStructures())
    setActiveFeeIdx(0); setFeeAccordion(0)
    setSemUnits(Array.from({ length: NUM_SEMS }, () => []))
    setPendingSel(Array(NUM_SEMS).fill(''))
    setProgramCode(''); setProgramName(''); setProgramGroupGuid(''); setProgramLevelGuid('')
    setFacultyGuid(''); setAppFee(''); setLateFee(''); setCurrencyCode(''); setCurrencyGuid(''); setUnitCount('')
    setDateAcc(''); setStreamGuid(''); setIntakeGuid(''); setPgmStatus(true); setNoIa(false); setAccLetterFile(null); setStep1Errors({})
    onClose()
  }

  function handleFinalSubmit() {
    if (mode === 'edit') {
      if (!programGuid || !updateProgramMasterComplete) return
      if (!validateStep1()) { setStep(1); return }

      const programUnits: ProgramUnitUpdateInput[] = semUnits.flatMap((units, si) =>
        units.map(u => ({
          semCode: si + 1,
          courseUnitGuid: u.guid,
          streamGuid,
          unitTypeGuid: u.unitType,
          unitCatGuid: u.unitCat,
          flag: 0,
        }))
      )

      const feeStructuresPayload: FeeStructureUpdateInput[] = feeStructures.map(s => ({
        feeCode: s.feeCode,
        feeDesc: s.description,
        status: true,
        localOrForeign: s.localOrForeign === 'true',
        lef: s.lateralEntryFee ? +s.lateralEntryFee : null,
        cef: s.creditExemptionFee ? +s.creditExemptionFee : null,
        ace: s.aptechCreditExemptionFee ? +s.aptechCreditExemptionFee : null,
        lec: s.lateralEntryFeeCurrency ? +s.lateralEntryFeeCurrency : null,
        cec: s.creditExemptionFeeCurrency ? +s.creditExemptionFeeCurrency : null,
        acec: s.aptechCreditExemptionFeeCurrency ? +s.aptechCreditExemptionFeeCurrency : null,
        calcType: +s.discountType || 1,
        amtPer: s.discountAmount ? +s.discountAmount : null,
        intakeGuid: s.intakeGuid || null,
        feeLines: s.semFees.flatMap((items, si) =>
          items.map(item => {
            const ledger = ledgers.find(l => l.ledgerGuid === item.ledger)
            return {
              semCode: si + 1,
              ledgerGuid: item.ledger,
              currencyGuid: item.currencyGuid,
              ledgerNum: ledger?.ledgerNum ?? 0,
              amount: +item.amount || 0,
            }
          })
        ),
      }))

      const updateInput: ProgramMasterUpdateInput = {
        programCode, programName, programLevelGuid, pgmStatus, noIa, programGroupGuid,
        unitCount: +unitCount || 0, appFee: +appFee || 0, lateFee: +lateFee || 0,
        facultyGuid, currencyGuid, dateAcc: `${dateAcc}T00:00:00`, streamGuid, intakeGuid,
        programUnits, feeStructures: feeStructuresPayload, accLetterFile,
      }

      updateProgramMasterComplete.mutate(
        { programGuid, input: updateInput },
        {
          onSuccess: () => { setSaved(true); showToast('Programme updated successfully') },
          onError: (error: Error) => {
            const code = error instanceof AuthError ? error.code : undefined
            setFailure(error.message || `Failed to update programme${code ? ` (${code})` : ''}. Please try again.`)
          },
        },
      )
      return
    }

    if (!validateStep1()) { setStep(1); return }

    const programUnits: ProgramUnitInput[] = semUnits.flatMap((units, si) =>
      units.map(u => ({
        semCode: si + 1,
        courseUnitGuid: u.guid,
        // The sample payload uses the same specialization for the whole programme.
        streamGuid,
        unitType: u.unitType,
        unitCat: u.unitCat,
        flag: 0,
      }))
    )

    const feeStructuresPayload: FeeStructureInput[] = feeStructures.map(s => ({
      feeCode: s.feeCode,
      feeDesc: s.description,
      // No UI toggle for this yet — every structure created here defaults
      // to active.
      status: true,
      localOrForeign: s.localOrForeign === 'true',
      lef: s.lateralEntryFee ? +s.lateralEntryFee : null,
      cef: s.creditExemptionFee ? +s.creditExemptionFee : null,
      ace: s.aptechCreditExemptionFee ? +s.aptechCreditExemptionFee : null,
      lec: s.lateralEntryFeeCurrency ? +s.lateralEntryFeeCurrency : null,
      cec: s.creditExemptionFeeCurrency ? +s.creditExemptionFeeCurrency : null,
      acec: s.aptechCreditExemptionFeeCurrency ? +s.aptechCreditExemptionFeeCurrency : null,
      calcType: +s.discountType || 1,
      amtPer: s.discountAmount ? +s.discountAmount : null,
      intakeCode: s.intakeCode ? +s.intakeCode : null,
      feeLines: s.semFees.flatMap((items, si) =>
        items.map(item => {
          const ledger = ledgers.find(l => l.ledgerGuid === item.ledger)
          return {
            intLedger: ledger?.intLedger ?? 0,
            ledgerGuid: item.ledger,
            ledgerNum: ledger?.ledgerNum ?? 0,
            intCurrency: +item.currency || 0,
            semCode: si + 1,
            amount: +item.amount || 0,
          }
        })
      ),
    }))

    createProgramMaster.mutate(
      {
        programCode,
        programName,
        programLevelGuid,
        pgmStatus,
        noIa,
        programGroupGuid,
        unitCount: +unitCount || 0,
        appFee: +appFee || 0,
        lateFee: +lateFee || 0,
        facultyGuid,
        currencyCode: +currencyCode || 0,
        dateAcc: `${dateAcc}T00:00:00`,
        streamGuid,
        intakeGuid,
        programUnits,
        feeStructures: feeStructuresPayload,
        accLetterFile,
      },
      {
        onSuccess: () => { setSaved(true); showToast('Programme saved successfully') },
        onError: (error: Error) => {
          const code = error instanceof AuthError ? error.code : undefined
          setFailure(error.message || `Failed to save programme${code ? ` (${code})` : ''}. Please try again.`)
        },
      },
    )
  }

  // Old repeatable multi-specialization helpers — superseded by the single
  // streamGuid SearchSelect (see selectProgramLevel/streamGuid state above).
  // function addSpec()                           { setSpecs(p => [...p, { id: nextSpecId++, value: '' }]) }
  // function removeSpec(id: number)              { setSpecs(p => p.filter(s => s.id !== id)) }
  // function updateSpec(id: number, val: string) { setSpecs(p => p.map(s => s.id === id ? { ...s, value: val } : s)) }

  /* ── fee structure helpers ── */
  function addFeeStructure() {
    const newStruct: FeeStructure = { ...blankFeeStructure(nextFeeStructId++), semFees: Array.from({ length: NUM_SEMS }, () => []) }
    setFeeStructures(prev => [...prev, newStruct])
    setActiveFeeIdx(feeStructures.length)
    setFeeAccordion(0)
  }

  function removeFeeStructure(idx: number) {
    if (feeStructures.length <= 1) return
    setFeeStructures(prev => prev.filter((_, i) => i !== idx))
    setActiveFeeIdx(prev => (prev >= idx && prev > 0 ? prev - 1 : prev))
  }

  function updateFeeStructureMeta(field: Exclude<keyof FeeStructure, 'id' | 'semFees'>, val: string) {
    setFeeStructures(prev => prev.map((s, i) => i === activeFeeIdx ? { ...s, [field]: val } : s))
  }

  /* ── fee item helpers ── */
  function addItem(si: number) {
    setFeeStructures(prev => prev.map((s, i) =>
      i === activeFeeIdx
        ? { ...s, semFees: s.semFees.map((items, j) => j === si ? [...items, blankItem(nextId++)] : items) }
        : s
    ))
  }
  function removeItem(si: number, id: number) {
    setFeeStructures(prev => prev.map((s, i) =>
      i === activeFeeIdx
        ? { ...s, semFees: s.semFees.map((items, j) => j === si ? items.filter(f => f.id !== id) : items) }
        : s
    ))
  }
  function updateItem(si: number, id: number, field: keyof FeeItem, val: string) {
    setFeeStructures(prev => prev.map((s, i) =>
      i === activeFeeIdx
        ? { ...s, semFees: s.semFees.map((items, j) => j === si ? items.map(f => f.id === id ? { ...f, [field]: val } : f) : items) }
        : s
    ))
  }
  function moveItem(si: number, idx: number, dir: -1 | 1) {
    const to = idx + dir
    setFeeStructures(prev => prev.map((s, i) => {
      if (i !== activeFeeIdx) return s
      return {
        ...s,
        semFees: s.semFees.map((items, j) => {
          if (j !== si || to < 0 || to >= items.length) return items
          const next = [...items];
          [next[idx], next[to]] = [next[to], next[idx]]
          return next
        }),
      }
    }))
  }

  /* ── course unit helpers ── */
  function addUnit(si: number, val: string) {
    const opt = courseUnitOptions.find(u => u.value === val)
    if (!opt) return
    setSemUnits(prev => prev.map((units, i) =>
      i === si ? [...units, { id: nextCUId++, guid: opt.value, code: opt.code, name: opt.name, credits: opt.credits, unitType: '', unitCat: '' }] : units
    ))
    setPendingSel(prev => prev.map((s, i) => i === si ? '' : s))
  }
  function removeUnit(si: number, id: number) {
    setSemUnits(prev => prev.map((units, i) =>
      i === si ? units.filter(u => u.id !== id) : units
    ))
  }
  function setUnitField(si: number, id: number, field: 'unitType' | 'unitCat', val: string) {
    setSemUnits(prev => prev.map((units, i) =>
      i === si ? units.map(u => u.id === id ? { ...u, [field]: val } : u) : units
    ))
  }

  if (saved) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <SuccessPopup title={mode === 'edit' ? 'Programme Updated!' : 'Programme Saved!'} subtitle="The programme version has been saved successfully." onClose={handleClose} />
        </div>
      </div>
    )
  }

  if (failure) {
    return (
      <div className="modal-overlay open">
        <div className="modal" style={{ maxWidth: 400 }}>
          <FailurePopup title="Couldn't Save Programme" subtitle={failure} onClose={() => setFailure(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" id="new-prog-modal">
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-graduation"></i> {mode === 'edit' ? 'Edit' : 'Add'} Programme Version</div>
          <button className="modal-close" onClick={handleClose}><i className="lni lni-close"></i></button>
        </div>

        <div className="prog-steps">
          <div className={`prog-step${step === 1 ? ' active' : ''}`}><span className="prog-step-num">1</span><span>Programme Details</span></div>
          <div className="prog-step-line"></div>
          <div className={`prog-step${step === 2 ? ' active' : ''}`}><span className="prog-step-num">2</span><span>Course Unit Allocation</span></div>
          <div className="prog-step-line"></div>
          <div className={`prog-step${step === 3 ? ' active' : ''}`}><span className="prog-step-num">3</span><span>Semester-wise Fee Structure</span></div>
        </div>

        <div className="modal-scroll">

          {/* ── Step 1: Programme Details ──────────────────────── */}
          {step === 1 && (
            <div>
              <div className="g3">
                <div className="fg">
                  <div className="lbl">Programme Code <span className="req">*</span></div>
                  <input
                    className="ctrl"
                    placeholder="e.g. BCA-2031"
                    value={programCode}
                    onChange={e => { setProgramCode(e.target.value); if (step1Errors.programCode) setStep1Errors(p => ({ ...p, programCode: '' })) }}
                    style={step1Errors.programCode ? { borderColor: 'var(--red)' } : undefined}
                  />
                  {step1Errors.programCode && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.programCode}</p>}
                </div>
                <div className="fg span2">
                  <div className="lbl">Programme Name <span className="req">*</span></div>
                  <input
                    className="ctrl"
                    placeholder="e.g. Bachelor of Computer Applications 2031"
                    value={programName}
                    onChange={e => { setProgramName(e.target.value); if (step1Errors.programName) setStep1Errors(p => ({ ...p, programName: '' })) }}
                    style={step1Errors.programName ? { borderColor: 'var(--red)' } : undefined}
                  />
                  {step1Errors.programName && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.programName}</p>}
                </div>
                <div className="fg">
                  <div className="lbl">Programme Group <span className="req">*</span></div>
                  <SearchSelect
                    placeholder="— Select group —"
                    value={programGroupGuid}
                    onChange={v => { setProgramGroupGuid(v); if (step1Errors.programGroupGuid) setStep1Errors(p => ({ ...p, programGroupGuid: '' })) }}
                    options={programGroupOptions}
                  />
                  {step1Errors.programGroupGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.programGroupGuid}</p>}
                </div>
                <div className="fg">
                  <div className="lbl">No. of Course Units <span className="req">*</span></div>
                  <input
                    className="ctrl"
                    type="number"
                    min={0}
                    placeholder="e.g. 24"
                    value={unitCount}
                    onChange={e => { setUnitCount(e.target.value); if (step1Errors.unitCount) setStep1Errors(p => ({ ...p, unitCount: '' })) }}
                    style={step1Errors.unitCount ? { borderColor: 'var(--red)' } : undefined}
                  />
                  {step1Errors.unitCount && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.unitCount}</p>}
                </div>
                <div className="fg span2">
                  <div className="lbl">Programme Level (auto-fills year/sem/credits) <span className="req">*</span></div>
                  <SearchSelect placeholder="— Select level —" value={programLevelGuid} onChange={selectProgramLevel} options={programLevelOptions} />
                  {step1Errors.programLevelGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.programLevelGuid}</p>}
                  <div className="flex gap-2 flex-wrap mt-2">
                    <span className="lvl-chip"><span className="lvl-chip-lbl">No. of Years</span><span className="lvl-chip-val">{selectedProgramLevel?.yearCount ?? '—'}</span></span>
                    <span className="lvl-chip"><span className="lvl-chip-lbl">No. of Semesters</span><span className="lvl-chip-val">{selectedProgramLevel?.semCount ?? '—'}</span></span>
                    <span className="lvl-chip"><span className="lvl-chip-lbl">Min. Credits</span><span className="lvl-chip-val">{selectedProgramLevel?.minCreditLoad ?? '—'}</span></span>
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl">Faculty <span className="req">*</span></div>
                  <SearchSelect
                    placeholder="— Select faculty —"
                    value={facultyGuid}
                    onChange={v => { setFacultyGuid(v); if (step1Errors.facultyGuid) setStep1Errors(p => ({ ...p, facultyGuid: '' })) }}
                    options={facultyOptions}
                  />
                  {step1Errors.facultyGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.facultyGuid}</p>}
                </div>
                <div className="fg">
                  <div className="lbl">Campus</div>
                  <input className="ctrl" type="text" value={selectedFaculty?.campusName ?? ''} placeholder="Derived from Faculty" disabled />
                </div>
                <div className="fg span2">
                  <div className="lbl">Application Fee &amp; Late Fee <span className="req">*</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px', gap: 6 }}>
                    <input
                      className="ctrl font-bold"
                      type="number"
                      min={0}
                      placeholder="Application Fee"
                      value={appFee}
                      onChange={e => { setAppFee(e.target.value); if (step1Errors.appFee) setStep1Errors(p => ({ ...p, appFee: '' })) }}
                      style={step1Errors.appFee ? { borderColor: 'var(--red)' } : undefined}
                    />
                    <input
                      className="ctrl font-bold"
                      type="number"
                      min={0}
                      placeholder="Late Fee"
                      value={lateFee}
                      onChange={e => { setLateFee(e.target.value); if (step1Errors.lateFee) setStep1Errors(p => ({ ...p, lateFee: '' })) }}
                      style={step1Errors.lateFee ? { borderColor: 'var(--red)' } : undefined}
                    />
                    {mode === 'edit' ? (
                      <SearchSelect
                        placeholder="Currency"
                        value={currencyGuid}
                        onChange={v => { setCurrencyGuid(v); if (step1Errors.currencyCode) setStep1Errors(p => ({ ...p, currencyCode: '' })) }}
                        options={financeCurrencyOptions}
                      />
                    ) : (
                      <SearchSelect
                        placeholder="Currency"
                        value={currencyCode}
                        onChange={v => { setCurrencyCode(v); if (step1Errors.currencyCode) setStep1Errors(p => ({ ...p, currencyCode: '' })) }}
                        options={currencyIntOptions}
                      />
                    )}
                  </div>
                  <div className="text-g500 mt-[5px]" style={{ fontSize: 'var(--fs-xs)' }}>
                    {mode === 'edit'
                      ? (currencyGuid ? 'Pre-filled from the existing programme — override if needed.' : 'Not available on the existing programme record — please select it.')
                      : 'Pre-loaded from the selected Programme Level. Override per programme if needed.'}
                  </div>
                  {(step1Errors.appFee || step1Errors.lateFee || step1Errors.currencyCode) && (
                    <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.appFee || step1Errors.lateFee || step1Errors.currencyCode}</p>
                  )}
                </div>
                <div className="fg">
                  <div className="lbl">Accreditation Date <span className="req">*</span></div>
                  <input
                    className="ctrl"
                    type="date"
                    value={dateAcc}
                    onChange={e => { setDateAcc(e.target.value); if (step1Errors.dateAcc) setStep1Errors(p => ({ ...p, dateAcc: '' })) }}
                    style={step1Errors.dateAcc ? { borderColor: 'var(--red)' } : undefined}
                  />
                  {step1Errors.dateAcc && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.dateAcc}</p>}
                </div>
                {/* Accreditation Expiry Date — commented out per request.
                <div className="fg m-0"><div className="lbl">Accreditation Expiry Date</div><input className="ctrl" type="date" /></div>
                */}
                <div className="fg">
                  <div className="lbl">Specialization <span className="req">*</span></div>
                  <SearchSelect
                    placeholder="— Select specialization —"
                    value={streamGuid}
                    onChange={v => { setStreamGuid(v); if (step1Errors.streamGuid) setStep1Errors(p => ({ ...p, streamGuid: '' })) }}
                    options={streamOptions}
                  />
                  {step1Errors.streamGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.streamGuid}</p>}
                </div>
                <div className="fg">
                  <div className="lbl">Intake <span className="req">*</span></div>
                  <SearchSelect
                    placeholder="— Select intake —"
                    value={intakeGuid}
                    onChange={v => { setIntakeGuid(v); if (step1Errors.intakeGuid) setStep1Errors(p => ({ ...p, intakeGuid: '' })) }}
                    options={programIntakeOptions}
                  />
                  {step1Errors.intakeGuid && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{step1Errors.intakeGuid}</p>}
                </div>
                <div className="fg span3">
                  <div className="lbl">Accreditation Letter</div>
                  <div className="file-zone p-[14px]">
                    <input type="file" accept=".pdf" onChange={e => setAccLetterFile(e.target.files?.[0] ?? null)} />
                    <div className="file-zone-icon"><i className="lni lni-files"></i></div>
                    <p>{accLetterFile ? accLetterFile.name : 'Upload NCHE / UVTOP accreditation letter (PDF)'}</p>
                  </div>
                </div>
              </div>

              {/* Old repeatable multi-specialization list — the confirmed create
                  payload only supports one streamGuid, not an array (see the
                  single Specialization SearchSelect above).
              <div className="sec-divider">
                Programme Specializations
                <span className="font-medium text-g400 normal-case tracking-normal ml-2" style={{ fontSize: 'var(--fs-2xs)' }}>
                  Optional · A student can pick one specialization which dictates their specialization course units
                </span>
              </div>
              <div className="bg-[#fafbfd] border-[1.5px] border-g200 rounded-[var(--rsm)] p-[14px_16px] mb-[14px]">
                {specs.length === 0 && (
                  <div className="text-g500 italic mb-2" style={{ fontSize: 'var(--fs-sm)' }}>No specializations added — this programme will run as a single track.</div>
                )}
                {specs.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {specs.map((s, idx) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--b600)', background: 'var(--b100)', padding: '4px 8px', borderRadius: 'var(--rxs)', minWidth: 32, textAlign: 'center', flexShrink: 0 }}>#{idx + 1}</span>
                        <div style={{ flex: 1 }}>
                          <SearchSelect
                            placeholder="— Select a specialization —"
                            value={s.value}
                            onChange={val => updateSpec(s.id, val)}
                            options={SPEC_OPTS}
                          />
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          onClick={() => removeSpec(s.id)}
                        ><i className="lni lni-trash-can"></i></button>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn btn-neu btn-sm" onClick={addSpec}><i className="lni lni-plus"></i> Add Specialization</button>
              </div>
              */}

              <div className="sec-divider">Status &amp; Flags</div>
              <div className="g3">
                <div className="fg">
                  <div className="lbl">Admission Status <span className="req">*</span></div>
                  <div className="tgl-group">
                    <button type="button" className={`tgl-btn${pgmStatus ? ' tgl-active' : ''}`} onClick={() => setPgmStatus(true)}><i className="lni lni-checkmark"></i> Active (New admissions)</button>
                    <button type="button" className={`tgl-btn${!pgmStatus ? ' tgl-active' : ''}`} onClick={() => setPgmStatus(false)}>Inactive (Existing students only)</button>
                  </div>
                </div>
                <div className="fg">
                  <div className="lbl">No Internal Assessment?</div>
                  <div className="tgl-group">
                    <button type="button" className={`tgl-btn${!noIa ? ' tgl-active' : ''}`} onClick={() => setNoIa(false)}>No (Standard)</button>
                    <button type="button" className={`tgl-btn${noIa ? ' tgl-active' : ''}`} onClick={() => setNoIa(true)}>Yes (e.g. PhD)</button>
                  </div>
                </div>
              </div>
              <div className="warn-box mt-3">
                <i className="lni lni-warning"></i> Setting this version to <em>Active</em> will make it available for new admissions. Ensure the old version (if any) is set to <em>Inactive</em> first.
              </div>
            </div>
          )}

          {/* ── Step 2: Course Unit Allocation ─────────────────── */}
          {step === 2 && (
            <div>
              <div className="mdl-section mdl-section--blue" style={{ marginBottom: 14 }}>
                <div className="mdl-section-hdr">
                  <span className="mdl-section-icon"><i className="lni lni-book"></i></span>
                  <div className="flex-1 min-w-0">
                    <div className="mdl-section-title font-bold">Allocate Course Units by Semester</div>
                    <div className="mdl-section-sub">Assign course units to each semester. Pick from the curriculum master or add a quick placeholder.</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {semUnits.map((units, si) => {
                  const isOpen        = activeAcc === si
                  const assignedCodes = units.map(u => u.code)
                  const availableOpts = courseUnitOptions.filter(o => !assignedCodes.includes(o.code))
                  const totalCredits  = units.reduce((s, u) => s + u.credits, 0)
                  return (
                    <div key={si} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setActiveAcc(isOpen ? -1 : si)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: isOpen ? 'var(--b50)' : 'var(--white)', border: 'none', borderBottom: isOpen ? '1px solid var(--b100)' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                      >
                        <span className="badge badge-blue" style={{ flexShrink: 0 }}>Sem {si + 1}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--b700)' }}>Semester {si + 1}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--g400)', marginRight: 8 }}>
                          {units.length} unit{units.length !== 1 ? 's' : ''} · {totalCredits} credit{totalCredits !== 1 ? 's' : ''}
                        </span>
                        <i className="lni lni-chevron-down" style={{ fontSize: 11, color: 'var(--g400)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }} />
                      </button>
                      <div style={{ overflow: 'hidden', maxHeight: isOpen ? 600 : 0, transition: 'max-height 0.3s ease' }}>
                        <div style={{ padding: '10px 14px' }}>
                          {units.length === 0 && (
                            <div style={{ fontSize: 12.5, color: 'var(--g400)', fontStyle: 'italic', marginBottom: 8 }}>
                              No course units assigned yet
                            </div>
                          )}
                          {units.length > 0 && (
                            <div className="flex flex-col" style={{ marginBottom: 10, border: '1px solid var(--g100)', borderRadius: 'var(--rxs)', overflow: 'hidden' }}>
                              {units.map((u, ui) => (
                                <div key={u.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', borderBottom: ui < units.length - 1 ? '1px solid var(--g100)' : 'none', background: 'var(--white)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span className="font-mono font-bold text-b700" style={{ fontSize: 12, minWidth: 50 }}>{u.code}</span>
                                    <span style={{ flex: 1, fontSize: 13, color: 'var(--g700)' }}>{u.name}</span>
                                    <span className="badge badge-blue">{u.credits} cr</span>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      style={{ width: 26, height: 26, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                      onClick={() => removeUnit(si, u.id)}
                                    ><i className="lni lni-close" style={{ fontSize: 11 }}></i></button>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <SearchSelect placeholder="— Unit Type —" value={u.unitType} onChange={val => setUnitField(si, u.id, 'unitType', val)} options={unitTypeOptions} />
                                    <SearchSelect placeholder="— Unit Category —" value={u.unitCat} onChange={val => setUnitField(si, u.id, 'unitCat', val)} options={unitCategoryOptions} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <SearchSelect
                            placeholder="— Select course unit —"
                            value={pendingSel[si]}
                            onChange={val => addUnit(si, val)}
                            options={availableOpts}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Semester-wise Fee Structure ────────────── */}
          {step === 3 && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

              {/* Left fee structure list */}
              <div style={{ width: 210, flexShrink: 0, background: 'var(--surface)', border: '1.5px solid var(--g200)', borderRadius: 'var(--rsm)', overflow: 'hidden', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', maxHeight: 480 }}>
                <div style={{ padding: '14px 14px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  Fee Structures <span style={{ color: 'var(--b500)' }}>({feeStructures.length})</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
                  {feeStructures.map((s, i) => (
                    <div
                      key={s.id}
                      onClick={() => { setActiveFeeIdx(i); setFeeAccordion(0) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 10px', borderRadius: 'var(--rsm)', marginBottom: 2,
                        background: activeFeeIdx === i ? 'var(--b500)' : 'transparent',
                        color: activeFeeIdx === i ? '#fff' : 'var(--g700)',
                        cursor: 'pointer', transition: 'background .15s',
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: activeFeeIdx === i ? 'rgba(255,255,255,.2)' : 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="lni lni-coin" style={{ fontSize: 12, color: activeFeeIdx === i ? '#fff' : 'var(--b600)' }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Structure {i + 1}</div>
                        <div style={{ fontSize: 11, opacity: .65, lineHeight: 1.3 }}>{s.localOrForeign === 'true' ? 'Foreign' : 'Local'}</div>
                      </div>
                      {feeStructures.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); removeFeeStructure(i) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: activeFeeIdx === i ? 'rgba(255,255,255,.65)' : 'var(--g300)', display: 'flex', alignItems: 'center', borderRadius: 'var(--rxs)', flexShrink: 0 }}
                        ><i className="lni lni-trash-can" style={{ fontSize: 12 }}></i></button>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: '1.5px solid var(--g200)', padding: '6px 8px 10px' }}>
                  <button className="btn btn-neu btn-sm" style={{ width: '100%' }} onClick={addFeeStructure} disabled={!activeFeeComplete}>
                    <i className="lni lni-plus"></i> Add Fee Structure
                  </button>
                </div>
              </div>

              {/* Right configuration panel */}
              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Active structure banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '10px 14px', background: 'var(--b50)', borderRadius: 'var(--rsm)', border: '1.5px solid var(--b100)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--b100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="lni lni-coin" style={{ color: 'var(--b600)', fontSize: 15 }}></i>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--b800)' }}>{activeFeeStruct.feeCode || `Structure ${activeFeeIdx + 1}`} — {activeFeeStruct.localOrForeign === 'true' ? 'Foreign' : 'Local'}</div>
                    <div style={{ fontSize: 11, color: 'var(--g400)' }}>Structure {activeFeeIdx + 1} of {feeStructures.length}</div>
                  </div>
                </div>

                {/* Fee structure controls */}
                <div className="g3 mb-[14px]">
                  <div className="fg m-0">
                    <div className="lbl">Fee Code</div>
                    <input className="ctrl font-mono uppercase" type="text" value={activeFeeStruct.feeCode} onChange={e => updateFeeStructureMeta('feeCode', e.target.value)} />
                  </div>
                  <div className="fg m-0">
                    <div className="lbl">Fee Description</div>
                    <input className="ctrl" type="text" placeholder="e.g. Local undergraduate fee structure" value={activeFeeStruct.description} onChange={e => updateFeeStructureMeta('description', e.target.value)} />
                  </div>
                  <div className="fg m-0">
                    <div className="lbl">Copy Fee Code</div>
                    <SearchSelect
                      placeholder="— Select source structure —"
                      options={feeStructures.map((s, i) => ({ s, i })).filter(({ i }) => i !== activeFeeIdx).map(({ s, i }) => ({ value: String(s.id), label: s.feeCode || `Structure ${i + 1}` }))}
                    />
                  </div>
                  <div className="fg m-0">
                    <div className="lbl">Base Currency</div>
                    <SearchSelect options={LOCAL_OR_FOREIGN_OPTS} value={activeFeeStruct.localOrForeign} onChange={val => updateFeeStructureMeta('localOrForeign', val)} />
                  </div>
                  <div className="fg m-0">
                    <div className="lbl">Intake</div>
                    {mode === 'edit' ? (
                      <SearchSelect placeholder="— Select intake —" value={activeFeeStruct.intakeGuid} onChange={val => updateFeeStructureMeta('intakeGuid', val)} options={programIntakeOptions} />
                    ) : (
                      <SearchSelect placeholder="— Select intake —" value={activeFeeStruct.intakeCode} onChange={val => updateFeeStructureMeta('intakeCode', val)} options={intakeOptions} />
                    )}
                  </div>
                </div>

                {/* Programme-level fees & discounts — maps onto
                    FeeStructureInput's lef/cef/ace/lec/cec/acec/calcType/
                    amtPer (see handleFinalSubmit). */}
                <div className="bg-[linear-gradient(135deg,#f0f5ff_0%,var(--white)_70%)] border-[1.5px] border-dashed border-[var(--b200)] rounded-[var(--rsm)] p-[14px_16px] mb-[18px]">
                  <div className="flex items-center gap-2 font-bold uppercase mb-3" style={{ fontSize: 'var(--fs-xs)', letterSpacing: '.08em', color: '#2d448f' }}>
                    <i className="lni lni-tag" style={{ fontSize: 'var(--fs-md)' }}></i>
                    <span>Programme-level Fees &amp; Discounts</span>
                    <span className="badge badge-blue normal-case tracking-normal font-semibold ml-auto">Applied across all semesters</span>
                  </div>
                  <div className="g4">
                    <div className="fg m-0">
                      <div className="lbl">Lumpsum Discount Type</div>
                      <SearchSelect options={CALC_TYPES} value={activeFeeStruct.discountType} onChange={val => updateFeeStructureMeta('discountType', val)} />
                    </div>
                    <div className="fg m-0">
                      <div className="lbl">{activeFeeStruct.discountType === '2' ? 'Lumpsum Discount Percentage' : 'Lumpsum Discount Amount'}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-g500 font-bold min-w-[28px] text-center" style={{ fontSize: 'var(--fs-sm)' }}>{activeFeeStruct.discountType === '2' ? '%' : (activeFeeStruct.localOrForeign === 'true' ? 'Foreign' : 'Local')}</span>
                        <input className="ctrl flex-1" type="number" placeholder="0" min={0} max={activeFeeStruct.discountType === '2' ? 100 : undefined} value={activeFeeStruct.discountAmount} onChange={e => updateFeeStructureMeta('discountAmount', e.target.value)} />
                      </div>
                    </div>
                    <div className="fg m-0">
                      <div className="lbl">Lateral Entry Fee</div>
                      <input className="ctrl" type="number" placeholder="0" min={0} value={activeFeeStruct.lateralEntryFee} onChange={e => updateFeeStructureMeta('lateralEntryFee', e.target.value)} />
                    </div>
                    <div className="fg m-0">
                      <div className="lbl">Currency</div>
                      <SearchSelect placeholder="Currency" options={currencyIntOptions} value={activeFeeStruct.lateralEntryFeeCurrency} onChange={val => updateFeeStructureMeta('lateralEntryFeeCurrency', val)} />
                    </div>
                    <div className="fg m-0">
                      <div className="lbl">Credit Exemption Fee</div>
                      <input className="ctrl" type="number" placeholder="0" min={0} value={activeFeeStruct.creditExemptionFee} onChange={e => updateFeeStructureMeta('creditExemptionFee', e.target.value)} />
                    </div>
                    <div className="fg m-0">
                      <div className="lbl">Currency</div>
                      <SearchSelect placeholder="Currency" options={currencyIntOptions} value={activeFeeStruct.creditExemptionFeeCurrency} onChange={val => updateFeeStructureMeta('creditExemptionFeeCurrency', val)} />
                    </div>
                    <div className="fg m-0">
                      <div className="lbl">Aptech Credit Exemption Fee</div>
                      <input className="ctrl" type="number" placeholder="0" min={0} value={activeFeeStruct.aptechCreditExemptionFee} onChange={e => updateFeeStructureMeta('aptechCreditExemptionFee', e.target.value)} />
                    </div>
                    <div className="fg m-0">
                      <div className="lbl">Currency</div>
                      <SearchSelect placeholder="Currency" options={currencyIntOptions} value={activeFeeStruct.aptechCreditExemptionFeeCurrency} onChange={val => updateFeeStructureMeta('aptechCreditExemptionFeeCurrency', val)} />
                    </div>
                  </div>
                </div>

                {/* Per-semester accordion */}
                <div className="flex flex-col gap-2">
                  {activeFeeStruct.semFees.map((items, si) => {
                    const isOpen = feeAccordion === si
                    const total  = items.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0)
                    // items[0].currency holds Currency.intCurrency (a string) in create mode, or
                    // items[0].currencyGuid holds a real currencyGuid in edit mode — resolve
                    // back to a code for display either way.
                    const totalCurrencyCode = mode === 'edit'
                      ? financeCurrencies.find(c => c.currencyGuid === items[0]?.currencyGuid)?.currencyCode ?? ''
                      : currencies.find(c => String(c.intCurrency) === items[0]?.currency)?.currencyCode ?? ''
                    return (
                      <div key={si} style={{ border: '1.5px solid var(--b100)', borderRadius: 'var(--rsm)', overflow: 'hidden' }}>
                        <button
                          type="button"
                          onClick={() => setFeeAccordion(isOpen ? -1 : si)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', width: '100%', background: isOpen ? 'var(--b50)' : 'var(--white)', border: 'none', borderBottom: isOpen ? '1px solid var(--b100)' : 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                        >
                          <span className="badge badge-blue" style={{ flexShrink: 0 }}>Sem {si + 1}</span>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--b700)' }}>Semester {si + 1}</span>
                          {items.length > 0
                            ? <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--g400)', marginRight: 8 }}>{items.length} item{items.length !== 1 ? 's' : ''} · {total.toLocaleString()} {totalCurrencyCode}</span>
                            : <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--g400)', fontStyle: 'italic', marginRight: 8 }}>No items</span>
                          }
                          <i className="lni lni-chevron-down" style={{ fontSize: 11, color: 'var(--g400)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }} />
                        </button>
                        <div style={{ overflow: 'hidden', maxHeight: isOpen ? 800 : 0, transition: 'max-height 0.3s ease' }}>
                          <div style={{ padding: '10px 14px' }}>
                            {items.length > 0 && (
                              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 90px 210px 32px', gap: 6, padding: '0 0 4px', fontSize: 10.5, fontWeight: 700, color: 'var(--g400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <span style={{ textAlign: 'center' }}>Pri.</span><span>Fee Title</span><span>Amount</span><span>Currency</span><span>Ledger</span><span></span>
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              {items.length === 0 && (
                                <div className="text-g400 italic" style={{ fontSize: 12.5, marginBottom: 8 }}>No fee items — click &ldquo;Add Fee Item&rdquo; to begin.</div>
                              )}
                              {items.map((f, idx) => (
                                <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 90px 210px 32px', gap: 6, alignItems: 'center' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                                    <button className="btn btn-neu" style={{ width: 26, height: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }} onClick={() => moveItem(si, idx, -1)} disabled={idx === 0}><i className="lni lni-chevron-up"></i></button>
                                    <button className="btn btn-neu" style={{ width: 26, height: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }} onClick={() => moveItem(si, idx, 1)} disabled={idx === items.length - 1}><i className="lni lni-chevron-down"></i></button>
                                  </div>
                                  <input className="ctrl" value={f.title}  onChange={e => updateItem(si, f.id, 'title',  e.target.value)} placeholder="e.g. Tuition Fee" />
                                  <input className="ctrl" value={f.amount} onChange={e => updateItem(si, f.id, 'amount', e.target.value)} type="number" min={0} placeholder="0" />
                                  {mode === 'edit'
                                    ? <SearchSelect placeholder="— Currency —" options={financeCurrencyOptions} value={f.currencyGuid} onChange={val => updateItem(si, f.id, 'currencyGuid', val)} />
                                    : <SearchSelect placeholder="— Currency —" options={currencyIntOptions} value={f.currency} onChange={val => updateItem(si, f.id, 'currency', val)} />
                                  }
                                  <SearchSelect placeholder="— Select Ledger —" options={ledgerOptions} value={f.ledger} onChange={val => updateItem(si, f.id, 'ledger', val)} />
                                  <button className="btn btn-danger btn-sm" style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} onClick={() => removeItem(si, f.id)}><i className="lni lni-trash-can"></i></button>
                                </div>
                              ))}
                              <button className="btn btn-neu btn-sm mt-2" style={{ alignSelf: 'flex-start', fontSize: 11 }} onClick={() => addItem(si)}>
                                <i className="lni lni-plus"></i> Add Fee Item
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-neu" onClick={handleClose}>Cancel</button>
          <span className="flex-1"></span>
          {step > 1 && (
            <button className="btn btn-neu" onClick={() => setStep(s => s - 1)}>
              <i className="lni lni-arrow-left"></i> Back
            </button>
          )}
          {step < 3 && (
            <button className="btn btn-primary" onClick={() => { if (step === 1 && !validateStep1()) return; setStep(s => s + 1) }}>
              Save &amp; Continue <i className="lni lni-arrow-right"></i>
            </button>
          )}
          {step === 3 && (anyCurrencyGaps || anyLedgerGaps) && (
            <span style={{ color: 'var(--red)', fontSize: 12 }}>Select a currency and ledger for every fee item before saving</span>
          )}
          {step === 3 && (
            <button className="btn btn-primary" onClick={handleFinalSubmit} disabled={!allFeeComplete || isSaving}>
              <i className="lni lni-checkmark"></i> {isSaving ? 'Saving…' : `${mode === 'edit' ? 'Update' : 'Save'} Programme`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
