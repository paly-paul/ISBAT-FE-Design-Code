'use client'
import { ModalProps } from './types'

export function ProgrammeModal({ isOpen, onClose, showToast }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay open" id="new-prog-modal" onClick={onClose}>
      <div className="modal modal-80 modal-flex" onClick={e => e.stopPropagation()}>
        <div className="modal-hdr">
          <div className="modal-title"><i className="lni lni-graduation"></i> <span id="prog-modal-title">Add Programme Version</span></div>
          <button className="modal-close" onClick={onClose}><i className="lni lni-close"></i></button>
        </div>
        <div className="prog-steps">
          <div className="prog-step active" id="prog-step-1-pill"><span className="prog-step-num">1</span><span>Programme Details</span></div>
          <div className="prog-step-line"></div>
          <div className="prog-step" id="prog-step-2-pill"><span className="prog-step-num">2</span><span>Course Unit Allocation</span></div>
          <div className="prog-step-line"></div>
          <div className="prog-step" id="prog-step-3-pill"><span className="prog-step-num">3</span><span>Semester-wise Fee Structure</span></div>
        </div>
        <div className="modal-scroll">
          {/* Step 1 */}
          <div id="prog-step-1">
            <div className="g3">
              <div className="fg"><div className="lbl">Programme Code <span className="req">*</span></div><input className="ctrl" placeholder="e.g. BCA-2031" /></div>
              <div className="fg span2"><div className="lbl">Programme Name <span className="req">*</span></div><input className="ctrl" placeholder="e.g. Bachelor of Computer Applications 2031" /></div>
              <div className="fg">
                <div className="lbl">Programme Group <span className="req">*</span></div>
                <select className="ctrl"><option>BCA</option><option>BBA</option><option>MBA</option><option>BEng</option></select>
              </div>
              <div className="fg span2">
                <div className="lbl">Programme Level (auto-fills year/sem/credits)</div>
                <select className="ctrl" id="prog-alevel">
                  <option value="6" data-years="3" data-credits="132" data-label="Bachelor's Degree">Bachelor&apos;s Degree (3yr / 6sem / 132cr)</option>
                  <option value="4" data-years="2" data-credits="72" data-label="Master's Degree">Master&apos;s Degree (2yr / 4sem / 72cr)</option>
                  <option value="6" data-years="3" data-credits="0" data-label="PhD">PhD (3yr / 6sem / 0cr — No IA)</option>
                  <option value="8" data-years="4" data-credits="160" data-label="Engineering">Engineering (4yr / 8sem / 160cr)</option>
                  <option value="4" data-years="2" data-credits="72" data-label="Diploma">Diploma (2yr / 4sem / 72cr)</option>
                </select>
                <div id="prog-alevel-info" className="flex gap-2 flex-wrap mt-2">
                  <span className="lvl-chip"><span className="lvl-chip-lbl">No. of Years</span><span className="lvl-chip-val" id="lvl-years">3</span></span>
                  <span className="lvl-chip"><span className="lvl-chip-lbl">No. of Semesters</span><span className="lvl-chip-val" id="lvl-semesters">6</span></span>
                  <span className="lvl-chip"><span className="lvl-chip-lbl">Min. Credits</span><span className="lvl-chip-val" id="lvl-credits">132</span></span>
                </div>
              </div>
              <div className="fg">
                <div className="lbl">Campus <span className="req">*</span></div>
                <select className="ctrl" id="prog-campus">
                  <option value="main">Main Campus — Kampala</option>
                  <option value="kampala-city">Kampala City Campus</option>
                  <option value="mukono">Mukono Campus</option>
                  <option value="jinja">Jinja Campus</option>
                  <option value="online">Online / ODL Hub</option>
                </select>
              </div>
              <div className="fg">
                <div className="lbl">Faculty <span className="req">*</span></div>
                <select className="ctrl" id="prog-faculty">
                  <option value="FCT">FCT — Faculty of Computing &amp; Technology</option>
                  <option value="FBM">FBM — Faculty of Business &amp; Management</option>
                  <option value="FEN">FEN — Faculty of Engineering</option>
                  <option value="FHS">FHS — Faculty of Health Sciences</option>
                  <option value="FED">FED — Faculty of Education</option>
                  <option value="FLA">FLA — Faculty of Liberal Arts</option>
                </select>
                <div id="prog-faculty-hint" className="text-[11px] text-g500 mt-[5px]">Showing faculties at <strong>Main Campus</strong></div>
              </div>
              <div className="fg span2">
                <div className="lbl">Application Fee <span className="req">*</span></div>
                <div className="flex gap-[6px]">
                  <select className="ctrl flex-1" id="prog-app-fee-preset">
                    <option value="50000" data-cur="UGX">UGX 50,000 — Standard (Direct)</option>
                    <option value="100000" data-cur="UGX">UGX 100,000 — Postgraduate</option>
                    <option value="30000" data-cur="UGX">UGX 30,000 — Diploma / Certificate</option>
                    <option value="50" data-cur="USD">USD 50 — ODL / International</option>
                    <option value="100" data-cur="USD">USD 100 — ODL Postgraduate</option>
                    <option value="0" data-cur="UGX">Waived (HTC / Scholarship)</option>
                    <option value="custom" data-cur="UGX">Custom — enter manually</option>
                  </select>
                  <input className="ctrl w-[120px] font-bold" id="prog-app-fee-amount" type="number" min={0} defaultValue={50000} />
                  <select className="ctrl w-[78px]" id="prog-app-fee-cur">
                    <option value="UGX">UGX</option>
                    <option value="USD">USD</option>
                    <option value="KES">KES</option>
                  </select>
                </div>
                <div className="text-[11px] text-g500 mt-[5px]">Pre-loaded from Fee Master. Override per programme if needed.</div>
              </div>
              <div className="fg span3">
                <div className="g2">
                  <div className="fg m-0"><div className="lbl">Accreditation Date <span className="req">*</span></div><input className="ctrl" type="date" /></div>
                  <div className="fg m-0"><div className="lbl">Accreditation Expiry Date</div><input className="ctrl" type="date" /></div>
                </div>
              </div>
              <div className="fg span3">
                <div className="lbl">Accreditation Letter</div>
                <div className="file-zone p-[14px]">
                  <input type="file" accept=".pdf" />
                  <div className="file-zone-icon"><i className="lni lni-files"></i></div>
                  <p>Upload NCHE / UVTOP accreditation letter (PDF)</p>
                </div>
              </div>
            </div>
            <div className="sec-divider">Programme Specializations <span className="text-[10.5px] font-medium text-g400 normal-case tracking-normal ml-2">Optional · A student can pick one specialization which dictates their specialization course units</span></div>
            <div className="bg-[#fafbfd] border-[1.5px] border-g200 rounded-[var(--rsm)] p-[14px_16px] mb-[14px]">
              <div id="prog-spec-list" className="flex flex-col gap-2 mb-[10px]"></div>
              <button className="btn btn-neu btn-sm"><i className="lni lni-plus"></i> Add Specialization</button>
              <div id="prog-spec-empty" className="text-xs text-g500 italic mt-[6px]">No specializations added — this programme will run as a single track.</div>
            </div>
            <div className="sec-divider">Status &amp; Flags</div>
            <div className="g3">
              <div className="fg">
                <div className="lbl">Admission Status <span className="req">*</span></div>
                <div className="tgl-group">
                  <button className="tgl-btn tgl-active"><i className="lni lni-checkmark"></i> Active (New admissions)</button>
                  <button className="tgl-btn">Inactive (Existing students only)</button>
                </div>
              </div>
              <div className="fg">
                <div className="lbl">No Internal Assessment?</div>
                <div className="tgl-group">
                  <button className="tgl-btn tgl-active">No (Standard)</button>
                  <button className="tgl-btn">Yes (e.g. PhD)</button>
                </div>
              </div>
            </div>
            <div className="warn-box mt-3"><i className="lni lni-warning"></i> Setting this version to <em>Active</em> will make it available for new admissions. Ensure the old version (if any) is set to <em>Inactive</em> first. Old curricula are preserved for existing students.</div>
          </div>
          {/* Step 2 */}
          <div id="prog-step-2" className="hidden">
            <div className="mdl-section mdl-section--blue">
              <div className="mdl-section-hdr">
                <span className="mdl-section-icon"><i className="lni lni-book"></i></span>
                <div className="flex-1 min-w-0">
                  <div className="mdl-section-title">Allocate Course Units by Semester</div>
                  <div className="mdl-section-sub">Assign course units to each semester. Pick from the curriculum master or add a quick placeholder.</div>
                </div>
                <span id="prog-sem-summary" className="badge badge-blue normal-case tracking-normal">—</span>
              </div>
              <div id="prog-sem-allocation-body"></div>
            </div>
          </div>
          {/* Step 3 */}
          <div id="prog-step-3" className="hidden">
            <div className="mdl-section mdl-section--blue">
              <div className="mdl-section-hdr">
                <span className="mdl-section-icon"><i className="lni lni-dollar"></i></span>
                <div className="flex-1 min-w-0">
                  <div className="mdl-section-title">Define Fee Items by Semester</div>
                  <div className="mdl-section-sub">Add fee items per semester with custom titles (e.g. Tuition Fee, Semester Entry Fee, Lab Fee). Within a semester, items are auto-settled by priority.</div>
                </div>
                <span id="prog-fee-summary" className="badge badge-blue normal-case tracking-normal">—</span>
              </div>
              <div className="g3 mb-[14px]">
                <div className="fg m-0">
                  <div className="lbl">Base Currency</div>
                  <select className="ctrl" id="prog-fee-currency">
                    <option value="UGX">UGX (Ugandan Shilling)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="KES">KES (Kenyan Shilling)</option>
                  </select>
                </div>
                <div className="fg m-0">
                  <div className="lbl">Student Type</div>
                  <select className="ctrl" id="prog-fee-stu-type">
                    <option>Local</option>
                    <option>International</option>
                  </select>
                </div>
                <div className="fg m-0">
                  <div className="lbl">Quick Template</div>
                  <select className="ctrl">
                    <option value="">— Apply a template —</option>
                    <option value="basic">Basic (Tuition + Entry)</option>
                    <option value="standard">Standard (Tuition + Entry + Lab)</option>
                    <option value="full">Full (Tuition + Entry + Lab + Library + Admission)</option>
                    <option value="clear">Clear all fee items</option>
                  </select>
                </div>
              </div>
              <div className="bg-[linear-gradient(135deg,#f0f5ff_0%,var(--white)_70%)] border-[1.5px] border-dashed border-[var(--b200)] rounded-[var(--rsm)] p-[14px_16px] mb-[18px]">
                <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[.08em] text-[#2d448f] mb-3">
                  <i className="lni lni-tag text-sm"></i>
                  <span>Programme-level Fees &amp; Discounts</span>
                  <span className="badge badge-blue normal-case tracking-normal font-semibold ml-auto">Applied across all semesters</span>
                </div>
                <div className="g2">
                  <div className="fg m-0">
                    <div className="lbl">Lumpsum Discount Calculation Type</div>
                    <select className="ctrl" id="prog-lumpsum-type">
                      <option value="amount">Amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  <div className="fg m-0">
                    <div className="lbl" id="prog-lumpsum-lbl">Lumpsum Discount Amount</div>
                    <div className="flex items-center gap-2">
                      <span id="prog-lumpsum-prefix" className="text-xs text-g500 font-bold min-w-[28px] text-center">UGX</span>
                      <input className="ctrl flex-1" type="number" id="prog-lumpsum-value" placeholder="0" min={0} />
                      <span id="prog-lumpsum-suffix" className="hidden text-[15px] text-g500 font-extrabold">%</span>
                    </div>
                  </div>
                </div>
                <div className="g3 mt-3">
                  <div className="fg span2 m-0"><div className="lbl">Lateral Entry Fee</div><input className="ctrl" type="number" id="prog-lateral-fee" placeholder="0" min={0} /></div>
                  <div className="fg m-0"><div className="lbl">Currency</div><select className="ctrl" id="prog-lateral-cur"><option>UGX</option><option>USD</option><option>KES</option></select></div>
                  <div className="fg span2 m-0"><div className="lbl">Credit Exemption Fee</div><input className="ctrl" type="number" id="prog-ce-fee" placeholder="0" min={0} /></div>
                  <div className="fg m-0"><div className="lbl">Currency</div><select className="ctrl" id="prog-ce-cur"><option>UGX</option><option>USD</option><option>KES</option></select></div>
                  <div className="fg span2 m-0"><div className="lbl">Aptech Credit Exemption Fee</div><input className="ctrl" type="number" id="prog-ace-fee" placeholder="0" min={0} /></div>
                  <div className="fg m-0"><div className="lbl">Currency</div><select className="ctrl" id="prog-ace-cur"><option>UGX</option><option>USD</option><option>KES</option></select></div>
                </div>
              </div>
              <div id="prog-sem-fee-body"></div>
            </div>
          </div>
        </div>
        <div className="modal-footer" id="prog-modal-footer">
          <button className="btn btn-neu" onClick={onClose}>Cancel</button>
          <span className="flex-1"></span>
          <button className="btn btn-neu hidden" id="prog-back-btn"><i className="lni lni-arrow-left"></i> <span id="prog-back-lbl">Back</span></button>
          <button className="btn btn-primary" id="prog-save-continue-btn"><span id="prog-cont-lbl">Save &amp; Continue</span> <i className="lni lni-arrow-right"></i></button>
          <button className="btn btn-primary hidden" id="prog-final-save-btn"><i className="lni lni-checkmark"></i> Save Programme</button>
        </div>
      </div>
    </div>
  )
}
