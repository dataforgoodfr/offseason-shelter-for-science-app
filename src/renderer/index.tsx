import ReactDom from 'react-dom/client'
import React from 'react'

import { AppRoutes } from './routes'

import './globals.css'
import webTorrentService from './services/webtorrent.service'

ReactDom.createRoot(document.querySelector('app') as HTMLElement).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
)
