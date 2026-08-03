import React from 'react';
import { BluetoothOff } from 'lucide-react';
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

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between shrink-0 select-none backdrop-blur-md">
      <div className="flex items-center gap-2">
        <BluetoothOff className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <span className="font-bold font-mono">
            {status === 'scanning'
              ? 'Scanning Bluetooth frequencies...'
              : status === 'connecting'
              ? 'Establishing Bluetooth GATT connection...'
              : status === 'unsupported'
              ? 'Web Bluetooth API unavailable in this browser context.'
              : 'Bluetooth GATT Disconnected'}
          </span>
          <span className="hidden md:inline text-[11px] text-amber-400/80 ml-2">
            Click Scan to pair with nearby Bluetooth devices.
          </span>
        </div>
      </div>

      <button
        onClick={onScanClick}
        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-[11px] transition-all cursor-pointer shrink-0 ml-2 shadow-md"
      >
        Scan BLE
      </button>
    </div>
  );
};
