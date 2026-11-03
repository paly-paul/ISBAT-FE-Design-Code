'use client'
import { useEffect, useState } from 'react'
import { Toast } from '@/components/Toast'
import { ScrollTable } from '@/components/ScrollTable'
import { SearchSelect } from '@/components/SearchSelect'
import DatePicker from '@/components/DatePicker'
import { useFinanceCurrencies } from '@/hooks/finance/useFinanceCurrencies'
import {
  useExchangeRatesByDate,
  useExchangeRateHistory,
  useCreateExchangeRate,
  useUpdateExchangeRate,
  useDeleteExchangeRate,
  ExchangeRate,
} from '@/hooks/finance/useExchangeRates'
import { usePagePermissions } from '@/hooks/users/usePagePermissions'
import { getMarketRates, marketRateFor } from '@/lib/api/finance/marketRates'

// Stable reference for the "no data yet" case — `data = []` as a
// destructuring default creates a NEW array literal every render while
// `data` is undefined (loading, or between an invalidation and its
// refetch resolving). That new reference fed straight into a useEffect's
// dependency array below, so the effect fired every render, called
// setState, triggered a re-render, got a new [] again, and looped forever
// ("Maximum update depth exceeded", confirmed live). A module-level
// constant has one identity for the app's whole lifetime.
const EMPTY_RATES: ExchangeRate[] = []

function pad(n: number) { return String(n).padStart(2, '0') }

function todayYmd() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// yyyy-mm-dd -> yyyy-mm-dd, one day earlier. Used only to source the
// "Yesterday" comparison column — the API has no dedicated "previous rate"
// endpoint, so this fetches GetExchangeRatesByDate a second time for
// rateDate - 1.
function addDays(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1)
  dt.setDate(dt.getDate() + delta)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
}

// dd/mm/yyyy display, matching the app-wide date convention (DatePicker's
// own toDisplay, and the old mock history table's format).
function toDisplayDate(ymd: string): string {
  const [y, m, d] = ymd.split('-')
  if (!y || !m || !d) return ymd
  return `${d}/${m}/${y}`
}

// Rates read in UGX per unit (e.g. 4,277.71), so two decimals; a rate under
// 1 keeps up to six so it doesn't round to 0.00.
function fmtRate(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: Math.abs(n) < 1 ? 6 : 2 })
}

// Change against yesterday's saved rate. A percentage threshold, not an
// absolute one, so it holds whatever the rate's magnitude; 0.01% because FX
// moves are small — the old 0.5% cut-off hid a 20-shilling move on USD.
function Delta({ current, previous }: { current: number; previous: number | null }) {
  if (previous == null) return <span className="er-delta is-flat">No rate yesterday</span>
  if (!(current > 0)) return <span className="er-delta is-flat">—</span>
  const diff = current - previous
  const pct = previous ? (diff / previous) * 100 : 0
  if (Math.abs(pct) < 0.01) return <span className="er-delta is-flat"><i className="lni lni-minus" aria-hidden="true"></i>No change</span>
  const up = diff > 0
  return (
    <span className={`er-delta ${up ? 'is-up' : 'is-down'}`}>
      <i className={`lni ${up ? 'lni-arrow-up' : 'lni-arrow-down'}`} aria-hidden="true"></i>
      {fmtRate(Math.abs(diff))} <span className="er-delta-pct">{Math.abs(pct).toFixed(2)}%</span>
    </span>
  )
}

