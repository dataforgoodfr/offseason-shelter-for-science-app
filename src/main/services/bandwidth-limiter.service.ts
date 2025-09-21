import { userConfig } from "lib/electron-app/utils/user-config";

const CONFIG_CHECK_INTERVAL = 2000;

export class BandwidthLimiterService {
  private bandwidthLimitBps: number | undefined;
  private lastConfigTime: number;
  private lastControlTime: number;

  constructor() {
    this.bandwidthLimitBps = undefined;
    this.lastConfigTime = 0;
    this.lastControlTime = 0;
  }

  setBandwidthLimitBps(bandwidthLimitBps: number | undefined) {
    this.bandwidthLimitBps = bandwidthLimitBps;
  }

  getBandwidthLimitBps() {
    return this.bandwidthLimitBps;
  }

  isBandwidthLimited(): boolean {
    return this.bandwidthLimitBps !== undefined;
  }

  updateBandwidthLimitBps() {
    this.bandwidthLimitBps = userConfig.getBandwidthAllocation();
  }

  async sleepMs(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async controlBandwidth(bytes: number) {
    let now = Date.now();
    if (now - this.lastConfigTime > CONFIG_CHECK_INTERVAL) {
      this.updateBandwidthLimitBps();
      this.lastConfigTime = now;
    }

    if (!this.bandwidthLimitBps) {
      return;
    }

    // Wait for the bandwidth limit
    const waitMs = Math.ceil((bytes / this.bandwidthLimitBps) * 1000);
    await this.sleepMs(waitMs);

    this.lastControlTime = now;
  }
}