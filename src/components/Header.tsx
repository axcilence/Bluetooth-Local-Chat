import React from 'react';
import {
  Bluetooth,
  BluetoothSearching,
  BluetoothConnected,
  BluetoothOff,
  Radio,
  Settings,
  Terminal,
} from 'lucide-react';
import {
  BluetoothConnectionStatus,
  UserProfile,
  BluetoothConfig,
} from '../types';

interface HeaderProps {
  status: BluetoothConnectionStatus;
  userProfile: UserProfile;
  config: BluetoothConfig;
  isOnline: boolean;
  onScanClick: () => void;
  onOpenSettings: () => void;
  onOpenGattInspector: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  userProfile,
  onScanClick,
  onOpenSettings,
  onOpenGattInspector,
  onOpenProfile,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <BluetoothConnected className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">Bluetooth Connected</span>
          </div>
        );

      case 'scanning':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-semibold backdrop-blur-md animate-pulse">
            <BluetoothSearching className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline font-mono">Scanning Devices...</span>
          </div>
        );

      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full text-xs font-semibold backdrop-blur-md">
            <Bluetooth className="w-3.5 h-3.5 animate-bounce" />
            <span className="hidden sm:inline font-mono">Pairing GATT...</span>
          </div>
        );

      case 'available':
      case 'disconnected':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-full text-xs font-semibold backdrop-blur-md">
            <Bluetooth className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-mono">Bluetooth Ready</span>
          </div>
        );

      case 'unsupported':
      case 'off':
      case 'error':
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full text-xs font-semibold backdrop-blur-md">
            <BluetoothOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">Bluetooth Offline</span>
          </div>
        );
    }
  };

  return (
    <header className="h-16 bg-white/5 border-b border-white/10 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-20 shadow-lg">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center text-white backdrop-blur-md">
              <Radio className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-black text-slate-100 tracking-wider uppercase font-sans">
              Bluetooth Transfer
            </h1>
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-full">
              BLE GATT
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="font-mono text-emerald-400">Offline File Sharing</span>
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Status Badge */}
        {getStatusBadge()}

        {/* Start Scan Button */}
        <button
          onClick={onScanClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 border border-blue-400/30 transition-all cursor-pointer"
        >
          <BluetoothSearching className="w-4 h-4" />
          <span className="hidden sm:inline">Scan BLE</span>
        </button>

        {/* GATT Terminal Inspector Trigger */}
        <button
          onClick={onOpenGattInspector}
          className="p-2 text-blue-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer backdrop-blur-md"
          title="Open GATT Packet Terminal"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* User Profile Identity */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs transition-colors cursor-pointer backdrop-blur-md"
          title="Change Device Name"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-md"
            style={{ backgroundColor: userProfile.avatarColor }}
          >
            {userProfile.name.charAt(0).toUpperCase()}
          </div>
          <span className="hidden lg:inline text-slate-200 font-medium truncate max-w-[90px]">
            {userProfile.name}
          </span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer backdrop-blur-md"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
