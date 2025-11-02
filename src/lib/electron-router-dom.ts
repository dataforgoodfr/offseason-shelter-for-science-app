import { createElectronRouter } from "electron-router-dom";

export const { Router, registerRoute, settings } = createElectronRouter({
  port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 4927,
  types: {
    ids: ["main", "about", "logger"],
  },
});
