import { Injectable, NgZone } from '@angular/core';

const SETUP_DONE_KEY = 'permissionsSetupDone';
const MOTION_STATUS_KEY = 'motionPermissionStatus';

export type PermissionStatus = 'granted' | 'denied' | 'skipped' | 'unknown';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  constructor(private ngZone: NgZone) {}

  get isSetupDone(): boolean {
    return !!localStorage.getItem(SETUP_DONE_KEY);
  }

  get motionStatus(): PermissionStatus {
    return (localStorage.getItem(MOTION_STATUS_KEY) as PermissionStatus) ?? 'unknown';
  }

  markSetupDone(): void {
    localStorage.setItem(SETUP_DONE_KEY, 'true');
  }

  // Must be called from a direct user gesture (button tap) on iOS 13+.
  async requestMotionPermission(): Promise<PermissionStatus> {
    const win = window as any;
    if (typeof win.DeviceMotionEvent?.requestPermission !== 'function') {
      this.setMotionStatus('granted');
      return 'granted';
    }
    try {
      const result = await win.DeviceMotionEvent.requestPermission();
      const status: PermissionStatus = result === 'granted' ? 'granted' : 'denied';
      this.setMotionStatus(status);
      return status;
    } catch {
      return 'denied';
    }
  }

  skipMotionPermission(): void {
    this.setMotionStatus('skipped');
  }

  onShake(handler: () => void, threshold = 15, cooldownMs = 2000): void {
    let lastShakeAt = 0;
    const check = (x: number, y: number, z: number) => {
      const mag = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (mag > threshold && now - lastShakeAt > cooldownMs) {
        lastShakeAt = now;
        this.ngZone.run(handler);
      }
    };

    const registerWebListener = () =>
      window.addEventListener('devicemotion', (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity;
        if (acc) check(acc.x ?? 0, acc.y ?? 0, acc.z ?? 0);
      });

    const win = window as any;
    if (this.motionStatus === 'granted' && typeof win.DeviceMotionEvent?.requestPermission === 'function') {
      document.addEventListener('click', () => {
        win.DeviceMotionEvent.requestPermission()
          .then((result: string) => { if (result === 'granted') registerWebListener(); })
          .catch(() => registerWebListener());
      }, { once: true });
    } else {
      registerWebListener();
    }
  }

  openAppSettings(): void {
    window.open('app-settings:', '_system');
  }

  private setMotionStatus(status: PermissionStatus): void {
    localStorage.setItem(MOTION_STATUS_KEY, status);
  }
}
