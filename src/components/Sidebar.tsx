import React, { useState } from 'react';
import {
  Search,
  Bluetooth,
  Radio,
  Cpu,
  Smartphone,
  Laptop,
  Users,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { PeerDevice, ChatMessage } from '../types';

interface SidebarProps {
  peers: PeerDevice[];
  activePeerId: string | null;
  lastMessagesMap: Map<string, ChatMessage>;
  isScanning: boolean;
  onSelectPeer: (peer: PeerDevice | 'all') => void;
  onScanClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  peers,
  activePeerId,
  lastMessagesMap,
  isScanning,
  onSelectPeer,
  onScanClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPeers = peers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.deviceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDeviceIcon = (deviceType: PeerDevice['deviceType']) => {
    switch (deviceType) {
      case 'ESP32':
      case 'nRF52 Board':
      case 'BLE Beacon':
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case 'Smartphone':
        return <Smartphone className="w-4 h-4 text-blue-400" />;
      case 'Laptop / PC':
        return <Laptop className="w-4 h-4 text-purple-400" />;
      default:
        return <Radio className="w-4 h-4 text-amber-400" />;
    }
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 bg-black/20 border-r border-white/5 flex flex-col shrink-0 min-h-0 overflow-hidden backdrop-blur-2xl">
      {/* Search Header */}
      <div className="p-3.5 border-b border-white/5 space-y-3 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Bluetooth devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/50 transition-all font-sans"
          />
        </div>
      </div>

      {/* Broadcast Group Channel Option */}
      <div className="px-3 pt-3 shrink-0">
        <button
          onClick={() => onSelectPeer('all')}
          className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
            activePeerId === 'all'
              ? 'bg-blue-500/10 border border-blue-500/30 ring-1 ring-blue-500/20 text-white shadow-lg shadow-blue-500/5'
              : 'bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-100 truncate uppercase tracking-wider">
                Bluetooth Channel
              </h3>
              <span className="text-[9px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                BLE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              Send files & messages via Bluetooth
            </p>
          </div>
        </button>
      </div>

      {/* Discovered Devices Header */}
      <div className="px-4 pt-4 pb-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
        <span>Bluetooth Devices</span>
        <button
          onClick={onScanClick}
          disabled={isScanning}
          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Scanning...' : 'Scan'}</span>
        </button>
      </div>

      {/* Peers List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {filteredPeers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-3 bg-white/5 border border-white/5 rounded-2xl">
            <Bluetooth className="w-8 h-8 mx-auto text-slate-500 animate-pulse" />
            <p className="text-xs">No nearby Bluetooth devices paired or available.</p>
            <p className="text-[10px] text-slate-500">
              Ensure Bluetooth is turned on in your browser/device settings and click below.
            </p>
            <button
              onClick={onScanClick}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Scan Bluetooth Devices</span>
            </button>
          </div>
        ) : (
          filteredPeers.map((peer) => {
            const isSelected = activePeerId === peer.id;
            const lastMsg = lastMessagesMap.get(peer.id);

            return (
              <button
                key={peer.id}
                onClick={() => onSelectPeer(peer)}
                className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-500/10 border border-blue-500/30 ring-1 ring-blue-500/20 text-white shadow-lg'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  {getDeviceIcon(peer.deviceType)}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-100 truncate">
                      {peer.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatTimestamp(lastMsg?.timestamp)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {lastMsg ? lastMsg.text : `${peer.deviceType} • Paired via BLE`}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
