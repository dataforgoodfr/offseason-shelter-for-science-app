import { Route } from 'react-router-dom'

import { Router } from 'lib/electron-router-dom'

import { MainScreen } from './screens/poc'
import { LoggerScreen } from './screens/logger'

export function AppRoutes() {
  return (
    <Router 
      main={<Route path="/" element={<MainScreen />} />}
      logger={<Route path="/" element={<LoggerScreen />} />}
    />
  )
}
