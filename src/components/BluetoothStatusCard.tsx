import React from 'react';
import { BluetoothOff, BluetoothSearching } from 'lucide-react';
import { BluetoothConnectionStatus } from '../types';

interface BluetoothStatusCardProps {
  status: BluetoothConnectionStatus;
  onScanClick: () => void;
}

export const BluetoothStatusCard: React.FC<BluetoothStatusCardProps> = ({
  status,
  onScanClick,
}) => {
  if (status === 'connected' || status === 'available') return null;

  const isUnsupported = status === 'unsupported';

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 sm:px-4 py-2 text-xs text-amber-300 flex items-center justify-between shrink-0 select-none backdrop-blur-md flex-wrap gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <BluetoothOff className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="min-w-0">
          <span className="font-bold font-mono text-[11px] sm:text-xs">
            {status === 'scanning'
              ? 'Scanning for hardware Bluetooth peripherals...'
              : status === 'connecting'
              ? 'Connecting to Bluetooth GATT Server...'
              : isUnsupported
              ? 'Web Bluetooth API is disabled on iOS Safari/Brave.'
              : 'Bluetooth Peripheral Disconnected'}
          </span>
          <span className="hidden sm:inline text-[11px] text-amber-400/80 ml-2">
            {isUnsupported ? 'Use Bluefy browser on iOS, or Chrome on Android/Desktop.' : 'Tap Scan to discover nearby Bluetooth devices.'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
        <button
          onClick={onScanClick}
          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-[11px] transition-all cursor-pointer shrink-0 shadow-md flex items-center gap-1"
        >
          <BluetoothSearching className="w-3 h-3" />
          <span>Scan BLE</span>
        </button>
      </div>
    </div>
  );
};

