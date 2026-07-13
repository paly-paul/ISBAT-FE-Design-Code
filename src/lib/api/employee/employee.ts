import { apiGet, apiPost, apiPut } from '../client'

const MOCK_AUTH = process.env.NEXT_PUBLIC_AUTH_MOCK === 'true'

// Subset of Employee returned by GET /api/v1/users/employees list items —
// the create response above returns the full Employee shape instead.
export interface EmployeeListItem {
  employeeGuid: string
  shortCode: string
  empName: string
  title: string
  surname: string
  firstName: string
  sex: number
  status: string
}

interface EmployeeListResponse {
  items: EmployeeListItem[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

// Real backend shape returned by both GET /api/v1/users/employees (list
// items) and POST /api/v1/users/employees (create response) — the list
// response is a subset of these fields, the create response includes all of
// them.
export interface Employee {
  employeeGuid: string
  shortCode: string
  empName: string
  category: number
  title: string
  surname: string
  firstName: string
  otherName: string | null
  sex: number
  birthDate: string
  placeOfBirth: string
  intCountryCode: number
  natId: string
  nationalId: string | null
  emailId: string
  intReligion?: number | null
  maritalStatus: number
  countryName: string | null
  status?: string
  intDept?: number | null
  intDesignation?: number | null
}

// What's actually posted to create an employee. intDept/intDesignation are
// required by the backend's FluentValidation ("Select Department/Designation
// before proceeding!") even though the confirmed response shape above only
// marks them optional/nullable on read.
export interface CreateEmployeeInput {
  category: number
  categoryPrefix: string
  title: string
  surname: string
  firstName: string
  otherName: string | null
  sex: number
  birthDate: string
  placeOfBirth: string
  intCountryCode: number
  natId: string
  nationalId: string | null
  emailId: string
  intReligion: number | null
  maritalStatus: number
  intDept: number
  intDesignation: number
}

// Shaped after GET /api/v1/users/employees's sample response — backing
// store for both getEmployees and createEmployee while NEXT_PUBLIC_AUTH_MOCK
// is on, so a mock-created employee actually shows up in the list.
const mockEmployees: EmployeeListItem[] = [
  { employeeGuid: '487c8f38-9db6-45ee-897b-32e2942e8e21', shortCode: 'AD/00111', empName: 'DOE JOHN', title: 'Mr', surname: 'DOE', firstName: 'JOHN', sex: 1, status: 'Active' },
  { employeeGuid: 'b48bd2c6-6db1-4860-9e2e-0572cf92c079', shortCode: 'AD/00103', empName: 'DOE JOHN', title: 'Mr', surname: 'DOE', firstName: 'JOHN', sex: 1, status: 'Active' },
  { employeeGuid: 'e07dc913-e0c4-45c8-839e-64f93250b35e', shortCode: 'AD/00102', empName: 'DOE JOHN', title: 'Mr', surname: 'DOE', firstName: 'JOHN', sex: 1, status: 'Active' },
  { employeeGuid: 'ada0ced2-f3ca-4fd6-af9e-35cfc3f88415', shortCode: 'AD/00101', empName: 'DOE JOHN', title: 'Mr', surname: 'DOE', firstName: 'JOHN', sex: 1, status: 'Active' },
  { employeeGuid: 'e9c923f8-6abe-49e3-a3f9-2dcc6e1578ca', shortCode: 'AD/00091', empName: 'DOE JOHN', title: 'Mr', surname: 'DOE', firstName: 'JOHN', sex: 1, status: 'Active' },
  { employeeGuid: 'b2664414-50d6-4c5e-9bc6-6aed0737513b', shortCode: 'AD/00081', empName: 'DOE JOHN', title: 'Mr', surname: 'DOE', firstName: 'JOHN', sex: 1, status: 'Active' },
  { employeeGuid: '0f8cbe96-579d-42d2-b94d-9aee22edcdbf', shortCode: 'AD/00071', empName: 'DOE JOHN', title: 'Mr', surname: 'DOE', firstName: 'JOHN', sex: 1, status: 'Active' },
  { employeeGuid: '33703b3c-7e87-42e1-8726-8a9caf354bdd', shortCode: 'AD/00062', empName: 'DOE JOHN', title: 'Mr', surname: 'DOE', firstName: 'JOHN', sex: 1, status: 'Active' },
  { employeeGuid: 'e2945c12-b66f-4acc-84db-3dbf90ab1fa1', shortCode: 'AD/00061', empName: 'DOE JOHN', title: 'Mr', surname: 'DOE', firstName: 'JOHN', sex: 1, status: 'Active' },
  { employeeGuid: '4c9649c7-b0b2-4637-b7e8-ffd1cffa6b29', shortCode: 'AD/00051', empName: 'DOE JOHN', title: 'Mr', surname: 'DOE', firstName: 'JOHN', sex: 1, status: 'Active' },
]
let mockEmployeeSeq = 121

// Matches the real backend's empName composition, confirmed by comparing
// create/update responses: surname + firstName + otherName (when present),
// uppercased — e.g. surname 'DOE U', firstName 'JOHN U', otherName
// 'UPDATED' -> 'DOE U JOHN U UPDATED'.
function composeEmpName(surname: string, firstName: string, otherName: string | null): string {
  return [surname, firstName, otherName].filter(Boolean).join(' ').toUpperCase()
}

export function getEmployees(): Promise<EmployeeListItem[]> {
  if (MOCK_AUTH) return Promise.resolve(mockEmployees)
  return apiGet<EmployeeListResponse | null>('/api/v1/users/employees').then(data => data?.items ?? [])
}

// GET /api/v1/users/employees/{id} — full record for the Edit modal. The
// list endpoint above only returns a subset of fields (EmployeeListItem), so
// editing needs this separate per-id fetch to get birthDate, placeOfBirth,
// intCountryCode/countryName, natId/nationalId, maritalStatus, etc.
export function getEmployee(id: string): Promise<Employee> {
  if (MOCK_AUTH) {
    const listItem = mockEmployees.find(e => e.employeeGuid === id)
    if (!listItem) return Promise.reject(new Error('Employee not found'))
    const employee: Employee = {
      employeeGuid: listItem.employeeGuid,
      shortCode: listItem.shortCode,
      empName: listItem.empName,
      category: 1,
      title: listItem.title,
      surname: listItem.surname,
      firstName: listItem.firstName,
      otherName: null,
      sex: listItem.sex,
      birthDate: '1990-01-01T00:00:00',
      placeOfBirth: '',
      intCountryCode: 1,
      natId: '',
      nationalId: null,
      emailId: '',
      maritalStatus: 1,
      countryName: null,
      status: listItem.status,
      intDept: 1,
      intDesignation: 1,
    }
    return Promise.resolve(employee)
  }
  return apiGet<Employee>(`/api/v1/users/employees/${id}`)
}

export function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  if (MOCK_AUTH) {
    const employee: Employee = {
      employeeGuid: crypto.randomUUID(),
      shortCode: `${input.categoryPrefix}/${String(mockEmployeeSeq++).padStart(5, '0')}`,
      empName: composeEmpName(input.surname, input.firstName, input.otherName),
      category: input.category,
      title: input.title,
      surname: input.surname.toUpperCase(),
      firstName: input.firstName.toUpperCase(),
      otherName: input.otherName,
      sex: input.sex,
      birthDate: input.birthDate,
      placeOfBirth: input.placeOfBirth,
      intCountryCode: input.intCountryCode,
      natId: input.natId,
      nationalId: input.nationalId,
      emailId: input.emailId,
      intReligion: input.intReligion,
      maritalStatus: input.maritalStatus,
      countryName: null,
      status: 'Active',
      intDept: input.intDept,
      intDesignation: input.intDesignation,
    }
    mockEmployees.push({
      employeeGuid: employee.employeeGuid,
      shortCode: employee.shortCode,
      empName: employee.empName,
      title: employee.title,
      surname: employee.surname,
      firstName: employee.firstName,
      sex: employee.sex,
      status: employee.status ?? 'Active',
    })
    return Promise.resolve(employee)
  }
  return apiPost<Employee>('/api/v1/users/employees', input)
}

export function updateEmployee(id: string, input: CreateEmployeeInput): Promise<Employee> {
  if (MOCK_AUTH) {
    const listItem = mockEmployees.find(e => e.employeeGuid === id)
    if (!listItem) return Promise.reject(new Error('Employee not found'))
    const empName = composeEmpName(input.surname, input.firstName, input.otherName)
    listItem.title = input.title
    listItem.surname = input.surname.toUpperCase()
    listItem.firstName = input.firstName.toUpperCase()
    listItem.sex = input.sex
    listItem.empName = empName
    const employee: Employee = {
      employeeGuid: id,
      shortCode: listItem.shortCode,
      empName,
      category: input.category,
      title: input.title,
      surname: input.surname.toUpperCase(),
      firstName: input.firstName.toUpperCase(),
      otherName: input.otherName,
      sex: input.sex,
      birthDate: input.birthDate,
      placeOfBirth: input.placeOfBirth,
      intCountryCode: input.intCountryCode,
      natId: input.natId,
      nationalId: input.nationalId,
      emailId: input.emailId,
      intReligion: input.intReligion,
      maritalStatus: input.maritalStatus,
      countryName: null,
      status: listItem.status,
      intDept: input.intDept,
      intDesignation: input.intDesignation,
    }
    return Promise.resolve(employee)
  }
  return apiPut<Employee>(`/api/v1/users/employees/${id}`, input)
}
