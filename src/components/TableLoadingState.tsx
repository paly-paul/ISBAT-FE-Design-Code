'use client'

import React from 'react'

export interface TableLoadingStateProps {
  colSpan?: number
  title?: string
  subtitle?: string
}

export function LoadingState({
  title = 'Loading records…',
  subtitle = 'Fetching the latest data, just a moment.',
  className = '',
  style,
}: {
  title?: string
  subtitle?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`tbl-empty-cell ${className}`.trim()} style={{ padding: '60px 20px', width: '100%', display: 'flex', justifyContent: 'center', ...style }}>
      <div className="tbl-empty-inner">
        <div className="tbl-loading-icon-wrap">
          <i className="lni lni-reload" />
        </div>
        <div className="tbl-empty-title">{title}</div>
        <div className="tbl-empty-sub">{subtitle}</div>
        <div className="tbl-loading-dots">
          <span className="tbl-loading-dot" />
          <span className="tbl-loading-dot" />
          <span className="tbl-loading-dot" />
        </div>
      </div>
    </div>
  )
}

export function TableLoadingState({
  colSpan,
  title = 'Loading records…',
  subtitle = 'Fetching the latest data, just a moment.',
}: TableLoadingStateProps) {
  if (colSpan === undefined) {
    return <LoadingState title={title} subtitle={subtitle} />
  }

  return (
    <tr>
      <td colSpan={colSpan} className="tbl-empty-cell">
        <div className="tbl-empty-inner">
          <div className="tbl-loading-icon-wrap">
            <i className="lni lni-reload" />
          </div>
          <div className="tbl-empty-title">{title}</div>
          <div className="tbl-empty-sub">{subtitle}</div>
          <div className="tbl-loading-dots">
            <span className="tbl-loading-dot" />
            <span className="tbl-loading-dot" />
            <span className="tbl-loading-dot" />
          </div>
        </div>
      </td>
    </tr>
  )
}
