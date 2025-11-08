export const ENVIRONMENT = {
  IS_DEV: process.env.NODE_ENV === 'development',
}

export const PLATFORM = {
  IS_MAC: process.platform === 'darwin',
  IS_WINDOWS: process.platform === 'win32',
  IS_LINUX: process.platform === 'linux',
}

export const WINDOW_DIMENSIONS = {
  MAIN: {
    WIDTH: 240,
    HEIGHT: {
      COLLAPSED: 415,
      INTERMEDIATE: 535,
      EXPANDED: 690,
    },
  },
} as const

export const FILE_REJECTION_CODES = {
  FILE_TOO_BIG_FOR_SEEDING: 1,
  ALLOCATED_STORAGE_EXHAUSTED: 2,
  HTTP_404: 3,
  HTTP_403: 4,
  FETCH_FAILED: 5,
  FILE_NOT_SUITABLE_FOR_BETA: 100000,
}

export const RESCUER_ID = 1;
