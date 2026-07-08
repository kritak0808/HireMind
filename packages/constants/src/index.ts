export const API_VERSION = 'v1';

export const SYSTEM_STAGES = {
  SCREENING: 'screening',
  TECHNICAL: 'technical',
  CODING: 'coding',
  HR: 'hr',
  SYNTHESIS: 'synthesis',
} as const;

export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 210,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;
