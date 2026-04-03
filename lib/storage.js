import fs from 'fs';
import path from 'path';

const DATA_FILE = 'xbat-data.json';

const DEFAULT_DATA = {
  sessions: [],
  labels: {},
  stats: {
    totalPlayTimeMs: 0,
    totalSessions: 0,
    longestSessionMs: 0,
  },
};

export class Storage {
  constructor(userDataPath) {
    this.filePath = path.join(userDataPath, DATA_FILE);
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return { ...DEFAULT_DATA, ...JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) };
      }
    } catch {}
    return { ...DEFAULT_DATA };
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch {}
  }

  addSession(session) {
    this.data.sessions.push(session);
    if (this.data.sessions.length > 100) this.data.sessions = this.data.sessions.slice(-100);
    this.data.stats.totalPlayTimeMs += session.durationMs;
    this.data.stats.totalSessions++;
    if (session.durationMs > this.data.stats.longestSessionMs) this.data.stats.longestSessionMs = session.durationMs;
    this._save();
  }

  getHistory() { return this.data.sessions.slice(-20); }

  getStats() {
    const today = new Date().toDateString();
    const todaySessions = this.data.sessions.filter(s => new Date(s.endTime).toDateString() === today);
    const todayPlayTimeMs = todaySessions.reduce((sum, s) => sum + s.durationMs, 0);
    return {
      ...this.data.stats,
      todayPlayTimeMs,
      todaySessions: todaySessions.length,
      avgSessionMs: this.data.stats.totalSessions > 0 ? Math.round(this.data.stats.totalPlayTimeMs / this.data.stats.totalSessions) : 0,
    };
  }

  getLabels() { return this.data.labels; }
  setLabel(index, label) { this.data.labels[String(index)] = label; this._save(); }
}
