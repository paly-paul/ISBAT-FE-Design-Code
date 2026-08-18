'use client'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'

export default function FacultyAssessmentSummary() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Faculty Assessment Summary</div>
          <div className="pg-sub">Pending actions and compliance status per faculty member</div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-neu">
            <i className="lni lni-download"></i> Export
          </button>
        </div>
      </div>

      <div className="card">
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>FACULTY</th>
                <th>SUBJECTS</th>
                <th>QP UPLOADED</th>
                <th>CW EVALUATED</th>
                <th>CBT SET</th>
                <th>REEVALS PENDING</th>
                <th>COMPLIANCE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-bullhorn"></i> Send Reminder</button>
                  </ActionMenu>
                </td>
                <td className="text-slate-900 font-bold">Tom Kizito</td>
                <td className="text-slate-700">2</td>
                <td><span className="badge badge-red">0 / 2</span></td>
                <td className="text-slate-400">—</td>
                <td><span className="badge badge-red">0 / 2</span></td>
                <td className="text-slate-700">0</td>
                <td><span className="badge badge-red">Action Needed</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                  </ActionMenu>
                </td>
                <td className="text-slate-900 font-bold">Sarah Mugisha</td>
                <td className="text-slate-700">2</td>
                <td><span className="badge badge-green">2 / 2</span></td>
                <td><span className="badge badge-green">58 / 58</span></td>
                <td><span className="badge badge-green">2 / 2</span></td>
                <td className="text-slate-700">2</td>
                <td><span className="badge badge-amber">Reevals Pending</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                  </ActionMenu>
                </td>
                <td className="text-slate-900 font-bold">James Ochieng</td>
                <td className="text-slate-700">1</td>
                <td><span className="badge badge-green">1 / 1</span></td>
                <td><span className="badge badge-amber">30 / 51</span></td>
                <td><span className="badge badge-green">1 / 1</span></td>
                <td className="text-slate-700">2</td>
                <td><span className="badge badge-amber">Evaluating</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                  </ActionMenu>
                </td>
                <td className="text-slate-900 font-bold">Fatuma Wanjiku</td>
                <td className="text-slate-700">1</td>
                <td><span className="badge badge-green">1 / 1</span></td>
                <td><span className="badge badge-green">35 / 35</span></td>
                <td><span className="badge badge-green">1 / 1</span></td>
                <td className="text-slate-700">1</td>
                <td><span className="badge badge-green">On Track</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-bullhorn"></i> Send Reminder</button>
                  </ActionMenu>
                </td>
                <td className="text-slate-900 font-bold">Joseph Ayuma</td>
                <td className="text-slate-700">1</td>
                <td><span className="badge badge-red">0 / 1</span></td>
                <td className="text-slate-400">—</td>
                <td><span className="badge badge-amber">Partial</span></td>
                <td className="text-slate-700">0</td>
                <td><span className="badge badge-red">Action Needed</span></td>
              </tr>
            </tbody>
          </table>
        </ScrollTable>
      </div>
    </div>
  )
}
