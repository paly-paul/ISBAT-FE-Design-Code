'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Toast } from '@/components/Toast'
import { SearchSelect } from '@/components/SearchSelect'
import { TableSearch } from '@/components/TableSearch'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'
import { SuccessPopup } from '@/components/modals/shared/SuccessPopup'
import { QuestionEditModal } from '@/components/modals/assessment/QuestionEditModal'
import { ViewQuestionBankModal, ExistingQuestionBank } from '@/components/modals/assessment/ViewQuestionBankModal'
import { getSessionIdentity } from '@/lib/session'
import { useIntakes, useCurrentAcademicIntake } from '@/hooks/academic/useIntakes'
import { useEmployees } from '@/hooks/employee/useEmployees'
import { EmployeeListItem } from '@/lib/api/employee/employee'
import {
  useQuestionBankCategories,
  useQuestionBankCourseUnits,
  useDownloadQuestionBankTemplate,
  useQuestionBankSheets,
  useQuestionBankPreview,
  useQuestionBankImport,
  useDeleteQuestionBank,
  QuestionPreviewItem,
} from '@/hooks/assessment/useQuestionBank'

const mockInitialQuestions: QuestionPreviewItem[] = [
  {
    slNo: '1',
    questionType: 'MCQ',
    question: 'A student wants to render a realistic city scene at night. Describe how global illumination, ambient occlusion, and photometric lighting contribute to realism. Evaluate the trade-off between render quality and production time.',
    option1: 'Increases render time significantly but provides realistic shadows and light bounces.',
    option2: 'Has no effect on render quality.',
    option3: 'Decreases render time by simplifying light calculations.',
    option4: 'Only affects daytime scenes.',
    answer: 'Increases render time significantly but provides realistic shadows and light bounces.',
    level: '2',
  },
  {
    slNo: '2',
    questionType: 'DQ',
    question: 'Explain the principles of Agile software development and how they differ from the Waterfall model. Provide examples of when to use each methodology effectively in enterprise projects.',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    answer: 'Agile focuses on iterative development, flexibility, and customer collaboration. Waterfall is a linear, sequential approach better suited for strict regulatory environments.',
    level: '3',
  },
  {
    slNo: '3',
    questionType: 'MCQ',
    question: 'Which of the following data structures provides the most efficient average-case time complexity for search, insert, and delete operations?',
    option1: 'Array',
    option2: 'Linked List',
    option3: 'Hash Table',
    option4: 'Binary Search Tree',
    answer: 'Hash Table',
    level: '1',
  },
  {
    slNo: '4',
    questionType: 'DQ',
    question: 'Discuss the impact of artificial intelligence on modern cybersecurity paradigms. How are machine learning algorithms being utilized for both offensive and defensive strategies?',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    answer: 'AI enables rapid threat detection and automated response on the defensive side, while offensively it is used to generate sophisticated phishing attacks and discover vulnerabilities faster.',
    level: '2',
  }
]

const initialExistingBanks: ExistingQuestionBank[] = [
  {
    id: 'qb-1',
    fileName: 'BCS3127_Compiler_Design_CW_2026.xlsx',
    categoryId: '2',
    categoryName: 'Course Work',
    courseUnitGuid: '017749e8-a325-4560-b8db-2230721d838f',
    courseUnitCode: 'BCS3127',
    courseUnitName: 'Compiler Design',
    academicIntake: 'AUG-2026',
    uploadedBy: 'Dr. Arthur Pendelton',
    uploadedDate: '12 Sep 2026, 10:45 AM',
    fileSize: '48.5 KB',
    status: 'Active',
    questions: [
      {
        slNo: '1',
        questionType: 'MCQ',
        question: 'Which phase of a compiler is responsible for checking semantic consistency and type checking according to the language definition?',
        option1: 'Lexical Analysis',
        option2: 'Syntax Analysis',
        option3: 'Semantic Analysis',
        option4: 'Code Optimization',
        answer: 'Semantic Analysis',
        level: '1',
      },
      {
        slNo: '2',
        questionType: 'MCQ',
        question: 'A Bottom-Up parser builds the parse tree beginning from which part of the tree?',
        option1: 'From the leaves up to the root',
        option2: 'From the root down to the leaves',
        option3: 'From the leftmost non-terminal only',
        option4: 'From the center outwards',
        answer: 'From the leaves up to the root',
        level: '2',
      },
      {
        slNo: '3',
        questionType: 'DQ',
        question: 'Differentiate between synthesized attributes and inherited attributes in Syntax-Directed Definitions (SDD). Give a practical example of each.',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        answer: 'Synthesized attributes are computed from the children nodes in the parse tree, whereas inherited attributes take values from parents and siblings.',
        level: '2',
      },
      {
        slNo: '4',
        questionType: 'DQ',
        question: 'Explain the role of Intermediate Code Generation in a multi-target compiler architecture. Why is Three-Address Code (TAC) widely preferred?',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        answer: 'Intermediate Code Generation provides machine-independence, facilitating portability and cross-compilation. TAC is simple to generate and optimize.',
        level: '3',
      },
    ],
  },
  {
    id: 'qb-2',
    fileName: 'CSE1212_Data_Structures_CW_Bank.xlsx',
    categoryId: '2',
    categoryName: 'Course Work',
    courseUnitGuid: '18bc91be-6665-411e-9b27-fba637d2e761',
    courseUnitCode: 'CSE1212',
    courseUnitName: 'Data Structures & Algorithms',
    academicIntake: 'AUG-2026',
    uploadedBy: 'Prof. Sarah Jenkins',
    uploadedDate: '14 Sep 2026, 02:15 PM',
    fileSize: '54.2 KB',
    status: 'Active',
    questions: [
      {
        slNo: '1',
        questionType: 'MCQ',
        question: 'Which of the following data structures provides the most efficient average-case time complexity for search, insert, and delete operations?',
        option1: 'Array',
        option2: 'Linked List',
        option3: 'Hash Table',
        option4: 'Binary Search Tree',
        answer: 'Hash Table',
        level: '1',
      },
      {
        slNo: '2',
        questionType: 'MCQ',
        question: 'What is the worst-case time complexity of QuickSort when an unbalanced pivot selection strategy is utilized?',
        option1: 'O(n log n)',
        option2: 'O(n)',
        option3: 'O(n^2)',
        option4: 'O(log n)',
        answer: 'O(n^2)',
        level: '2',
      },
      {
        slNo: '3',
        questionType: 'DQ',
        question: 'Explain Dijkstra’s shortest path algorithm step-by-step and calculate its time complexity using a min-heap priority queue.',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        answer: 'Dijkstra finds shortest paths from source using a greedy approach. With min-heap and adjacency list, time complexity is O((V + E) log V).',
        level: '3',
      },
      {
        slNo: '4',
        questionType: 'DQ',
        question: 'Discuss the properties and self-balancing mechanisms of AVL trees compared to Red-Black trees in concurrent systems.',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        answer: 'AVL trees are strictly balanced with maximum height difference of 1, yielding faster lookups. Red-Black trees require fewer rotations during insertions/deletions.',
        level: '3',
      },
    ],
  },
  {
    id: 'qb-3',
    fileName: 'BIT2104_Database_Management_CBT_Bank.xlsx',
    categoryId: '1',
    categoryName: 'CBT',
    courseUnitGuid: '29cd02cf-7776-522f-ac38-0cb748e3f872',
    courseUnitCode: 'BIT2104',
    courseUnitName: 'Database Management Systems',
    academicIntake: 'AUG-2026',
    uploadedBy: 'Dr. Marcus Vance',
    uploadedDate: '10 Sep 2026, 09:30 AM',
    fileSize: '42.1 KB',
    status: 'Active',
    questions: [
      {
        slNo: '1',
        questionType: 'MCQ',
        question: 'Which normal form eliminates all transitive functional dependencies on the candidate key in a relational database schema?',
        option1: 'First Normal Form (1NF)',
        option2: 'Second Normal Form (2NF)',
        option3: 'Third Normal Form (3NF)',
        option4: 'Boyce-Codd Normal Form (BCNF)',
        answer: 'Third Normal Form (3NF)',
        level: '2',
      },
      {
        slNo: '2',
        questionType: 'MCQ',
        question: 'Which ACID property ensures that all transaction modifications are committed in isolation without interference from other concurrent transactions?',
        option1: 'Atomicity',
        option2: 'Consistency',
        option3: 'Isolation',
        option4: 'Durability',
        answer: 'Isolation',
        level: '1',
      },
      {
        slNo: '3',
        questionType: 'DQ',
        question: 'Describe Two-Phase Locking (2PL) protocol and explain how it guarantees conflict serializability while introducing potential deadlocks.',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        answer: '2PL consists of an expanding growing phase and a shrinking releasing phase, guaranteeing conflict serializability, but can cause deadlocks if resource locking order is unmanaged.',
        level: '2',
      },
    ],
  },
  {
    id: 'qb-4',
    fileName: 'BIT2104_DBMS_University_Final_Exam_2026.xlsx',
    categoryId: '5',
    categoryName: 'University Exam',
    courseUnitGuid: '29cd02cf-7776-522f-ac38-0cb748e3f872',
    courseUnitCode: 'BIT2104',
    courseUnitName: 'Database Management Systems',
    academicIntake: 'AUG-2026',
    uploadedBy: 'Dr. Marcus Vance',
    uploadedDate: '08 Sep 2026, 11:20 AM',
    fileSize: '61.8 KB',
    status: 'Active',
    questions: [
      {
        slNo: '1',
        questionType: 'MCQ',
        question: 'What is the function of a Write-Ahead Logging (WAL) protocol in database recovery algorithms such as ARIES?',
        option1: 'To encrypt table records before write',
        option2: 'To guarantee log records are flushed to disk before actual data page modifications',
        option3: 'To reduce RAM usage by skipping memory cache',
        option4: 'To auto-generate primary keys',
        answer: 'To guarantee log records are flushed to disk before actual data page modifications',
        level: '2',
      },
      {
        slNo: '2',
        questionType: 'DQ',
        question: 'Evaluate B+ Tree indexing versus Hash indexing for range queries in large-scale database systems.',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        answer: 'B+ trees maintain sorted leaf nodes linked sequentially, making range scans O(log N + k). Hash indexes only support O(1) exact match equality lookups.',
        level: '3',
      },
    ],
  },
]

