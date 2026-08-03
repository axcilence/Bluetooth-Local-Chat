import React, { useState } from 'react';
import {
  X,
  Activity,
  Terminal,
  Send,
  RefreshCw,
  Search,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Heart,
  Battery,
  HardDrive,
} from 'lucide-react';
import { GattLogEntry, PeerDevice } from '../types';

interface GattInspectorModalProps {
  isOpen: boolean;
  logs: GattLogEntry[];
  activePeer: PeerDevice | 'all' | null;
  onClose: () => void;
  onExecuteRead: (serviceUuid: string, charUuid: string) => Promise<string>;
  onExecuteWrite: (serviceUuid: string, charUuid: string, text: string) => Promise<boolean>;
}

export const GattInspectorModal: React.FC<GattInspectorModalProps> = ({
  isOpen,
  logs,
  activePeer,
  onClose,
  onExecuteRead,
  onExecuteWrite,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [customServiceUuid, setCustomServiceUuid] = useState<string>('0000cafe-0000-1000-8000-00805f9b34fb');
  const [customCharUuid, setCustomCharUuid] = useState<string>('0000c001-0000-1000-8000-00805f9b34fb');
  const [customPayload, setCustomPayload] = useState<string>('PING');
  const [isExec, setIsExec] = useState<boolean>(false);
  const [readResult, setReadResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  const handleRead = async () => {
    setIsExec(true);
    setReadResult(null);
    try {
      const res = await onExecuteRead(customServiceUuid, customCharUuid);
      setReadResult(res);
    } catch (err: unknown) {
      setReadResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExec(false);
    }
  };

  const handleWrite = async () => {
    if (!customPayload.trim()) return;
    setIsExec(true);
    try {
      await onExecuteWrite(customServiceUuid, customCharUuid, customPayload);
    } catch (err: unknown) {
      setReadResult(`Write Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExec(false);
    }
  };

  const getTypeBadge = (type: GattLogEntry['type']) => {
    switch (type) {
      case 'READ':
        return (
          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[9px] font-bold font-mono flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3" /> READ
          </span>
        );
      case 'WRITE':
        return (
          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[9px] font-bold font-mono flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> WRITE
          </span>
        );
      case 'NOTIFY':
        return (
          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold font-mono flex items-center gap-1">
            <Zap className="w-3 h-3" /> NOTIFY
          </span>
        );
      case 'CONNECT':
        return (
          <span className="px-1.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded text-[9px] font-bold font-mono">
            CONNECT
          </span>
        );
      case 'DISCONNECT':
        return (
          <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-bold font-mono">
            DISCONNECT
          </span>
        );
      case 'ERROR':
        return (
          <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[9px] font-bold font-mono">
            ERROR
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-bold font-mono">
            SYSTEM
          </span>
        );
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const isPeerObject = typeof activePeer === 'object' && activePeer !== null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900/95 border border-white/10 rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
                <span>GATT Packet & Byte Stream Inspector</span>
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded-full normal-case font-mono">
                  Live Terminal
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Inspect raw GATT characteristic reads, writes, hex payloads & notifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connected Peer Details Card */}
        {isPeerObject && (
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
            <div className="p-2 bg-white/5 rounded-xl border border-white/5 space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Device Name</div>
              <div className="font-semibold text-emerald-400 truncate">{activePeer.name}</div>
            </div>

            <div className="p-2 bg-white/5 rounded-xl border border-white/5 space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Manufacturer / Model</div>
              <div className="font-mono text-[11px] text-blue-300 truncate">
                {activePeer.manufacturerName || activePeer.deviceType}
              </div>
            </div>

            <div className="p-2 bg-white/5 rounded-xl border border-white/5 space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                <Battery className="w-3 h-3 text-emerald-400" /> Battery / Signal
              </div>
              <div className="font-mono text-[11px] text-emerald-400">
                {activePeer.battery}% • {activePeer.rssi} dBm
              </div>
            </div>

            <div className="p-2 bg-white/5 rounded-xl border border-white/5 space-y-0.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400 animate-pulse" /> Telemetry / HR
              </div>
              <div className="font-mono text-[11px] text-rose-300">
                {activePeer.heartRateBpm ? `${activePeer.heartRateBpm} BPM` : 'GATT Active'}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Workspace: Direct Execution Form + Logs */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Manual GATT Command Builder Bar */}
          <div className="p-3 bg-slate-950/90 border-b border-slate-800 space-y-2 text-xs shrink-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-blue-400">
                <Zap className="w-3.5 h-3.5" /> Execute Manual GATT Command
              </span>
              <span className="text-[10px] font-mono text-slate-400">0xCAFE / 0x180F / 0x180A</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
              <div>
                <label className="text-[10px] text-slate-400">Service UUID</label>
                <input
                  type="text"
                  value={customServiceUuid}
                  onChange={(e) => setCustomServiceUuid(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="0000cafe-..."
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400">Characteristic UUID</label>
                <input
                  type="text"
                  value={customCharUuid}
                  onChange={(e) => setCustomCharUuid(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="0000c001-..."
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400">Payload Text / Command</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customPayload}
                    onChange={(e) => setCustomPayload(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="Payload string..."
                  />
                  <button
                    onClick={handleRead}
                    disabled={isExec}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50"
                  >
                    Read
                  </button>
                  <button
                    onClick={handleWrite}
                    disabled={isExec}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50"
                  >
                    Write
                  </button>
                </div>
              </div>
            </div>

            {readResult && (
              <div className="p-2 bg-slate-900 border border-blue-500/30 rounded-lg text-emerald-400 font-mono text-[11px]">
                Result: {readResult}
              </div>
            )}
          </div>

          {/* Log Filters Header */}
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filter Packets:</span>
              {['ALL', 'READ', 'WRITE', 'NOTIFY', 'ERROR'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    filterType === type
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {filteredLogs.length} Packets Captured
            </span>
          </div>

          {/* Live GATT Stream Terminal Output */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs bg-slate-950/90">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Terminal className="w-8 h-8 mx-auto text-slate-700 animate-pulse" />
                <p>No GATT packet events recorded yet. Trigger a scan or write a message to populate telemetry.</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(log.type)}
                      <span className="text-slate-300 font-bold">{log.deviceName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 truncate max-w-[150px]">S: {log.serviceUuid}</span>
                    </div>

                    <span className="text-slate-500">{formatTime(log.timestamp)}</span>
                  </div>

                  <div className="text-[11px] text-slate-200 font-semibold pl-1">
                    {log.valueText}
                  </div>

                  <div className="text-[10px] text-blue-400/90 bg-slate-950 p-1.5 rounded-lg border border-slate-800/60 overflow-x-auto">
                    <span className="text-slate-500 uppercase font-bold mr-2">HEX Payload:</span>
                    <span className="text-emerald-400">{log.bytesHex || '0x00'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
