import React from 'react';
import {
  X,
  Bluetooth,
  BluetoothSearching,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Info,
} from 'lucide-react';
import { BluetoothConnectionStatus, DiagnosticsStatus } from '../types';

interface ScanModalProps {
  isOpen: boolean;
  status: BluetoothConnectionStatus;
  diagnostics: DiagnosticsStatus;
  onClose: () => void;
  onStartBleScan: () => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  status,
  diagnostics,
  onClose,
  onStartBleScan,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900/95 border border-white/10 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-xl">
              <BluetoothSearching className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-widest">
                Bluetooth Device Discovery
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Pair real hardware Bluetooth peripherals via Web Bluetooth
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diagnostics Checklist */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 space-y-2.5 text-xs backdrop-blur-md">
          <h4 className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Hardware Bluetooth Readiness</span>
          </h4>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/5">
              {diagnostics.hasWebBluetooth ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="truncate">Web Bluetooth API</span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-black/30 rounded-lg border border-white/5">
              {diagnostics.bluetoothAvailable ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="truncate">Bluetooth Hardware</span>
            </div>
          </div>

          {!diagnostics.hasWebBluetooth && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl text-[11px] space-y-1.5 leading-relaxed">
              <div className="font-bold flex items-center gap-1 text-amber-300">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Mobile Browser Bluetooth Note</span>
              </div>
              <p>
                <strong>Apple iOS (iPhone/iPad)</strong>: Safari, Brave, and Chrome on iOS disable the Web Bluetooth API due to WebKit restrictions. To scan Bluetooth devices on iOS, open this web app inside the free <strong>"Bluefy" Web BLE Browser</strong> from the App Store.
              </p>
              <p>
                <strong>Android / Desktop</strong>: Native Web Bluetooth works directly in Chrome, Edge, and Opera over HTTPS or localhost.
              </p>
            </div>
          )}
        </div>

        {/* Scan Actions */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              onStartBleScan();
              onClose();
            }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 border border-blue-400/30 cursor-pointer transition-all uppercase tracking-wider"
          >
            <Bluetooth className="w-4 h-4" />
            <span>Scan Hardware Bluetooth Devices</span>
          </button>

          <p className="text-[10px] text-slate-400 text-center font-mono pt-1">
            Web Bluetooth requires hardware Bluetooth turned ON on your phone/PC.
          </p>
        </div>
      </div>
    </div>
  );
};
