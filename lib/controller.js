// Controller module — wraps xinput-ffi for battery & connection polling
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const BATTERY_LEVEL_MAP = {
  'BATTERY_LEVEL_EMPTY': { label: 'Empty', percent: 5, color: '#ef4444' },
  'BATTERY_LEVEL_LOW': { label: 'Low', percent: 25, color: '#f97316' },
  'BATTERY_LEVEL_MEDIUM': { label: 'Medium', percent: 65, color: '#eab308' },
  'BATTERY_LEVEL_FULL': { label: 'Full', percent: 100, color: '#22c55e' },
};

const BATTERY_TYPE_MAP = {
  'BATTERY_TYPE_DISCONNECTED': 'Disconnected',
  'BATTERY_TYPE_WIRED': 'Wired',
  'BATTERY_TYPE_ALKALINE': 'Alkaline',
  'BATTERY_TYPE_NIMH': 'NiMH',
  'BATTERY_TYPE_UNKNOWN': 'Unknown',
};

export class ControllerManager {
  constructor() {
    this.xinput = null;
    this._ready = false;
    this._loadPromise = this._loadXInput();
  }

  async _loadXInput() {
    try {
      const mod = await import('xinput-ffi');
      this.xinput = mod;
      this._ready = true;
      console.log('[XBat] xinput-ffi loaded successfully');
    } catch (err) {
      console.error('[XBat] Failed to load xinput-ffi:', err.message);
      this.xinput = null;
      this._ready = false;
    }
  }

  async pollAll() {
    await this._loadPromise;
    const controllers = [];
    for (let i = 0; i < 4; i++) {
      controllers.push(await this._pollOne(i));
    }
    return controllers;
  }

  async _getBluetoothBattery() {
    try {
      // GUID {98230571-0087-4145-9822-83b462319e0c} 2 is DEVPKEY_Device_BatteryLevel
      const cmd = `powershell -Command "Get-PnpDevice | Where-Object { $_.FriendlyName -like '*Xbox*' -and $_.Status -eq 'OK' } | ForEach-Object { Get-PnpDeviceProperty -InstanceId $_.InstanceId -KeyName '{98230571-0087-4145-9822-83b462319e0c} 2' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Data }"`;
      const { stdout } = await execAsync(cmd);
      const level = parseInt(stdout.trim());
      if (!isNaN(level)) return level;
    } catch {}
    return null;
  }

  async _pollOne(index) {
    const result = {
      index,
      connected: false,
      batteryLevel: null,
      batteryPercent: 0,
      batteryColor: '#6b7280',
      batteryLabel: 'Unknown',
      batteryType: 'Unknown',
      isWired: false,
    };

    if (!this._ready || !this.xinput) return result;

    try {
      // 1. Check if controller is connected at all using getState
      try {
        await this.xinput.getState({ dwUserIndex: index });
        result.connected = true;
      } catch (e) {
         return result;
      }

      // 2. Try to get battery information
      try {
        const batteryInfo = await this.xinput.getBatteryInformation({ dwUserIndex: index });

        if (batteryInfo && batteryInfo.batteryType !== 'BATTERY_TYPE_DISCONNECTED') {
          result.batteryType = BATTERY_TYPE_MAP[batteryInfo.batteryType] || batteryInfo.batteryType;
          result.isWired = batteryInfo.batteryType === 'BATTERY_TYPE_WIRED';

          const levelInfo = BATTERY_LEVEL_MAP[batteryInfo.batteryLevel];
          if (levelInfo) {
            result.batteryLevel = batteryInfo.batteryLevel;
            result.batteryPercent = levelInfo.percent;
            result.batteryColor = levelInfo.color;
            result.batteryLabel = levelInfo.label;
          }

          if (result.isWired) {
            result.batteryPercent = 100;
            result.batteryLabel = 'Wired';
            result.batteryColor = '#22c55e';
          }
        } else {
          // Connected via getState but disconnected via getBatteryInfo -> Bluetooth / Fallback
          result.batteryType = 'Bluetooth';
          result.batteryLabel = 'Lvl Unknown';
          
          // Fallback to PowerShell for Bluetooth Battery
          const btLevel = await this._getBluetoothBattery();
          if (btLevel !== null) {
            result.batteryPercent = btLevel;
            result.batteryLabel = btLevel > 20 ? (btLevel > 70 ? 'Full' : 'Med') : 'Low';
            result.batteryColor = btLevel > 20 ? (btLevel > 70 ? '#22c55e' : '#eab308') : '#ef4444';
          } else {
            result.batteryPercent = 50; 
            result.batteryColor = '#3b82f6';
          }
        }
      } catch (err) {
        result.batteryType = 'Bluetooth';
        result.batteryLabel = 'Lvl Unknown';
        const btLevel = await this._getBluetoothBattery();
        if (btLevel !== null) {
          result.batteryPercent = btLevel;
          result.batteryLabel = btLevel > 20 ? (btLevel > 70 ? 'Full' : 'Med') : 'Low';
          result.batteryColor = btLevel > 20 ? (btLevel > 70 ? '#22c55e' : '#eab308') : '#ef4444';
        } else {
          result.batteryPercent = 50;
          result.batteryColor = '#3b82f6';
        }
      }
    } catch (err) {}

    return result;
  }
}
