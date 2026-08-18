'use client'
import { ScrollTable } from '@/components/ScrollTable'
import { ActionMenu } from '@/components/ActionMenu'

export default function CourseworkOverviewPage() {
  return (
    <div className="page active">
      <div className="pg-hdr">
        <div>
          <div className="pg-title">Coursework Overview</div>
          <div className="pg-sub">Track CW status across all subjects this semester</div>
        </div>
        <div className="pg-actions">
          <button className="btn btn-primary btn-sm"><i className="lni lni-plus"></i> Schedule CW</button>
        </div>
      </div>

      <div className="card">
        <ScrollTable>
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Subject Code</th>
                <th>Subject Name</th>
                <th>Programme</th>
                <th>Faculty</th>
                <th>Questions</th>
                <th>Submissions</th>
                <th>Evaluated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">CSE 1212</span></td>
                <td className="text-g700">Data Structures</td>
                <td className="text-g700">BCS Sem 1</td>
                <td className="font-bold text-g900">Tom Kizito</td>
                <td><span className="badge badge-red">0 uploaded</span></td>
                <td className="text-g500">—</td>
                <td className="text-g500">—</td>
                <td><span className="badge badge-red">Blocked</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">CSE 1301</span></td>
                <td className="text-g700">Algorithms</td>
                <td className="text-g700">BCS Sem 1</td>
                <td className="font-bold text-g900">Sarah Mugisha</td>
                <td><span className="badge badge-green">6 Q</span></td>
                <td className="text-g700 font-mono text-[12px]">58 / 62</td>
                <td className="text-g700 font-mono text-[12px]">58 / 58</td>
                <td><span className="badge badge-green">Complete</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">MGT 2101</span></td>
                <td className="text-g700">Business Mgmt</td>
                <td className="text-g700">BBA Sem 3</td>
                <td className="font-bold text-g900">James Ochieng</td>
                <td><span className="badge badge-green">5 Q</span></td>
                <td className="text-g700 font-mono text-[12px]">51 / 55</td>
                <td className="text-g700 font-mono text-[12px]">30 / 51</td>
                <td><span className="badge badge-amber">Evaluating</span></td>
              </tr>
              <tr>
                <td>
                  <ActionMenu>
                    <button className="btn btn-neu btn-sm"><i className="lni lni-eye"></i> View Details</button>
                  </ActionMenu>
                </td>
                <td><span className="font-bold text-[var(--blue)] font-mono">ENG 1101</span></td>
                <td className="text-g700">Engineering Physics</td>
                <td className="text-g700">BMIT Sem 1</td>
                <td className="font-bold text-g900">Fatuma Wanjiku</td>
                <td><span className="badge badge-green">4 Q</span></td>
                <td className="text-g700 font-mono text-[12px]">35 / 38</td>
                <td className="text-g700 font-mono text-[12px]">35 / 35</td>
                <td><span className="badge badge-green">Complete</span></td>
              </tr>
            </tbody>
          </table>
        </ScrollTable>
      </div>
    </div>
  )
}
