import React, { useState } from 'react';
import {
  X,
  User,
  Sliders,
  Volume2,
  VolumeX,
  Vibrate,
  RotateCcw,
  Trash2,
  Download,
  Save,
  Check,
  Zap,
} from 'lucide-react';
import { BluetoothConfig, UserProfile } from '../types';
import {
  DEFAULT_SERVICE_UUID,
  DEFAULT_RX_UUID,
  DEFAULT_TX_UUID,
} from '../lib/bluetooth';

interface SettingsModalProps {
  isOpen: boolean;
  config: BluetoothConfig;
  userProfile: UserProfile;
  onClose: () => void;
  onSaveConfig: (newConfig: BluetoothConfig, newProfile: UserProfile) => void;
  onClearHistory: () => void;
  onExportHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  config,
  userProfile,
  onClose,
  onSaveConfig,
  onClearHistory,
  onExportHistory,
}) => {
  const [userName, setUserName] = useState(userProfile.name);
  const [serviceUuid, setServiceUuid] = useState(config.serviceUuid);
  const [rxUuid, setRxUuid] = useState(config.rxUuid);
  const [txUuid, setTxUuid] = useState(config.txUuid);
  const [enableSound, setEnableSound] = useState(config.enableSound);
  const [enableVibration, setEnableVibration] = useState(config.enableVibration);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedConfig: BluetoothConfig = {
      ...config,
      serviceUuid: serviceUuid.trim() || DEFAULT_SERVICE_UUID,
      rxUuid: rxUuid.trim() || DEFAULT_RX_UUID,
      txUuid: txUuid.trim() || DEFAULT_TX_UUID,
      enableSound,
      enableVibration,
      connectionMode: 'ble_hardware',
    };

    const updatedProfile: UserProfile = {
      ...userProfile,
      name: userName.trim() || 'Bluetooth User',
      bleDeviceName: userName.trim() || 'Bluetooth User',
    };

    onSaveConfig(updatedConfig, updatedProfile);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetUuids = () => {
    setServiceUuid(DEFAULT_SERVICE_UUID);
    setRxUuid(DEFAULT_RX_UUID);
    setTxUuid(DEFAULT_TX_UUID);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/95 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/5 border border-white/10 text-blue-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">
                Bluetooth Settings
              </h3>
              <p className="text-xs text-slate-400">
                Identity & Bluetooth GATT Configurations
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

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Display Name */}
          <div className="space-y-1">
            <label className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Device Display Name</span>
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500/50"
              placeholder="e.g. My Phone"
            />
          </div>

          {/* Sound & Haptics Toggles */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEnableSound(!enableSound)}
              className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                enableSound
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              {enableSound ? (
                <Volume2 className="w-4 h-4 text-blue-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <span className="font-bold text-xs">Sound Effects</span>
            </button>

            <button
              type="button"
              onClick={() => setEnableVibration(!enableVibration)}
              className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                enableVibration
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <Vibrate className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-xs">Haptic Feedback</span>
            </button>
          </div>

          {/* Custom BLE UUID Configuration */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Custom BLE GATT UUID Configuration</span>
              </span>

              <button
                type="button"
                onClick={handleResetUuids}
                className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer font-mono"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 text-[10px]">Service UUID</span>
                <input
                  type="text"
                  value={serviceUuid}
                  onChange={(e) => setServiceUuid(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <span className="text-slate-400 text-[10px]">RX Characteristic (Write)</span>
                <input
                  type="text"
                  value={rxUuid}
                  onChange={(e) => setRxUuid(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <span className="text-slate-400 text-[10px]">TX Characteristic (Notify)</span>
                <input
                  type="text"
                  value={txUuid}
                  onChange={(e) => setTxUuid(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>

          {/* History Data Management */}
          <div className="border-t border-white/10 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onExportHistory}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export History</span>
            </button>

            <button
              type="button"
              onClick={onClearHistory}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          {/* Submit */}
          <div className="border-t border-white/10 pt-3">
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 border border-blue-400/30 transition-all uppercase tracking-wider"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Settings Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
