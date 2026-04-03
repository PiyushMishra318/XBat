// Session tracker — monitors controller connect/disconnect and tracks play sessions

export class SessionTracker {
  constructor(storage) {
    this.storage = storage;
    this.activeSessions = {}; // keyed by controller index
  }

  update(controllers) {
    for (const ctrl of controllers) {
      const key = String(ctrl.index);
      if (ctrl.connected) {
        if (!this.activeSessions[key]) {
          // New session started
          this.activeSessions[key] = {
            controllerIndex: ctrl.index,
            startTime: Date.now(),
            startBatteryLevel: ctrl.batteryLevel,
            startBatteryPercent: ctrl.batteryPercent,
            batteryType: ctrl.batteryType,
            lastBatteryLevel: ctrl.batteryLevel,
            lastBatteryPercent: ctrl.batteryPercent,
            drainEvents: [{ time: Date.now(), level: ctrl.batteryLevel, percent: ctrl.batteryPercent }],
          };
        } else {
          // Update existing session
          const session = this.activeSessions[key];
          if (ctrl.batteryLevel !== session.lastBatteryLevel) {
            session.drainEvents.push({ time: Date.now(), level: ctrl.batteryLevel, percent: ctrl.batteryPercent });
            session.lastBatteryLevel = ctrl.batteryLevel;
            session.lastBatteryPercent = ctrl.batteryPercent;
          }
        }
      } else if (this.activeSessions[key]) {
        this._endSession(key);
      }
    }
  }

  _endSession(key) {
    const session = this.activeSessions[key];
    if (!session) return;
    const endTime = Date.now();
    const durationMs = endTime - session.startTime;

    if (durationMs > 30000) {
      const label = this.storage.getLabels()[key] || `Controller ${parseInt(key) + 1}`;
      this.storage.addSession({
        controllerIndex: session.controllerIndex,
        label,
        startTime: session.startTime,
        endTime,
        durationMs,
        batteryType: session.batteryType,
        startBatteryPercent: session.startBatteryPercent,
        endBatteryPercent: session.lastBatteryPercent,
        drainEvents: session.drainEvents,
        levelsDropped: Math.max(0, session.startBatteryPercent - session.lastBatteryPercent),
      });
    }
    delete this.activeSessions[key];
  }

  getActiveSessions() {
    const result = {};
    for (const [key, session] of Object.entries(this.activeSessions)) {
      result[key] = { ...session, durationMs: Date.now() - session.startTime };
    }
    return result;
  }

  endAll() { for (const key of Object.keys(this.activeSessions)) this._endSession(key); }
}
