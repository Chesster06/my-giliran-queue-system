import React from 'react';
import { QUEUE_STATUS, QUEUE_STATUS_LABELS } from '../constants';

export function Badge({ status }) {
  const label = QUEUE_STATUS_LABELS[status] || status;

  let badgeClass = 'badge-waiting';
  let indicatorChar = '●';

  if (status === QUEUE_STATUS.SERVING) {
    badgeClass = 'badge-serving';
    indicatorChar = '▶';
  } else if (status === QUEUE_STATUS.COMPLETED) {
    badgeClass = 'badge-completed';
    indicatorChar = '✓';
  } else if (status === QUEUE_STATUS.SKIPPED) {
    badgeClass = 'badge-skipped';
    indicatorChar = '↷';
  } else if (status === QUEUE_STATUS.CANCELLED) {
    badgeClass = 'badge-cancelled';
    indicatorChar = '✕';
  }

  return (
    <span className={`badge ${badgeClass}`} aria-label={`Status: ${label}`}>
      <span aria-hidden="true">{indicatorChar}</span>
      <span>{label}</span>
    </span>
  );
}