export default function Page() {
  const permissions = usePagePermissions()
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  function showToast(msg: string, type = '') { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const today = todayYmd()
  const [rateDate, setRateDate] = useState(today)
  const isToday = rateDate === today

  const { data: allCurrencies = [] } = useFinanceCurrencies()
  // Base currency needs no rate against itself — GetExchangeRates has no
  // concept of a "base" row at all, this is purely a display convenience
  // mirrored from the old mock UI.
  const baseCurrency = allCurrencies.find(c => c.isDefault === 1)
  const rateCurrencies = allCurrencies.filter(c => c.isDefault !== 1)

  const { data: ratesForDate = EMPTY_RATES, isLoading: isRatesLoading, isError: isRatesError, error: ratesError } = useExchangeRatesByDate(rateDate)
  const { data: ratesForPrevDate = EMPTY_RATES } = useExchangeRatesByDate(addDays(rateDate, -1))
  // exRate is the raw wire value — "1 {currency} = {exRate} {base}"
  // (confirmed via a real get-exchange-rate-exists response: USD came back
  // as exRate: 3774.90, i.e. 1 USD = 3774.90 UGX). Briefly flipped to show
  // "1 UGX = ___ {currency}" instead, then reverted back to this direction
  // (per request, 2026-09-08) together with Payment Console's own bar, so
  // both pages agree on the same "1 {currency} = ___ UGX" convention.
  // Displayed/saved as-is now, no inversion in either direction.
  const prevRateByCurrency = new Map(ratesForPrevDate.map(r => [r.currencyGuid, r.exRate]))
  const existingByCurrency = new Map(ratesForDate.map(r => [r.currencyGuid, r]))

  // Local editable values, keyed by currencyGuid — reseeded from the
  // server's rates for rateDate whenever the selected date changes or that
  // fetch resolves (e.g. right after a save invalidates it), so the field
  // reflects what's actually saved rather than staying stuck on a stale
  // typed value.
  const [rateInputs, setRateInputs] = useState<Record<string, string>>({})
  useEffect(() => {
    const map: Record<string, string> = {}
    ratesForDate.forEach(r => { map[r.currencyGuid] = String(r.exRate) })
    setRateInputs(map)
  }, [ratesForDate, rateDate])

  // "Fetch market rates" — fills today's editable inputs with the market
  // figure; nothing is saved until Save / Save Rates. Today only: these are
  // today's market rates, wrong for a back-dated entry.
  const [isFetchingMarket, setIsFetchingMarket] = useState(false)
  // byGuid keeps each fetched figure, so its row can show "Market x" next to
  // the input even after someone types over it.
  const [marketInfo, setMarketInfo] = useState<{ date: string; filled: string[]; missing: string[]; byGuid: Record<string, string> } | null>(null)

  async function handleFetchMarketRates() {
    if (!baseCurrency) return
    setIsFetchingMarket(true)
    try {
      const market = await getMarketRates()
      const filled: string[] = []
      const missing: string[] = []
      const next: Record<string, string> = {}
      for (const c of rateCurrencies) {
        const rate = marketRateFor(market, c.currencyCode, baseCurrency.currencyCode)
        if (rate == null) { missing.push(c.currencyCode); continue }
        // Two decimals, like the rates finance enters by hand.
        next[c.currencyGuid] = rate.toFixed(2)
        filled.push(c.currencyCode)
      }
      setRateInputs(prev => ({ ...prev, ...next }))
      setMarketInfo({ date: market.date, filled, missing, byGuid: next })
      if (filled.length === 0) showToast('No market rate found for these currencies.', 'warn')
      else showToast(`Filled ${filled.join(', ')} from market rates — review, then Save.`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not fetch market rates.', 'error')
    } finally {
      setIsFetchingMarket(false)
    }
  }

  const createMutation = useCreateExchangeRate()
  const updateMutation = useUpdateExchangeRate()
  const deleteMutation = useDeleteExchangeRate()
  const isSaving = createMutation.isPending || updateMutation.isPending

  // A row has unsaved changes when its input holds a valid rate that differs
  // from what's saved for the date (or nothing is saved yet). Locked rows —
  // historical and already set — never count.
  function isDirty(currencyGuid: string): boolean {
    const existing = existingByCurrency.get(currencyGuid)
    if (existing && !isToday) return false
    const num = parseFloat(rateInputs[currencyGuid] ?? '')
    if (!(num > 0)) return false
    return !existing || num !== existing.exRate
  }
  const dirtyCount = rateCurrencies.filter(c => isDirty(c.currencyGuid)).length
  const currencyNameByGuid = new Map(allCurrencies.map(c => [c.currencyGuid, c.currencyName]))

  async function saveRate(currencyGuid: string, currencyCode: string) {
    const raw = rateInputs[currencyGuid] ?? ''
    const num = parseFloat(raw)
    if (!raw || !(num > 0)) { showToast(`Enter a valid rate for ${currencyCode}.`, 'warn'); return }
    // Saved as-is — the "1 {code} = ___ UGX" figure typed here IS the API's
    // own exRate convention, see the rateInputs effect above.
    const apiExRate = num
    const existing = existingByCurrency.get(currencyGuid)
    if (existing && !permissions.edit) { showToast('You do not have permission to update exchange rates.', 'warn'); return }
    if (!existing && !permissions.add) { showToast('You do not have permission to add exchange rates.', 'warn'); return }
    try {
      if (existing) {
        // Only today's row can be corrected via PUT (put-exchange-rate.md);
        // the UI already hides the editable input for a historical row that
        // already has a rate (see the per-row render below), so reaching
        // here with existing && !isToday shouldn't normally happen — this
        // is a last-resort guard against a race (date changed mid-save).
        if (!isToday) { showToast('Only today’s exchange rates can be updated. Delete the historical rate below and re-enter it instead.', 'warn'); return }
        await updateMutation.mutateAsync({ guid: existing.exchangeRateGuid, input: { exRate: apiExRate, exDate: rateDate } })
      } else {
        await createMutation.mutateAsync({ currencyGuid, exRate: apiExRate, exDate: rateDate })
      }
      showToast(`${currencyCode} rate saved.`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : `Failed to save the ${currencyCode} rate.`, 'error')
    }
  }

  async function handleSaveAll() {
    if (!permissions.add && !permissions.edit) { showToast('You do not have permission to save exchange rates.', 'warn'); return }
    if (!rateDate) { showToast('Rate date is required.', 'warn'); return }
    // Only rows with unsaved changes — re-saving an unchanged rate is a
    // wasted PUT, and locked rows are skipped by isDirty itself.
    const targets = rateCurrencies.filter(c => isDirty(c.currencyGuid))
    if (targets.length === 0) { showToast('No unsaved rate changes.', 'warn'); return }

    let successCount = 0
    const failures: string[] = []
    for (const c of targets) {
      // Saved as-is — see saveRate's own note above.
      const apiExRate = parseFloat(rateInputs[c.currencyGuid])
      const existing = existingByCurrency.get(c.currencyGuid)
      try {
        if (existing) await updateMutation.mutateAsync({ guid: existing.exchangeRateGuid, input: { exRate: apiExRate, exDate: rateDate } })
        else await createMutation.mutateAsync({ currencyGuid: c.currencyGuid, exRate: apiExRate, exDate: rateDate })
        successCount++
      } catch (err) {
        failures.push(`${c.currencyCode}: ${err instanceof Error ? err.message : 'failed'}`)
      }
    }
    if (failures.length === 0) showToast(`Saved rates for ${successCount} currenc${successCount === 1 ? 'y' : 'ies'}.`, 'success')
    else showToast(`Saved ${successCount}; failed — ${failures.join('; ')}`, successCount > 0 ? 'warn' : 'error')
  }

  // History panel — separate filter state from the rate-entry date above;
  // this drives GET /exchange-rates/history, a genuinely different,
  // paged/ranged endpoint (get-exchange-rate-history.md), not the
  // single-day board.
  const [historyCurrencyGuid, setHistoryCurrencyGuid] = useState('')
  const [historyFromDate, setHistoryFromDate] = useState('')
  const [historyToDate, setHistoryToDate] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const historyPageSize = 10

  // Reset to page 1 whenever a filter changes, so switching filters can't
  // strand the view on a now out-of-range page.
  useEffect(() => { setHistoryPage(1) }, [historyCurrencyGuid, historyFromDate, historyToDate])

  const { data: history, isLoading: isHistoryLoading } = useExchangeRateHistory({
    currencyGuid: historyCurrencyGuid || null,
    fromDate: historyFromDate || null,
    toDate: historyToDate || null,
    page: historyPage,
    pageSize: historyPageSize,
  })
  const historyItems = history?.items ?? []
  const historyTotal = history?.totalCount ?? 0
  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / historyPageSize))

  async function handleDelete(guid: string, label: string) {
    if (!permissions.delete) { showToast('You do not have permission to delete exchange rates.', 'warn'); return }
    if (!window.confirm(`Delete the exchange rate ${label}? This is the only way to correct a historical rate — it can't be undone.`)) return
    try {
      await deleteMutation.mutateAsync(guid)
      showToast('Exchange rate deleted.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete exchange rate.', 'error')
    }
  }

  const baseCode = baseCurrency?.currencyCode ?? 'base'

  return (
    <>
      <div className="page active">
        <div className="pg-hdr">
          <div>
            <div className="pg-title">Exchange Rate Management</div>
            <div className="pg-sub">Set per-currency daily rates · Required before payments in that currency can be allocated</div>
          </div>
          <button className="btn btn-primary" disabled={isSaving || dirtyCount === 0 || (!permissions.add && !permissions.edit)} onClick={handleSaveAll}>
            <i className="lni lni-save"></i> {isSaving ? 'Saving…' : dirtyCount > 0 ? `Save ${dirtyCount} rate${dirtyCount === 1 ? '' : 's'}` : 'Save Rates'}
          </button>
        </div>

        <div className="er-layout">
          {/* ── Rate board: one row per currency for the chosen date ── */}
          <section className="card er-card" aria-labelledby="er-board-title">
            <div className="pcx-panel-hdr er-hdr">
              <div>
                <h3 id="er-board-title" className="pcx-panel-title">Daily rates</h3>
                <p className="pcx-panel-sub">
                  {baseCurrency
                    ? <>In <b>{baseCurrency.currencyCode}</b> per 1 unit · {baseCurrency.currencyName || baseCurrency.currencyCode} is the base</>
                    : 'Per 1 unit of each currency'}
                </p>
              </div>
              <div className="er-hdr-tools">
                <div className="er-date">
                  {/* maxYmd enforces CreateExchangeRateCommandValidator's "exDate
                      cannot be in the future" rule client-side too. */}
                  <DatePicker value={rateDate} onChange={setRateDate} maxYmd={today} />
                </div>
                {isToday ? (
                  <span className="pcx-pill pcx-pill-green"><span className="pcx-dot" aria-hidden="true"></span>Today</span>
                ) : (
                  <button type="button" className="btn btn-neu btn-sm" onClick={() => setRateDate(today)}>Back to today</button>
                )}
              </div>
            </div>

            {/* Market feed — today only: these are today's market rates,
                wrong for a back-dated entry. */}
            {isToday && baseCurrency && rateCurrencies.length > 0 && (
              <div className="er-market">
                <div className="er-market-text">
                  {marketInfo && marketInfo.filled.length > 0 ? (
                    <>
                      <b>Filled {marketInfo.filled.join(', ')}</b> from market rates{marketInfo.date ? ` of ${toDisplayDate(marketInfo.date)}` : ''}. Not saved yet — check against the bank rate, then save.
                      {marketInfo.missing.length > 0 && ` No market rate for ${marketInfo.missing.join(', ')}.`}
                    </>
                  ) : (
                    <>Start from the daily market feed, then adjust to the bank rate before saving.</>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-neu btn-sm"
                  disabled={isFetchingMarket || (!permissions.add && !permissions.edit)}
                  onClick={handleFetchMarketRates}
                >
                  <i className={`lni lni-reload${isFetchingMarket ? ' er-spin' : ''}`} aria-hidden="true"></i> {isFetchingMarket ? 'Fetching…' : 'Fetch market rates'}
                </button>
              </div>
            )}

            {isRatesLoading && (
              <div className="er-board" aria-busy="true">
                {[0, 1].map(i => <div key={i} className="er-row er-row-skel" aria-hidden="true"></div>)}
              </div>
            )}
            {!isRatesLoading && isRatesError && (
              <div className="er-state is-error">
                <i className="lni lni-warning" aria-hidden="true"></i>
                <span>{ratesError instanceof Error ? ratesError.message : 'Failed to load rates for this date.'}</span>
              </div>
            )}

            {!isRatesLoading && !isRatesError && (
              rateCurrencies.length === 0 ? (
                <div className="er-state">
                  <i className="lni lni-world" aria-hidden="true"></i>
                  <span>No currencies besides the base are set up. Add one in Currency Master to set its rate here.</span>
                </div>
              ) : (
                <div className="er-board">
                  {rateCurrencies.map(c => {
                    const existing = existingByCurrency.get(c.currencyGuid)
                    const locked = !!existing && !isToday
                    const prevRate = prevRateByCurrency.get(c.currencyGuid) ?? null
                    const dirty = isDirty(c.currencyGuid)
                    const value = rateInputs[c.currencyGuid] ?? ''
                    const market = isToday ? marketInfo?.byGuid[c.currencyGuid] : undefined
                    const status = locked
                      ? { cls: 'is-locked', icon: 'lni-lock', text: 'Locked' }
                      : dirty
                        ? { cls: 'is-dirty', icon: 'lni-pencil', text: 'Unsaved' }
                        : existing
                          ? { cls: 'is-saved', icon: 'lni-checkmark-circle', text: 'Saved' }
                          : { cls: 'is-empty', icon: 'lni-circle-plus', text: 'Not set' }
                    const inputId = `er-rate-${c.currencyGuid}`
                    return (
                      <div key={c.currencyGuid} className={`er-row${dirty ? ' is-dirty' : ''}`}>
                        <div className="er-cur">
                          <span className="er-code">{c.currencyCode}</span>
                          <span className="er-name">{c.currencyName && c.currencyName !== c.currencyCode ? c.currencyName : `1 ${c.currencyCode}`}</span>
                        </div>

                        <div className="er-value">
                          <label className="er-lbl" htmlFor={inputId}>1 {c.currencyCode} = </label>
                          {locked ? (
                            <div className="er-locked-val">
                              {fmtRate(existing.exRate)} <span className="er-suffix">{baseCode}</span>
                            </div>
                          ) : (
                            <div className="er-input">
                              <input
                                id={inputId}
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min={0}
                                placeholder="0.00"
                                value={value}
                                onChange={e => setRateInputs(prev => ({ ...prev, [c.currencyGuid]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter' && dirty) saveRate(c.currencyGuid, c.currencyCode) }}
                              />
                              <span className="er-suffix">{baseCode}</span>
                            </div>
                          )}
                          {locked ? (
                            <span className="er-hint">Past rates can&apos;t be edited — delete it in Rate history to re-enter.</span>
                          ) : market && market !== value ? (
                            <button type="button" className="er-hint er-hint-btn" onClick={() => setRateInputs(prev => ({ ...prev, [c.currencyGuid]: market }))}>
                              Market {fmtRate(parseFloat(market))} · use
                            </button>
                          ) : market ? (
                            <span className="er-hint">Market rate</span>
                          ) : null}
                        </div>

                        <div className="er-compare">
                          <span className="er-lbl">Yesterday</span>
                          <span className="er-prev">{prevRate != null ? fmtRate(prevRate) : '—'}</span>
                          <Delta current={locked ? existing.exRate : parseFloat(value) || 0} previous={prevRate} />
                        </div>

                        <div className="er-actions">
                          <span className={`er-status ${status.cls}`}><i className={`lni ${status.icon}`} aria-hidden="true"></i>{status.text}</span>
                          {!locked && (
                            <button
                              type="button"
                              className="btn btn-neu btn-sm"
                              disabled={isSaving || !dirty || (existing ? !permissions.edit : !permissions.add)}
                              onClick={() => saveRate(c.currencyGuid, c.currencyCode)}
                            >
                              {existing ? 'Update' : 'Save'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </section>

          {/* ── History: every saved rate, filterable ── */}
          <section className="card er-card" aria-labelledby="er-history-title">
            <div className="pcx-panel-hdr er-hdr">
              <div>
                <h3 id="er-history-title" className="pcx-panel-title">Rate history</h3>
                <p className="pcx-panel-sub">{isHistoryLoading ? 'Loading…' : `${historyTotal.toLocaleString()} saved rate${historyTotal === 1 ? '' : 's'}`}</p>
              </div>
            </div>

            <div className="er-filters">
              <div className="fg" style={{ marginBottom: 0 }}>
                <div className="lbl">Currency</div>
                <SearchSelect
                  options={allCurrencies.map(c => ({ value: c.currencyGuid, label: c.currencyCode }))}
                  value={historyCurrencyGuid}
                  onChange={setHistoryCurrencyGuid}
                  placeholder="All currencies"
                />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <div className="lbl">From</div>
                <DatePicker value={historyFromDate} onChange={setHistoryFromDate} />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <div className="lbl">To</div>
                <DatePicker value={historyToDate} onChange={setHistoryToDate} />
              </div>
            </div>

            {isHistoryLoading ? (
              <div className="er-state">Loading history…</div>
            ) : historyItems.length === 0 ? (
              <div className="er-state">
                <i className="lni lni-search-alt" aria-hidden="true"></i>
                <span>{historyCurrencyGuid || historyFromDate || historyToDate ? 'No rates match these filters.' : 'No rates saved yet.'}</span>
                {(historyCurrencyGuid || historyFromDate || historyToDate) && (
                  <button type="button" className="btn btn-neu btn-sm" onClick={() => { setHistoryCurrencyGuid(''); setHistoryFromDate(''); setHistoryToDate('') }}>Clear filters</button>
                )}
              </div>
            ) : (
              <>
                <ScrollTable>
                  <table className="er-table">
                    <thead><tr><th>Date</th><th>Currency</th><th className="num">Rate ({baseCode})</th><th><span className="sr-only">Actions</span></th></tr></thead>
                    <tbody>
                      {historyItems.map(r => {
                        const ymd = r.exDate.slice(0, 10)
                        const name = currencyNameByGuid.get(r.currencyGuid)
                        return (
                          <tr key={r.exchangeRateGuid}>
                            <td className="tabular-nums">{toDisplayDate(ymd)}{ymd === today && <span className="er-today-tag">Today</span>}</td>
                            <td>
                              <span className="er-code er-code-sm">{r.currencyCode}</span>
                              {name && name !== r.currencyCode && <span className="er-name er-name-inline">{name}</span>}
                            </td>
                            <td className="num er-rate-cell">{fmtRate(r.exRate)}</td>
                            <td className="er-act-cell">
                              {permissions.delete && (
                                <button
                                  type="button"
                                  className="er-icon-btn"
                                  aria-label={`Delete ${r.currencyCode} rate for ${toDisplayDate(ymd)}`}
                                  title="Delete rate"
                                  onClick={() => handleDelete(r.exchangeRateGuid, `${r.currencyCode} · ${toDisplayDate(ymd)}`)}
                                >
                                  <i className="lni lni-trash-can" aria-hidden="true"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </ScrollTable>
                <div className="flex items-center justify-between mt-[10px]" style={{ fontSize: 12 }}>
                  <span className="text-muted">Page {historyPage} of {historyTotalPages} · {historyTotal} total</span>
                  <div className="flex gap-2">
                    <button className="btn btn-neu btn-sm" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => Math.max(1, p - 1))}>‹ Prev</button>
                    <button className="btn btn-neu btn-sm" disabled={historyPage >= historyTotalPages} onClick={() => setHistoryPage(p => p + 1)}>Next ›</button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  )
}
