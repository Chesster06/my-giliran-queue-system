import React from 'react';
import { QUEUE_STATUS, QUEUE_STATUS_LABELS } from '../constants';

export function Badge({ status }) {
  const label = QUEUE_STATUS_LABELS[status] || status;

  let badgeClass = 'badge-waiting';
  let IndicatorSvg = (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
      <circle cx="4" cy="4" r="3.5" />
    </svg>
  );

  if (status === QUEUE_STATUS.SERVING) {
    badgeClass = 'badge-serving';
    IndicatorSvg = (
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    );
  } else if (status === QUEUE_STATUS.COMPLETED) {
    badgeClass = 'badge-completed';
    IndicatorSvg = (
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  } else if (status === QUEUE_STATUS.SKIPPED) {
    badgeClass = 'badge-skipped';
    IndicatorSvg = (
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 14 4 9 9 4" />
        <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
      </svg>
    );
  } else if (status === QUEUE_STATUS.CANCELLED) {
    badgeClass = 'badge-cancelled';
    IndicatorSvg = (
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }

  return (
    <span className={`badge ${badgeClass}`} aria-label={`Status: ${label}`}>
      <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>{IndicatorSvg}</span>
      <span>{label}</span>
    </span>
  );
}
