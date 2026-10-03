'use client'

import { useState, useEffect } from 'react'
import { TableSearch } from '@/components/TableSearch'
import { useResitAppCourseUnits, useResitApplications } from '@/hooks/assessment/useResitApplications'
import { SearchSelect } from '@/components/SearchSelect'
import { ScrollTable } from '@/components/ScrollTable'
import { EmptyState } from '@/components/EmptyState'
import { TableLoadingState } from '@/components/TableLoadingState'
import { Pagination } from '@/components/Pagination'

export default function ResitApplicationsListPage() {
  const [courseUnitGuid, setCourseUnitGuid] = useState<string>('')
  const [feeStatus, setFeeStatus] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState<string>('')
  const [searchInput, setSearchInput] = useState<string>('') // for debounce/enter key
  const [page, setPage] = useState<number>(1)
  const pageSize = 10

  const { data: courseUnits, isLoading: courseUnitsLoading } = useResitAppCourseUnits()
  
  const { data: resitAppsData, isLoading: appsLoading } = useResitApplications({
    courseUnitGuid: courseUnitGuid || undefined,
    feeStatus,
    search: search || undefined,
    page,
    pageSize
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput)
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput, search])

  const handleCourseUnitChange = (val: string) => {
    setCourseUnitGuid(val)
    setPage(1)
  }

  const handleStatusChange = (status: number | undefined) => {
    setFeeStatus(status)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const summary = resitAppsData?.summary || { total: 0, paid: 0, unpaid: 0 }
  const noActiveResit = resitAppsData && resitAppsData.resit === null

  return (
    <div className="page active">
      <div className="pg-hdr flex justify-between items-end">
        <div>
          <h1 className="pg-title">Resit Applications</h1>
          <p className="pg-sub">
            {resitAppsData?.resit?.refCode 
              ? `Applications for ${resitAppsData.resit.refCode}` 
              : 'View and manage student resit applications'}
          </p>
        </div>
      </div>

        <div className="card">
          <div className="card-hdr">
            <div className="card-title"><span className="ctitle-icon"><i className="lni lni-folder"></i></span> Applications List</div>
          </div>
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Tabs / Fee Status Filter */}
            <div className="flex bg-gray-100 p-1 rounded-lg w-full md:w-auto">
              <button 
                onClick={() => handleStatusChange(undefined)}
                className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${feeStatus === undefined ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-800'}`}
              >
                All ({summary.total})
              </button>
              <button 
                onClick={() => handleStatusChange(1)}
                className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${feeStatus === 1 ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Paid ({summary.paid})
              </button>
              <button 
                onClick={() => handleStatusChange(0)}
                className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${feeStatus === 0 ? 'bg-white shadow-sm text-rose-600' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Unpaid ({summary.unpaid})
              </button>
            </div>

            {/* Course Unit & Search */}
            <div className="flex gap-3 w-full md:w-auto flex-col sm:flex-row">
              <div className="w-full sm:w-64">
                <SearchSelect
                  placeholder="All Course Units"
                  value={courseUnitGuid}
                  onChange={handleCourseUnitChange}
                  disabled={courseUnitsLoading}
                  options={[
                    { value: '', label: 'All Course Units' },
                    ...(courseUnits ?? []).map((u: any) => ({
                      value: u.courseUnitGuid,
                      label: `${u.unitName} (${u.unitCode})`
                    }))
                  ]}
                />
              </div>
              
              <TableSearch
                className="w-full sm:w-64"
                placeholder="Search students or units..."
                value={searchInput}
                onChange={setSearchInput}
                results={[]}
                minChars={999}
              />
            </div>
          </div>

          <ScrollTable>
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="w-16">#</th>
                  <th>Student No</th>
                  <th>Student Name</th>
                  <th>Programme</th>
                  <th>Course Unit</th>
                  <th>Resit For</th>
                  <th className="text-center">Fee Status</th>
                </tr>
              </thead>
              <tbody>
                {appsLoading ? (
                  <TableLoadingState colSpan={7} title="Loading applications..." />
                ) : !resitAppsData || resitAppsData.applications.items.length === 0 ? (
                  <EmptyState colSpan={7} message="No applications found matching your criteria." />
                ) : (
                  resitAppsData?.applications.items.map((app, index) => (
                    <tr key={app.resitApplicationGuid}>
                      <td className="text-gray-500">{(page - 1) * pageSize + index + 1}</td>
                      <td className="font-medium text-primary whitespace-nowrap">{app.studentRegNo}</td>
                      <td>
                        <div className="font-semibold text-gray-800">{app.studentName}</div>
                        {(app.email || app.phone) && (
                          <div className="text-xs text-gray-500 flex gap-2 mt-1">
                            {app.email && <span><i className="lni lni-envelope"></i> {app.email}</span>}
                            {app.phone && <span><i className="lni lni-phone"></i> {app.phone}</span>}
                          </div>
                        )}
                      </td>
                      <td className="text-sm">
                        <div className="truncate max-w-[200px]" title={app.programName}>{app.programName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{app.campusName}</div>
                      </td>
                      <td>
                        <div className="font-medium text-gray-800">
                          {app.unitName} <span className="text-gray-500 text-sm">({app.unitCode})</span>
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {app.unitTypeName}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {app.cw && <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded text-xs font-semibold">CW</span>}
                          {app.ue && <span className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded text-xs font-semibold">UE</span>}
                        </div>
                      </td>
                      <td className="text-center">
                        {app.feeStatus === 1 ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-xs font-semibold">Paid</span>
                        ) : (
                          <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-xs font-semibold">Unpaid</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollTable>

          {/* Pagination */}
          {resitAppsData && resitAppsData.applications.totalCount > 0 && (
            <Pagination 
              page={page} 
              totalPages={Math.ceil(resitAppsData.applications.totalCount / pageSize)} 
              totalCount={resitAppsData.applications.totalCount} 
              itemLabel="applications" 
              onPageChange={setPage} 
            />
          )}
      </div>
    </div>
  )
}