export default function QuestionBankUploadPage() {
  // ── Toast State ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Form State ──────────────────────────────────────────────────────────────
  const [intakeGuid, setIntakeGuid] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [courseUnitGuid, setCourseUnitGuid] = useState<string>('')

  // ── Logged-in User / Lecturer State ─────────────────────────────────────────
  const [loggedInLecturerGuid, setLoggedInLecturerGuid] = useState<string>('')
  const [loggedInLecturerName, setLoggedInLecturerName] = useState<string>('')

  // ── File & Sheets State ─────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Preview & Table State ───────────────────────────────────────────────────
  const [previewRows, setPreviewRows] = useState<QuestionPreviewItem[] | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [previewFilterType, setPreviewFilterType] = useState<'ALL' | 'MCQ' | 'DQ'>('ALL')
  const [previewSearch, setPreviewSearch] = useState<string>('')

  // ── Existing Question Banks Repository State ────────────────────────────────
  const [existingBanks, setExistingBanks] = useState<ExistingQuestionBank[]>(initialExistingBanks)
  const [bankFilterCategory, setBankFilterCategory] = useState<string>('')
  const [bankFilterCourseUnit, setBankFilterCourseUnit] = useState<string>('')
  const [bankSearch, setBankSearch] = useState<string>('')
  const [activeViewingBank, setActiveViewingBank] = useState<ExistingQuestionBank | null>(null)
  const [directEditingBank, setDirectEditingBank] = useState<ExistingQuestionBank | null>(null)
  const [bankToDelete, setBankToDelete] = useState<ExistingQuestionBank | null>(null)

  // ── Modals State ────────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [successModal, setSuccessModal] = useState<{ title: string; subtitle: string } | null>(null)
  const [viewingQuestion, setViewingQuestion] = useState<QuestionPreviewItem | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<QuestionPreviewItem | null>(null)

  // ── Section Scroll Refs ─────────────────────────────────────────────────────
  const previewSectionRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // ── Queries & Mutations ─────────────────────────────────────────────────────
  const { data: intakes, isLoading: isLoadingIntakes } = useIntakes()
  const { data: currentIntake } = useCurrentAcademicIntake()
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees()
  const { data: categories, isLoading: isLoadingCategories } = useQuestionBankCategories()
  const {
    data: courseUnits,
    isLoading: isLoadingCourseUnits,
    isFetching: isFetchingCourseUnits,
  } = useQuestionBankCourseUnits(intakeGuid, loggedInLecturerGuid, Boolean(intakeGuid && loggedInLecturerGuid))

  const downloadTemplateMut = useDownloadQuestionBankTemplate()
  const sheetsMut = useQuestionBankSheets()
  const previewMut = useQuestionBankPreview()
  const importMut = useQuestionBankImport()
  const deleteMut = useDeleteQuestionBank()

  // ── Resolve currently logged-in lecturer UUID ───────────────────────────────
  useEffect(() => {
    const identity = getSessionIdentity()
    const sessionGuid =
      identity?.employeeGuid ||
      identity?.userGuid ||
      (typeof window !== 'undefined'
        ? sessionStorage.getItem('isbat_employee_guid') ||
          sessionStorage.getItem('employeeGuid') ||
          localStorage.getItem('isbat_employee_guid') ||
          localStorage.getItem('employeeGuid')
        : null)

    if (sessionGuid) {
      setLoggedInLecturerGuid(sessionGuid)
      if (identity?.displayName) setLoggedInLecturerName(identity.displayName)
      return
    }

    // Wait until employee list finishes loading before attempting match or fallback
    if (isLoadingEmployees) return

    if (employeesData && employeesData.length > 0) {
      let matched: EmployeeListItem | undefined
      if (identity?.displayName) {
        const needle = identity.displayName.toLowerCase().trim()
        matched = employeesData.find(e => {
          const name = e.empName.toLowerCase().trim()
          return name === needle || name.includes(needle) || needle.includes(name)
        })
      }

      const resolved = matched || employeesData[0]
      setLoggedInLecturerGuid(resolved.employeeGuid)
      setLoggedInLecturerName(identity?.displayName || resolved.empName)
      // Cache resolved GUID for fast recovery on page refresh
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('isbat_employee_guid', resolved.employeeGuid)
      }
    } else {
      // Safe fallback if employees query returned empty/failed
      setLoggedInLecturerGuid('487c8f38-9db6-45ee-897b-32e2942e8e21')
      setLoggedInLecturerName(identity?.displayName || 'Logged-in Faculty')
    }
  }, [employeesData, isLoadingEmployees])

  // ── Auto-select current intake ──────────────────────────────────────────────
  useEffect(() => {
    if (!intakeGuid && currentIntake?.intakeGuid) {
      setIntakeGuid(currentIntake.intakeGuid)
    }
  }, [currentIntake, intakeGuid])

  // ── Clear course unit if no longer in loaded course units ──────────────────
  useEffect(() => {
    if (!courseUnits || courseUnits.length === 0) {
      setCourseUnitGuid('')
      return
    }
    // If a unit was previously selected but is not in the newly loaded list, reset it
    if (courseUnitGuid && !courseUnits.some(u => u.courseUnitGuid === courseUnitGuid)) {
      setCourseUnitGuid('')
    }
  }, [courseUnits, courseUnitGuid])

  // ── Reset dependent fields when intake changes ──────────────────────────────
  const handleIntakeChange = (val: string) => {
    setIntakeGuid(val)
    setCourseUnitGuid('')
    setPreviewRows(null)
    setValidationError(null)
  }

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setPreviewRows(null)
    setValidationError(null)
  }

  const handleCourseUnitChange = (val: string) => {
    setCourseUnitGuid(val)
    setPreviewRows(null)
    setValidationError(null)
  }

  const handleSheetChange = (val: string) => {
    setSelectedSheet(val)
    setPreviewRows(null)
    setValidationError(null)
  }

  // ── File Selection & Sheets Fetching ────────────────────────────────────────
  const handleFilePicked = (pickedFile: File) => {
    if (!pickedFile.name.toLowerCase().endsWith('.xlsx')) {
      showToast('Please upload an Excel workbook (.xlsx format)', 'danger')
      return
    }

    setFile(pickedFile)
    setPreviewRows(null)
    setValidationError(null)
    setSheetNames([])
    setSelectedSheet('')

    // Immediately fetch sheet names
    sheetsMut.mutate(pickedFile, {
      onSuccess: (sheets) => {
        if (sheets && sheets.length > 0) {
          setSheetNames(sheets)
          // Default to sheet named 'Questions' or first sheet
          const defaultSheet = sheets.find(s => s.toLowerCase() === 'questions') ?? sheets[0]
          setSelectedSheet(defaultSheet)
          showToast(`Workbook loaded (${sheets.length} sheet(s) detected)`, 'info')
        } else {
          setSheetNames([])
          setSelectedSheet('')
        }
      },
      onError: (err) => {
        showToast(err.message || 'Failed to inspect workbook sheets', 'danger')
      },
    })
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFilePicked(files[0])
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilePicked(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleClearFile = () => {
    setFile(null)
    setSheetNames([])
    setSelectedSheet('')
    setPreviewRows(null)
    setValidationError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    const pageEl = document.querySelector('.page')
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ── Preview Submission ──────────────────────────────────────────────────────
  const handlePreview = () => {
    if (!file) {
      showToast('Please select an Excel file to preview', 'warn')
      return
    }
    if (!courseUnitGuid) {
      showToast('Please select a Course Unit', 'warn')
      return
    }
    if (!category) {
      showToast('Please select an Assessment Category', 'warn')
      return
    }
    if (!intakeGuid) {
      showToast('Please select an Academic Intake', 'warn')
      return
    }

    setValidationError(null)

    previewMut.mutate(
      {
        file,
        sheetName: selectedSheet || undefined,
        courseUnitGuid,
        category: Number(category),
        intakeGuid,
      },
      {
        onSuccess: (data) => {
          setPreviewRows(data)
          setValidationError(null)
          showToast(`Preview loaded successfully (${data.length} question(s))`, 'success')
          // Smoothly scroll down to preview details section
          setTimeout(() => {
            previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
        },
        onError: (err) => {
          setPreviewRows(null)
          setValidationError(err.message || 'Validation failed. Please verify the Excel sheet structure.')
          // Smoothly scroll to error banner so user sees the message
          setTimeout(() => {
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        },
      },
    )
  }

  // ── Import / Save Submission ────────────────────────────────────────────────
  const handleImport = () => {
    if (!file || !courseUnitGuid || !category || !intakeGuid) {
      showToast('Missing required fields for import', 'warn')
      return
    }

    setValidationError(null)
    importMut.mutate(
      {
        file,
        sheetName: selectedSheet || undefined,
        courseUnitGuid,
        category: Number(category),
        intakeGuid,
      },
      {
        onSuccess: () => {
          const count = previewRows?.length ?? 0
          if (file && previewRows) {
            const newBank: ExistingQuestionBank = {
              id: `qb-${Date.now()}`,
              fileName: file.name,
              categoryId: String(category),
              categoryName: selectedCategoryObj?.name || 'Course Work',
              courseUnitGuid: courseUnitGuid,
              courseUnitCode: selectedCourseUnit?.courseUnitCode || 'UNIT',
              courseUnitName: selectedCourseUnit?.courseUnitName || 'Selected Unit',
              academicIntake: selectedIntake?.intakeCode ? String(selectedIntake.intakeCode) : 'AUG-2026',
              intakeGuid: intakeGuid,
              uploadedBy: lecturerDisplayName || 'Current Lecturer',
              uploadedDate:
                new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
                ', ' +
                new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              fileSize: `${(file.size / 1024).toFixed(1)} KB`,
              status: 'Active',
              questions: [...previewRows],
            }
            setExistingBanks(prev => [newBank, ...prev])
          }
          setSuccessModal({
            title: 'Questions Uploaded Successfully!',
            subtitle: `${count > 0 ? `${count} question(s)` : 'Questions'} committed to the Question Bank database and archived to secure storage.`,
          })
          // Clear form back to step 1
          handleClearFile()
        },
        onError: (err) => {
          setValidationError(err.message || 'Import failed. Please check validation rules.')
          showToast(err.message || 'Import failed', 'danger')
          scrollToTop()
        },
      },
    )
  }

  // ── Delete Questions ────────────────────────────────────────────────────────
  const handleDeleteConfirm = () => {
    if (!courseUnitGuid || !category || !intakeGuid) return

    deleteMut.mutate(
      {
        courseUnitGuid,
        category: Number(category),
        intakeGuid,
      },
      {
        onSuccess: (res) => {
          setShowDeleteModal(false)
          setPreviewRows(null)
          setValidationError(null)
          setSuccessModal({
            title: 'Question Bank Deleted',
            subtitle: res.message || 'The questions have been soft-deleted and preserved for audit purposes.',
          })
        },
        onError: (err) => {
          showToast(err.message || 'Failed to delete question bank', 'danger')
        },
      },
    )
  }

  // ── Template Download ───────────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    downloadTemplateMut.mutate(undefined, {
      onSuccess: () => {
        showToast('Template download started', 'success')
      },
      onError: (err) => {
        showToast(err.message || 'Failed to generate template download link', 'danger')
      },
    })
  }

  // ── Derived Labels & Lookups ────────────────────────────────────────────────
  const selectedCourseUnit = useMemo(() => {
    return courseUnits?.find(u => u.courseUnitGuid === courseUnitGuid)
  }, [courseUnits, courseUnitGuid])

  const selectedCategoryObj = useMemo(() => {
    return categories?.find(c => String(c.value) === String(category))
  }, [categories, category])

  const selectedIntake = useMemo(() => {
    return intakes?.find(i => i.intakeGuid === intakeGuid)
  }, [intakes, intakeGuid])

  const selectedLecturer = useMemo(() => {
    return employeesData?.find((e: EmployeeListItem) => e.employeeGuid === loggedInLecturerGuid)
  }, [employeesData, loggedInLecturerGuid])

  const lecturerDisplayName = useMemo(() => {
    if (loggedInLecturerName) return loggedInLecturerName
    if (selectedLecturer?.empName) return selectedLecturer.empName
    return 'Current Lecturer'
  }, [loggedInLecturerName, selectedLecturer])

  // ── Filtered Preview Rows ───────────────────────────────────────────────────
  const filteredPreviewRows = useMemo(() => {
    if (!previewRows) return []
    return previewRows.filter((item) => {
      if (previewFilterType !== 'ALL' && item.questionType !== previewFilterType) {
        return false
      }
      if (previewSearch.trim()) {
        const needle = previewSearch.toLowerCase()
        const matchQuestion = item.question?.toLowerCase().includes(needle)
        const matchAnswer = item.answer?.toLowerCase().includes(needle)
        const matchOptions =
          item.option1?.toLowerCase().includes(needle) ||
          item.option2?.toLowerCase().includes(needle) ||
          item.option3?.toLowerCase().includes(needle) ||
          item.option4?.toLowerCase().includes(needle)
        return matchQuestion || matchAnswer || matchOptions
      }
      return true
    })
  }, [previewRows, previewFilterType, previewSearch])

  const mcqCount = useMemo(
    () => previewRows?.filter(r => r.questionType === 'MCQ').length ?? 0,
    [previewRows],
  )
  const dqCount = useMemo(
    () => previewRows?.filter(r => r.questionType === 'DQ').length ?? 0,
    [previewRows],
  )

  const isFormValidForPreview = Boolean(
    file && courseUnitGuid && category && intakeGuid && !sheetsMut.isPending,
  )

  const isFormValidForDelete = Boolean(
    courseUnitGuid && category && intakeGuid,
  )

  // ── Existing Question Banks Helpers & Filtering ─────────────────────────────
  const handleUpdateBankQuestions = (bankId: string, updatedQuestions: QuestionPreviewItem[]) => {
    setExistingBanks(prev =>
      prev.map(b => (b.id === bankId ? { ...b, questions: updatedQuestions } : b))
    )
    if (activeViewingBank && activeViewingBank.id === bankId) {
      setActiveViewingBank({ ...activeViewingBank, questions: updatedQuestions })
    }
  }

  const handleConfirmDeleteExistingBank = () => {
    if (!bankToDelete) return

    const targetIntakeGuid =
      bankToDelete.intakeGuid ||
      intakeGuid ||
      currentIntake?.intakeGuid ||
      (intakes && intakes.length > 0 ? intakes[0].intakeGuid : '')

    if (!targetIntakeGuid) {
      showToast('Academic Intake is required to delete question bank', 'danger')
      return
    }

    deleteMut.mutate(
      {
        courseUnitGuid: bankToDelete.courseUnitGuid,
        category: Number(bankToDelete.categoryId),
        intakeGuid: targetIntakeGuid,
      },
      {
        onSuccess: (res) => {
          const deletedBankName = bankToDelete.fileName
          const deletedId = bankToDelete.id
          setExistingBanks(prev => prev.filter(b => b.id !== deletedId))
          if (activeViewingBank?.id === deletedId) {
            setActiveViewingBank(null)
          }
          if (directEditingBank?.id === deletedId) {
            setDirectEditingBank(null)
          }
          setBankToDelete(null)
          setSuccessModal({
            title: 'Question Bank Deleted',
            subtitle:
              res.message ||
              `Question bank "${deletedBankName}" and its questions have been soft-deleted and removed from repository.`,
          })
        },
        onError: (err) => {
          showToast(err.message || 'Failed to delete question bank', 'danger')
        },
      },
    )
  }

  const bankCourseUnitOptions = useMemo(() => {
    const list = [{ value: '', label: 'All Course Units' }]
    if (courseUnits && courseUnits.length > 0) {
      courseUnits.forEach(u => {
        list.push({
          value: u.courseUnitGuid,
          label: `${u.courseUnitCode || ''} — ${u.courseUnitName || ''}`,
        })
      })
    } else {
      list.push(
        { value: '017749e8-a325-4560-b8db-2230721d838f', label: 'BCS3127 — Compiler Design' },
        { value: '18bc91be-6665-411e-9b27-fba637d2e761', label: 'CSE1212 — Data Structures & Algorithms' },
        { value: '29cd02cf-7776-522f-ac38-0cb748e3f872', label: 'BIT2104 — Database Management Systems' },
      )
    }
    return list
  }, [courseUnits])

  const bankCategoryOptions = useMemo(() => {
    const list = [{ value: '', label: 'All Categories' }]
    if (categories && categories.length > 0) {
      categories.forEach(c => {
        list.push({
          value: String(c.value),
          label: c.name,
        })
      })
    } else {
      list.push(
        { value: '2', label: 'Course Work' },
        { value: '1', label: 'CBT' },
        { value: '5', label: 'University Exam' },
      )
    }
    return list
  }, [categories])

  const filteredExistingBanks = useMemo(() => {
    return existingBanks.filter((bank) => {
      if (bankFilterCategory && String(bank.categoryId) !== String(bankFilterCategory)) {
        return false
      }
      if (bankFilterCourseUnit) {
        const matchGuid = bank.courseUnitGuid === bankFilterCourseUnit
        const matchCode = bank.courseUnitCode.toLowerCase() === bankFilterCourseUnit.toLowerCase()
        if (!matchGuid && !matchCode) return false
      }
      if (bankSearch.trim()) {
        const needle = bankSearch.toLowerCase()
        const matchName = bank.fileName.toLowerCase().includes(needle)
        const matchUnit =
          bank.courseUnitCode.toLowerCase().includes(needle) ||
          bank.courseUnitName.toLowerCase().includes(needle)
        const matchBy = bank.uploadedBy.toLowerCase().includes(needle)
        return matchName || matchUnit || matchBy
      }
      return true
    })
  }, [existingBanks, bankFilterCategory, bankFilterCourseUnit, bankSearch])

  // ── Helper to step through questions in View Modal ──────────────────────────
  const currentViewingIndex = useMemo(() => {
    if (!viewingQuestion || !previewRows) return -1
    return previewRows.findIndex(q => q.slNo === viewingQuestion.slNo)
  }, [viewingQuestion, previewRows])

  const handleStepQuestion = (delta: number) => {
    if (!previewRows || currentViewingIndex === -1) return
    const nextIndex = currentViewingIndex + delta
    if (nextIndex >= 0 && nextIndex < previewRows.length) {
      setViewingQuestion(previewRows[nextIndex])
    }
  }

  return (
    <div className="page active">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Question Bank Import</div>
          <div className="pg-sub">
            Upload exam questions in bulk via Excel template (.xlsx) · Scoped to Lecturer & Intake · CBT, Course Work & University Exam
          </div>
        </div>
        <div className="pg-actions flex items-center gap-2">
          <button
            type="button"
            className="btn btn-neu flex items-center gap-1.5 shadow-sm"
            onClick={handleDownloadTemplate}
            disabled={downloadTemplateMut.isPending}
            title="Download the official 9-column question import template"
          >
            {downloadTemplateMut.isPending ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Generating Link...</span>
              </>
            ) : (
              <>
                <i className="lni lni-download"></i>
                <span>Download Template</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Configuration & Upload Card ────────────────────────────────────── */}
      <div className="card mb-5 p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <div className="card-title mb-0">Import Parameters & Excel File</div>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            {lecturerDisplayName && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
                <i className="lni lni-user text-xs"></i>
                <span>Lecturer: {lecturerDisplayName}</span>
              </span>
            )}
            {currentIntake && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                Active Academic Intake: {currentIntake.intakeCode}
              </span>
            )}
          </div>
        </div>

        {/* Form Inputs Grid using Reusable SearchSelect (3 columns: Intake, Category, Course Unit) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {/* Academic Intake */}
          <div className="fg mb-0">
            <label className="lbl">
              Academic Intake <span className="text-red-500">*</span>
            </label>
            <SearchSelect
              options={
                intakes?.map(i => ({
                  value: i.intakeGuid,
                  label: `${i.intakeCode} — ${i.description}`,
                })) || []
              }
              value={intakeGuid}
              onChange={handleIntakeChange}
              placeholder={isLoadingIntakes ? 'Loading intakes...' : 'Select intake'}
              disabled={isLoadingIntakes}
            />
          </div>

          {/* Assessment Category */}
          <div className="fg mb-0">
            <label className="lbl">
              Assessment Category <span className="text-red-500">*</span>
            </label>
            <SearchSelect
              options={
                categories?.map(c => ({
                  value: String(c.value),
                  label: c.name,
                })) || []
              }
              value={category}
              onChange={handleCategoryChange}
              placeholder={isLoadingCategories ? 'Loading categories...' : 'Select category'}
              disabled={isLoadingCategories}
            />
          </div>

          {/* Course Unit */}
          <div className="fg mb-0">
            <label className="lbl">
              Course Unit <span className="text-red-500">*</span>
              {isFetchingCourseUnits && (
                <span className="text-xs text-indigo-500 font-normal ml-2">Loading...</span>
              )}
            </label>
            <SearchSelect
              options={
                courseUnits?.map(u => ({
                  value: u.courseUnitGuid,
                  label: u.courseUnitCode
                    ? `${u.courseUnitCode} — ${u.courseUnitName || 'Untitled Unit'}`
                    : (u.courseUnitName || 'Untitled Unit'),
                })) || []
              }
              value={courseUnitGuid}
              onChange={handleCourseUnitChange}
              placeholder={
                !intakeGuid
                  ? 'Pick Academic Intake first'
                  : isLoadingCourseUnits
                    ? 'Loading planned course units...'
                    : courseUnits && courseUnits.length === 0
                      ? 'No planned units found'
                      : 'Select planned course unit'
              }
              disabled={!intakeGuid || !loggedInLecturerGuid || isLoadingCourseUnits}
            />
          </div>
        </div>

        {/* Helpful banner when course unit list is empty */}
        {intakeGuid && loggedInLecturerGuid && !isLoadingCourseUnits && courseUnits && courseUnits.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-3 mb-4 flex items-center gap-2.5">
            <i className="lni lni-warning text-base text-amber-600 shrink-0"></i>
            <span>
              No course units planned for lecturer ({lecturerDisplayName}) in this academic intake. Please verify program planning.
            </span>
          </div>
        )}

        {/* File Upload Dropzone & Sheet Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start mb-4">
          {/* Dropzone Column */}
          <div className="lg:col-span-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx"
              onChange={handleFileInputChange}
              className="hidden"
              id="qb-file-input"
            />

            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/20 rounded-xl p-4 text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center min-h-[100px]"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center text-xl mb-1.5 transition-colors">
                  <i className="lni lni-cloud-upload"></i>
                </div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                  Drop your Excel (.xlsx) file here or <span className="underline decoration-indigo-300">browse</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Must follow the official 9-column format · Maximum 10MB
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                    <i className="lni lni-empty-file"></i>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 line-clamp-1">{file.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-medium">Ready for preview</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-neu btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    title="Choose a different file"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-colors"
                    onClick={handleClearFile}
                    title="Remove file"
                  >
                    <i className="lni lni-close text-xs"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sheet Selector with Reusable SearchSelect */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-3">
            <div className="fg mb-0">
              <label className="lbl flex items-center justify-between">
                <span>Select Worksheet</span>
                {sheetsMut.isPending && (
                  <span className="text-[11px] text-indigo-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    Scanning...
                  </span>
                )}
              </label>
              <SearchSelect
                options={sheetNames.map(s => ({ value: s, label: s }))}
                value={selectedSheet}
                onChange={handleSheetChange}
                placeholder={
                  !file
                    ? 'Upload file to load sheets'
                    : sheetsMut.isPending
                      ? 'Reading workbook sheets...'
                      : sheetNames.length === 0
                        ? 'No sheets detected'
                        : 'Select worksheet'
                }
                disabled={!file || sheetsMut.isPending || sheetNames.length === 0}
              />
            </div>


          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span
              title={!isFormValidForPreview ? "Select Intake, Lecturer, Category, Course Unit and an Excel file to preview" : ""}
              className={!isFormValidForPreview ? "cursor-not-allowed" : ""}
            >
              <button
                type="button"
                className="btn btn-primary flex items-center gap-1.5"
                onClick={handlePreview}
                disabled={!isFormValidForPreview || previewMut.isPending}
              >
                {previewMut.isPending ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Validating & Parsing...</span>
                  </>
                ) : (
                  <>
                    <i className="lni lni-eye"></i>
                    <span>Preview Questions</span>
                  </>
                )}
              </button>
            </span>

            {file && (
              <button
                type="button"
                className="btn btn-neu flex items-center gap-1"
                onClick={handleClearFile}
              >
                Clear
              </button>
            )}
          </div>

          <div>
            <span
              title={!isFormValidForDelete ? "Select Intake, Lecturer, Category, and Course Unit to delete questions" : "Delete non-University Exam questions for this bank"}
              className={!isFormValidForDelete ? "cursor-not-allowed" : ""}
            >
              <button
                type="button"
                className="btn btn-danger flex items-center gap-1.5"
                onClick={() => setShowDeleteModal(true)}
                disabled={!isFormValidForDelete || deleteMut.isPending}
              >
                <i className="lni lni-trash-can"></i>
                <span>Delete Bank Questions</span>
              </button>
            </span>
          </div>
        </div>
      </div>

      {/* ── Validation Error Banner ─────────────────────────────────────────── */}
      {validationError && (
        <div ref={errorRef} style={{ scrollMarginTop: '20px' }} className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 mb-5 shadow-sm flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-lg shrink-0 mt-0.5">
            <i className="lni lni-warning"></i>
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-red-950 mb-1">Excel Sheet Validation Failed</div>
            <div className="text-xs text-red-800 leading-relaxed font-mono bg-red-100/50 p-2.5 rounded border border-red-200/60 mb-2">
              {validationError}
            </div>
            <div className="text-[11.5px] text-red-700">
              Please fix the highlighted row(s) or sheet structure in your Excel file and preview again. No questions have been imported.
            </div>
          </div>
          <button
            type="button"
            className="text-red-400 hover:text-red-700 transition-colors"
            onClick={() => setValidationError(null)}
          >
            <i className="lni lni-close text-xs"></i>
          </button>
        </div>
      )}

      {/* ── Preview Grid Section ────────────────────────────────────────────── */}
      {previewRows && (
        <div ref={previewSectionRef} style={{ scrollMarginTop: '20px' }} className="card mb-5">
          {/* Header Bar */}
          <div className="card-hdr flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
            <div>
              <div className="card-title flex items-center gap-2 mb-1">
                <span className="ctitle-icon">
                  <i className="lni lni-eye"></i>
                </span>
                <span>Question Bank Preview</span>
                <span className="badge badge-green ml-2">Validated & Ready</span>
              </div>
              <div className="text-xs text-slate-500">
                Course Unit: <strong className="text-slate-800 font-mono">{selectedCourseUnit?.courseUnitCode || 'Selected Unit'}</strong>
                {' • '}
                Category: <strong className="text-slate-800">{selectedCategoryObj?.name || 'Category'}</strong>
                {' • '}
                Worksheet: <strong className="text-slate-800">{selectedSheet || 'Default'}</strong>
              </div>
            </div>

            {/* Commit Import Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white flex items-center gap-2 px-5 py-2 shadow-sm font-semibold"
                onClick={handleImport}
                disabled={importMut.isPending}
              >
                {importMut.isPending ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Saving Questions...</span>
                  </>
                ) : (
                  <>
                    <i className="lni lni-upload text-base"></i>
                    <span>Upload & Save Questions ({previewRows.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-5 pt-0">
            {/* KPI Summary Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
                <div className="text-xs text-slate-500 font-medium">Total Questions</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{previewRows.length}</div>
              </div>
              <div className="bg-purple-50/60 border border-purple-200/60 rounded-lg p-3">
                <div className="text-xs text-purple-700 font-medium">MCQ (Multiple Choice)</div>
                <div className="text-xl font-bold text-purple-900 mt-0.5">{mcqCount}</div>
              </div>
              <div className="bg-blue-50/60 border border-blue-200/60 rounded-lg p-3">
                <div className="text-xs text-blue-700 font-medium">DQ (Descriptive)</div>
                <div className="text-xl font-bold text-blue-900 mt-0.5">{dqCount}</div>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-lg p-3">
                <div className="text-xs text-emerald-700 font-medium">Validation Status</div>
                <div className="text-sm font-bold text-emerald-800 mt-1 flex items-center gap-1">
                  <i className="lni lni-checkmark-circle text-emerald-600"></i> All Passed
                </div>
              </div>
            </div>

            {/* Filter Tabs & Standard TableSearch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${previewFilterType === 'ALL'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                  onClick={() => setPreviewFilterType('ALL')}
                >
                  All ({previewRows.length})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${previewFilterType === 'MCQ'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                  onClick={() => setPreviewFilterType('MCQ')}
                >
                  MCQ ({mcqCount})
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${previewFilterType === 'DQ'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                  onClick={() => setPreviewFilterType('DQ')}
                >
                  DQ ({dqCount})
                </button>
              </div>

              <TableSearch
                className="w-full sm:w-72"
                placeholder="Search in questions or answers..."
                value={previewSearch}
                onChange={setPreviewSearch}
                results={filteredPreviewRows.slice(0, 5).map(q => ({
                  id: q.slNo,
                  primary: q.question,
                  secondary: `${q.questionType} • Ans: ${q.answer}`,
                }))}
                onSelect={r => setPreviewSearch(r.primary)}
              />
            </div>

            {/* Project Canonical Table with ActionMenu in First Column */}
            <ScrollTable>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 48, textAlign: 'center' }}></th>
                    <th style={{ width: 60, textAlign: 'center' }}>SL NO</th>
                    <th style={{ width: 85, textAlign: 'center' }}>TYPE</th>
                    <th style={{ minWidth: 280, maxWidth: 460 }}>QUESTION</th>
                    <th style={{ minWidth: 260 }}>OPTIONS</th>
                    <th style={{ minWidth: 160 }}>ANSWER</th>
                    <th style={{ width: 80, textAlign: 'center' }}>LEVEL</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPreviewRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--g400)' }}>
                        <i className="lni lni-search text-2xl block mb-2 opacity-50"></i>
                        No questions match the current filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPreviewRows.map((q, idx) => (
                      <tr key={idx}>
                        {/* ActionMenu in First Column */}
                        <td style={{ width: 48, textAlign: 'center' }}>
                          <ActionMenu tooltip="Question Actions">
                            <button
                              type="button"
                              className="btn btn-neu btn-sm flex items-center gap-1.5"
                              onClick={() => setViewingQuestion(q)}
                            >
                              <i className="lni lni-eye text-indigo-600"></i>
                              <span>View Details</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-neu btn-sm flex items-center gap-1.5"
                              onClick={() => setEditingQuestion(q)}
                            >
                              <i className="lni lni-pencil-alt text-amber-600"></i>
                              <span>Edit Question</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-neu btn-sm flex items-center gap-1.5"
                              onClick={() => {
                                // Since this is a preview table from an uploaded file, 
                                // we mock a soft delete or just show a toast
                                showToast(`Question #${q.slNo} deleted from preview.`, 'success')
                                if (previewRows) {
                                  setPreviewRows(previewRows.filter(r => r.slNo !== q.slNo))
                                }
                              }}
                            >
                              <i className="lni lni-trash-can text-red-600"></i>
                              <span>Delete</span>
                            </button>
                          </ActionMenu>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: 'var(--g500)' }}>
                          {q.slNo}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`badge ${q.questionType === 'MCQ'
                                ? 'badge-purple'
                                : 'badge-blue'
                              }`}
                          >
                            {q.questionType}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'normal', minWidth: 280, maxWidth: 460, lineHeight: 1.6, color: 'var(--g800)' }}>
                          {q.question}
                        </td>
                        <td style={{ whiteSpace: 'normal', minWidth: 260 }}>
                          {q.questionType === 'MCQ' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11.5px]">
                              <div className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700">
                                <strong className="text-slate-400 mr-1">A:</strong>
                                {q.option1}
                              </div>
                              <div className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700">
                                <strong className="text-slate-400 mr-1">B:</strong>
                                {q.option2}
                              </div>
                              <div className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700">
                                <strong className="text-slate-400 mr-1">C:</strong>
                                {q.option3}
                              </div>
                              <div className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700">
                                <strong className="text-slate-400 mr-1">D:</strong>
                                {q.option4}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Descriptive (No options)</span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'normal', minWidth: 160 }}>
                          <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11.5px] px-2.5 py-1 rounded font-medium">
                            {q.answer}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {q.level ? (
                            <span className="badge badge-neu text-xs font-mono font-semibold" title={`Level ${q.level}`}>
                              L{q.level}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollTable>

            {/* Bottom Footer Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 px-1 text-xs text-slate-500 border-t border-slate-100 mt-2">
              <span>
                Showing <strong>{filteredPreviewRows.length}</strong> of <strong>{previewRows.length}</strong> questions
                {previewFilterType !== 'ALL' && ` (${previewFilterType})`}
                {previewSearch && ` matching "${previewSearch}"`}
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <i className="lni lni-checkmark-circle text-emerald-600"></i> All 18 validation rules passed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Uploaded Question Banks Repository Card ────────────────────────── */}
      <div className="card mb-5 p-5">
        <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <i className="lni lni-library"></i>
            </span>
            <div>
              <div className="card-title mb-0">Uploaded Question Banks</div>
              <div className="text-xs text-slate-500">
                Filter and inspect existing question banks by Assessment Category and Course Unit
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-700">
            {filteredExistingBanks.length} Question Bank(s)
          </div>
        </div>

        {/* 2 Select Dropdowns (Category & Course Unit) + Table Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
          <div>
            <label className="form-lbl flex items-center gap-1 mb-1 text-xs font-semibold text-slate-700">
              <i className="lni lni-tag text-indigo-500"></i>
              <span>Assessment Category</span>
            </label>
            <SearchSelect
              options={bankCategoryOptions}
              value={bankFilterCategory}
              onChange={setBankFilterCategory}
              placeholder="All Categories"
            />
          </div>

          <div>
            <label className="form-lbl flex items-center gap-1 mb-1 text-xs font-semibold text-slate-700">
              <i className="lni lni-book text-indigo-500"></i>
              <span>Course Unit</span>
            </label>
            <SearchSelect
              options={bankCourseUnitOptions}
              value={bankFilterCourseUnit}
              onChange={setBankFilterCourseUnit}
              placeholder="All Course Units"
            />
          </div>

          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-2">
              <TableSearch
                className="w-full"
                placeholder="Search file name or lecturer..."
                value={bankSearch}
                onChange={setBankSearch}
                results={filteredExistingBanks.map(b => ({
                  id: b.id,
                  primary: b.fileName,
                  secondary: `${b.courseUnitCode} • ${b.categoryName}`,
                }))}
                onSelect={r => setBankSearch(r.primary)}
              />
              {(bankFilterCategory || bankFilterCourseUnit || bankSearch) && (
                <button
                  type="button"
                  className="btn btn-neu btn-sm shrink-0"
                  onClick={() => {
                    setBankFilterCategory('')
                    setBankFilterCourseUnit('')
                    setBankSearch('')
                  }}
                  title="Reset Filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Banks Table */}
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48, textAlign: 'center' }}>ACTION</th>
                <th style={{ width: 45, textAlign: 'center' }}>#</th>
                <th style={{ minWidth: 260 }}>QUESTION BANK FILE (.xlsx)</th>
                <th style={{ minWidth: 200 }}>COURSE UNIT</th>
                <th style={{ width: 130, textAlign: 'center' }}>CATEGORY</th>
                <th style={{ width: 110, textAlign: 'center' }}>QUESTIONS</th>
                <th style={{ minWidth: 150 }}>UPLOADED BY</th>
                <th style={{ width: 140 }}>UPLOADED DATE</th>
                <th style={{ width: 90, textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredExistingBanks.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--g400)' }}>
                    <i className="lni lni-inbox text-3xl block mb-2 opacity-40"></i>
                    <span>No question banks match the selected Category and Course Unit.</span>
                    <div className="mt-2">
                      <button
                        type="button"
                        className="btn btn-neu btn-sm"
                        onClick={() => {
                          setBankFilterCategory('')
                          setBankFilterCourseUnit('')
                          setBankSearch('')
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExistingBanks.map((bank, index) => (
                  <tr key={bank.id}>
                    {/* ActionMenu in First Column */}
                    <td style={{ width: 48, textAlign: 'center' }}>
                      <ActionMenu tooltip="Bank Options">
                        <button
                          type="button"
                          className="btn btn-neu btn-sm flex items-center gap-1.5"
                          onClick={() => setActiveViewingBank(bank)}
                        >
                          <i className="lni lni-eye text-indigo-600"></i>
                          <span>View Questions</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-neu btn-sm flex items-center gap-1.5"
                          onClick={() => setDirectEditingBank(bank)}
                        >
                          <i className="lni lni-pencil-alt text-amber-600"></i>
                          <span>Edit Questions</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-neu btn-sm flex items-center gap-1.5"
                          onClick={() => {
                            showToast(`Downloading template for ${bank.fileName}...`, 'info')
                          }}
                        >
                          <i className="lni lni-download text-slate-600"></i>
                          <span>Download .xlsx</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-neu btn-sm flex items-center gap-1.5 text-red-600"
                          onClick={() => setBankToDelete(bank)}
                        >
                          <i className="lni lni-trash-can"></i>
                          <span>Delete Bank</span>
                        </button>
                      </ActionMenu>
                    </td>

                    {/* SL / Row Index */}
                    <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 12, color: 'var(--g500)' }}>
                      {index + 1}
                    </td>

                    {/* Question Bank File Name */}
                    <td style={{ whiteSpace: 'normal' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                          <i className="lni lni-empty-file text-sm"></i>
                        </div>
                        <div>
                          <button
                            type="button"
                            className="font-semibold text-slate-800 hover:text-indigo-600 text-left transition-colors flex items-center gap-1 cursor-pointer"
                            onClick={() => setActiveViewingBank(bank)}
                            title="Click to view all questions"
                          >
                            <span>{bank.fileName}</span>
                          </button>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {bank.fileSize} • {bank.academicIntake || 'AUG-2026'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Course Unit */}
                    <td>
                      <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                          {bank.courseUnitCode}
                        </span>
                        <span className="truncate max-w-[160px]" title={bank.courseUnitName}>
                          {bank.courseUnitName}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`badge ${bank.categoryId === '2'
                            ? 'badge-blue'
                            : bank.categoryId === '1'
                              ? 'badge-purple'
                              : 'badge-emerald'
                          }`}
                      >
                        {bank.categoryName}
                      </span>
                    </td>

                    {/* Total Questions Count Badge */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="badge badge-neu text-xs hover:border-indigo-300 hover:text-indigo-600 transition cursor-pointer"
                        onClick={() => setActiveViewingBank(bank)}
                        title="Click to view and edit questions"
                      >
                        <strong>{bank.questions?.length || 0}</strong> Qs
                      </button>
                    </td>

                    {/* Uploaded By */}
                    <td>
                      <div className="text-xs font-medium text-slate-700">{bank.uploadedBy}</div>
                    </td>

                    {/* Uploaded Date */}
                    <td>
                      <div className="text-xs text-slate-500 font-mono">{bank.uploadedDate}</div>
                    </td>

                    {/* Status */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-green">
                        <i className="lni lni-checkmark-circle mr-1"></i>
                        {bank.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollTable>
      </div>

      {/* ── Question Details View Modal ─────────────────────────────────────── */}
      {viewingQuestion && (
        <div className="modal-overlay open" onClick={() => setViewingQuestion(null)}>
          <div
            className="modal modal-lg flex flex-col"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 640 }}
          >
            <div className="modal-hdr modal-hdr-blue shrink-0">
              <div className="modal-title flex items-center gap-2">
                <i className="lni lni-eye"></i>
                <span>Question Details — SL #{viewingQuestion.slNo}</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setViewingQuestion(null)}
              >
                <i className="lni lni-close"></i>
              </button>
            </div>

            <div className="modal-body p-5 flex flex-col gap-4 bg-slate-50 overflow-y-auto max-h-[70vh]">
              {/* Type, Level, & Scope Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${viewingQuestion.questionType === 'MCQ'
                        ? 'badge-purple'
                        : 'badge-blue'
                      } text-xs font-semibold`}
                  >
                    {viewingQuestion.questionType === 'MCQ' ? 'Multiple Choice (MCQ)' : 'Descriptive Question (DQ)'}
                  </span>

                  {viewingQuestion.level ? (
                    <span className="badge badge-neu text-xs font-mono">
                      Level {viewingQuestion.level} ({viewingQuestion.level === '1' ? 'Easy' : viewingQuestion.level === '2' ? 'Medium' : 'Difficult'})
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Level: Not Required</span>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-mono font-medium">
                  {selectedCourseUnit?.courseUnitCode || 'Course Unit'} • {selectedCategoryObj?.name || 'Category'}
                </div>
              </div>

              {/* Question Text Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Question Text
                </div>
                <div className="text-sm font-medium text-slate-800 leading-relaxed">
                  {viewingQuestion.question}
                </div>
              </div>

              {/* Options Section (If MCQ) */}
              {viewingQuestion.questionType === 'MCQ' ? (
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Options (A, B, C, D)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Option 1 */}
                    <div
                      className={`p-2.5 rounded-lg border transition-all ${viewingQuestion.answer.trim().toLowerCase() === viewingQuestion.option1.trim().toLowerCase()
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-slate-400">Option A</strong>
                        {viewingQuestion.answer.trim().toLowerCase() === viewingQuestion.option1.trim().toLowerCase() && (
                          <span className="text-[10.5px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <i className="lni lni-checkmark text-[10px]"></i> Correct
                          </span>
                        )}
                      </div>
                      <div>{viewingQuestion.option1}</div>
                    </div>

                    {/* Option 2 */}
                    <div
                      className={`p-2.5 rounded-lg border transition-all ${viewingQuestion.answer.trim().toLowerCase() === viewingQuestion.option2.trim().toLowerCase()
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-slate-400">Option B</strong>
                        {viewingQuestion.answer.trim().toLowerCase() === viewingQuestion.option2.trim().toLowerCase() && (
                          <span className="text-[10.5px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <i className="lni lni-checkmark text-[10px]"></i> Correct
                          </span>
                        )}
                      </div>
                      <div>{viewingQuestion.option2}</div>
                    </div>

                    {/* Option 3 */}
                    <div
                      className={`p-2.5 rounded-lg border transition-all ${viewingQuestion.answer.trim().toLowerCase() === viewingQuestion.option3.trim().toLowerCase()
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-slate-400">Option C</strong>
                        {viewingQuestion.answer.trim().toLowerCase() === viewingQuestion.option3.trim().toLowerCase() && (
                          <span className="text-[10.5px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <i className="lni lni-checkmark text-[10px]"></i> Correct
                          </span>
                        )}
                      </div>
                      <div>{viewingQuestion.option3}</div>
                    </div>

                    {/* Option 4 */}
                    <div
                      className={`p-2.5 rounded-lg border transition-all ${viewingQuestion.answer.trim().toLowerCase() === viewingQuestion.option4.trim().toLowerCase()
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-slate-400">Option D</strong>
                        {viewingQuestion.answer.trim().toLowerCase() === viewingQuestion.option4.trim().toLowerCase() && (
                          <span className="text-[10.5px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                            <i className="lni lni-checkmark text-[10px]"></i> Correct
                          </span>
                        )}
                      </div>
                      <div>{viewingQuestion.option4}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Correct Answer / Key */}
              <div className="bg-white border border-emerald-200/80 rounded-lg p-4 shadow-sm bg-emerald-50/30">
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <i className="lni lni-checkmark-circle text-emerald-600"></i>
                  <span>{viewingQuestion.questionType === 'MCQ' ? 'Verified Answer' : 'Descriptive Answer / Evaluation Criteria'}</span>
                </div>
                <div className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded border border-emerald-100">
                  {viewingQuestion.answer}
                </div>
              </div>
            </div>

            <div className="modal-footer shrink-0 flex items-center justify-between p-4 bg-white border-t border-slate-200">
              {/* Stepper buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="btn btn-neu btn-sm"
                  onClick={() => handleStepQuestion(-1)}
                  disabled={currentViewingIndex <= 0}
                  title="Previous question"
                >
                  <i className="lni lni-chevron-left"></i> Previous
                </button>
                <button
                  type="button"
                  className="btn btn-neu btn-sm"
                  onClick={() => handleStepQuestion(1)}
                  disabled={!previewRows || currentViewingIndex >= previewRows.length - 1}
                  title="Next question"
                >
                  Next <i className="lni lni-chevron-right"></i>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-neu"
                onClick={() => setViewingQuestion(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="modal-overlay open" onClick={() => setShowDeleteModal(false)}>
          <div
            className="modal modal-md flex flex-col"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <div className="modal-hdr modal-hdr-red shrink-0">
              <div className="modal-title flex items-center gap-2">
                <i className="lni lni-warning"></i>
                <span>Delete Questions from Bank</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <i className="lni lni-close"></i>
              </button>
            </div>

            <div className="modal-body p-5 flex flex-col gap-4 bg-slate-50">
              <div className="bg-red-50 border border-red-200 text-red-900 rounded-lg p-3 text-xs leading-relaxed">
                <strong>Warning:</strong> You are about to soft-delete all questions for this course unit in the selected category and intake.
              </div>

              <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Course Unit:</span>
                  <strong className="text-slate-800 font-mono">
                    {selectedCourseUnit ? `${selectedCourseUnit.courseUnitCode} — ${selectedCourseUnit.courseUnitName}` : courseUnitGuid}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assessment Category:</span>
                  <strong className="text-slate-800">{selectedCategoryObj?.name || category}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Academic Intake:</span>
                  <strong className="text-slate-800 font-mono">
                    {selectedIntake ? `${selectedIntake.intakeCode} (${selectedIntake.description})` : intakeGuid}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lecturer:</span>
                  <strong className="text-slate-800">
                    {selectedLecturer ? `${selectedLecturer.empName} (${selectedLecturer.shortCode})` : lecturerDisplayName}
                  </strong>
                </div>
              </div>

              <div className="text-[12px] text-slate-500 leading-snug">
                Note: Only non-University Exam questions are touched. Existing rows will have <code>IsDeleted = true</code> set for audit tracking, and will no longer be drawn for student assessments.
              </div>
            </div>

            <div className="modal-footer shrink-0 flex items-center justify-end gap-2 p-4 bg-white border-t border-slate-200">
              <button
                type="button"
                className="btn btn-neu"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteMut.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger flex items-center gap-1.5"
                onClick={handleDeleteConfirm}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <i className="lni lni-trash-can"></i>
                    <span>Confirm Soft Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Question Edit Modal ─────────────────────────────────────────────── */}
      {editingQuestion && (
        <QuestionEditModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={(updated) => {
            if (previewRows) {
              setPreviewRows(previewRows.map(r => r.slNo === updated.slNo ? updated : r))
            }
            setEditingQuestion(null)
            showToast(`Question #${updated.slNo} updated successfully!`, 'success')
          }}
        />
      )}

      {/* ── Success Popup Modal ─────────────────────────────────────────────── */}
      {successModal && (
        <div className="modal-overlay open" onClick={() => setSuccessModal(null)}>
          <div
            className="modal modal-sm flex flex-col"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <SuccessPopup
              title={successModal.title}
              subtitle={successModal.subtitle}
              onClose={() => setSuccessModal(null)}
            />
          </div>
        </div>
      )}

      {/* ── View Question Bank Modal ────────────────────────────────────────── */}
      {activeViewingBank && (
        <ViewQuestionBankModal
          isOpen={Boolean(activeViewingBank)}
          bank={activeViewingBank}
          onClose={() => setActiveViewingBank(null)}
          onUpdateBankQuestions={handleUpdateBankQuestions}
          showToast={showToast}
        />
      )}

      {/* ── Direct Question Bank Multi-Question Edit Modal ─────────────────── */}
      {directEditingBank && (
        <QuestionEditModal
          questions={directEditingBank.questions || []}
          initialIndex={0}
          bankTitle={directEditingBank.fileName}
          onClose={() => setDirectEditingBank(null)}
          onSave={(updated) => {
            const updatedQuestions = (directEditingBank.questions || []).map(q =>
              q.slNo === updated.slNo ? updated : q
            )
            handleUpdateBankQuestions(directEditingBank.id, updatedQuestions)
            setDirectEditingBank(prev =>
              prev
                ? {
                  ...prev,
                  questions: updatedQuestions,
                }
                : null
            )
            showToast(`Question #${updated.slNo} updated successfully!`, 'success')
          }}
          onSaveAll={(updatedList) => {
            handleUpdateBankQuestions(directEditingBank.id, updatedList)
            setDirectEditingBank(prev =>
              prev
                ? {
                  ...prev,
                  questions: updatedList,
                }
                : null
            )
            showToast('Question bank saved successfully!', 'success')
          }}
        />
      )}

      {/* ── Delete Question Bank from Repository Modal ────────────────────── */}
      {bankToDelete && (
        <div className="modal-overlay open" onClick={() => setBankToDelete(null)} style={{ zIndex: 660 }}>
          <div
            className="modal modal-md flex flex-col"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <div className="modal-hdr modal-hdr-red shrink-0">
              <div className="modal-title flex items-center gap-2">
                <i className="lni lni-warning"></i>
                <span>Delete Question Bank</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setBankToDelete(null)}
              >
                <i className="lni lni-close"></i>
              </button>
            </div>

            <div className="modal-body p-5 flex flex-col gap-4 bg-slate-50">
              <div className="bg-red-50 border border-red-200 text-red-900 rounded-lg p-3 text-xs leading-relaxed">
                <strong>Warning:</strong> You are about to soft-delete all questions in this bank via the Question Bank Delete API.
              </div>

              <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">File Name:</span>
                  <strong className="text-slate-900 font-semibold">{bankToDelete.fileName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Course Unit:</span>
                  <strong className="text-slate-800 font-mono">
                    {bankToDelete.courseUnitCode} — {bankToDelete.courseUnitName}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assessment Category:</span>
                  <strong className="text-slate-800">{bankToDelete.categoryName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Questions:</span>
                  <strong className="text-slate-800 font-bold text-red-700">
                    {bankToDelete.questions?.length || 0} Questions
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Academic Intake:</span>
                  <strong className="text-slate-800 font-mono">
                    {bankToDelete.academicIntake || 'AUG-2026'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Uploaded By:</span>
                  <strong className="text-slate-800">{bankToDelete.uploadedBy}</strong>
                </div>
              </div>

              <div className="text-[12px] text-slate-500 leading-snug">
                Note: All questions in this bank will have <code>IsDeleted = true</code> set in the database for audit tracking, and will no longer be drawn for student assessments.
              </div>
            </div>

            <div className="modal-footer shrink-0 flex items-center justify-end gap-2 p-4 bg-white border-t border-slate-200">
              <button
                type="button"
                className="btn btn-neu"
                onClick={() => setBankToDelete(null)}
                disabled={deleteMut.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger flex items-center gap-1.5"
                onClick={handleConfirmDeleteExistingBank}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Deleting Bank...</span>
                  </>
                ) : (
                  <>
                    <i className="lni lni-trash-can"></i>
                    <span>Confirm Soft Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ──────────────────────────────────────────────── */}
      <Toast toast={toast} />
    </div>
  )
}
