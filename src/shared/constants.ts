export const ENVIRONMENT = {
  IS_DEV: process.env.NODE_ENV === "development",
};

export const PLATFORM = {
  IS_MAC: process.platform === "darwin",
  IS_WINDOWS: process.platform === "win32",
  IS_LINUX: process.platform === "linux",
};

export const WINDOW_DIMENSIONS = {
  MAIN: {
    WIDTH: 240,
    HEIGHT: {
      COLLAPSED: 415,
      INTERMEDIATE: 535,
      EXPANDED: 690,
    },
  },
} as const;
