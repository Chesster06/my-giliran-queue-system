export const QUEUE_STATUS = {
  WAITING: 'waiting',
  SERVING: 'serving',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled'
};

export const QUEUE_STATUS_LABELS = {
  [QUEUE_STATUS.WAITING]: 'Waiting',
  [QUEUE_STATUS.SERVING]: 'Serving',
  [QUEUE_STATUS.COMPLETED]: 'Completed',
  [QUEUE_STATUS.SKIPPED]: 'Skipped',
  [QUEUE_STATUS.CANCELLED]: 'Cancelled'
};

export const INDUSTRY_EXAMPLES = [
  'Clinics & Healthcare',
  'Salons & Barbershops',
  'Restaurants & Cafes',
  'Auto Repair & Workshops',
  'Customer Service Desks',
  'Device & Tech Repair Centers',
  'Events & Check-In Desks',
  'Government & Corporate Offices'
];
