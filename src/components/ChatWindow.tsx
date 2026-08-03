import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Check,
  CheckCheck,
  Radio,
  Cpu,
  Smartphone,
  Laptop,
  MoreVertical,
  Trash2,
  Download,
  ShieldCheck,
  Smile,
  Zap,
  Clock,
  AlertCircle,
  Terminal,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  File,
  ArrowLeft,
} from 'lucide-react';
import { PeerDevice, ChatMessage, UserProfile, FileAttachment } from '../types';

interface ChatWindowProps {
  activePeer: PeerDevice | 'all' | null;
  messages: ChatMessage[];
  userProfile: UserProfile;
  onSendMessage: (text: string) => void;
  onSendFileMessage: (file: File, captionText?: string) => void;
  onClearChat: () => void;
  onExportChat: () => void;
  onOpenGattInspector: () => void;
  onBackToSidebar?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  activePeer,
  messages,
  userProfile,
  onSendMessage,
  onSendFileMessage,
  onClearChat,
  onExportChat,
  onOpenGattInspector,
  onBackToSidebar,
}) => {
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  // Handle File Selection from Browser
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setFilePreviewUrl(url);
      } else {
        setFilePreviewUrl(null);
      }
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (selectedFile) {
      onSendFileMessage(selectedFile, inputText.trim());
      clearSelectedFile();
      setInputText('');
      setShowEmojiPicker(false);
      return;
    }

    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
    setShowEmojiPicker(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const quickChips = [
    'Hello via Bluetooth! 👋',
    'Sending file over GATT 📁',
    'Bluetooth Signal OK? 📶',
    'Offline BLE packet test ⚡',
  ];

  const quickEmojis = ['👍', '❤️', '📁', '📷', '📶', '⚡', '🚀', '🔒'];

  const getDeviceIcon = (peer: PeerDevice | 'all') => {
    if (peer === 'all') return <Radio className="w-5 h-5 text-emerald-400" />;
    switch (peer.deviceType) {
      case 'ESP32':
      case 'nRF52 Board':
      case 'BLE Beacon':
        return <Cpu className="w-5 h-5 text-emerald-400" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-blue-400" />;
      case 'Laptop / PC':
        return <Laptop className="w-5 h-5 text-purple-400" />;
      default:
        return <Radio className="w-5 h-5 text-amber-400" />;
    }
  };

  const getStatusTicks = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-slate-400 animate-pulse" />;
      case 'sent':
        return <Check className="w-3.5 h-3.5 text-slate-400" />;
      case 'delivered':
        return <CheckCheck className="w-3.5 h-3.5 text-slate-400" />;
      case 'read':
        return <CheckCheck className="w-3.5 h-3.5 text-emerald-400 font-bold" />;
      case 'failed':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return null;
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!activePeer) {
    return (
      <main className="flex-1 bg-black/10 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-3xl">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-blue-400 shadow-2xl backdrop-blur-md">
          <Radio className="w-10 h-10 animate-pulse" />
        </div>
        <h2 className="text-base font-bold text-slate-100 uppercase tracking-widest">Bluetooth Offline File Sharing</h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
          Select a discovered Bluetooth device or click "Scan BLE" to pair and send files or messages directly over Bluetooth hardware.
        </p>
      </main>
    );
  }

  const isBroadcast = activePeer === 'all';
  const peerName = isBroadcast ? 'Nearby Broadcast Channel' : activePeer.name;

  return (
    <main className="flex-1 bg-black/10 flex flex-col min-h-0 overflow-hidden relative backdrop-blur-3xl">
      {/* Active Conversation Topbar */}
      <header className="h-14 sm:h-16 bg-white/5 border-b border-white/10 px-2.5 sm:px-6 flex items-center justify-between shrink-0 z-10 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBackToSidebar && (
            <button
              onClick={onBackToSidebar}
              className="md:hidden p-2 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Back to Bluetooth Devices"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {getDeviceIcon(activePeer)}
          </div>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate flex items-center gap-1.5 sm:gap-2">
              <span className="truncate">{peerName}</span>
              {!isBroadcast && (
                <span className="text-[9px] font-mono font-bold px-1.5 sm:px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full shrink-0">
                  {activePeer.connected ? 'Paired' : 'Offline'}
                </span>
              )}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate flex items-center gap-1 sm:gap-1.5 mt-0.5">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 inline shrink-0" />
              <span className="truncate">
                {isBroadcast
                  ? 'BLE Local Transfer'
                  : `${activePeer.deviceType} • RSSI: ${activePeer.rssi} dBm`}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenGattInspector}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-blue-300 rounded-xl text-xs font-semibold border border-white/10 transition-colors cursor-pointer backdrop-blur-md"
            title="Inspect Bluetooth GATT Stream"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>GATT Inspector</span>
          </button>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-slate-400 hover:text-slate-100 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Context Menu Dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-11 w-48 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl p-1 z-30 text-xs text-slate-200 backdrop-blur-xl">
              <button
                onClick={() => {
                  onExportChat();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-white/10 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-blue-400" />
                <span>Export Chat Log</span>
              </button>

              <button
                onClick={() => {
                  onClearChat();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-white/10 rounded-xl flex items-center gap-2 text-rose-400 cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Conversation</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages Thread Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-transparent to-black/20"
      >
        {/* Encryption/Bluetooth Banner */}
        <div className="my-2 p-3 bg-white/5 border border-white/10 rounded-2xl text-center text-[11px] text-slate-300 max-w-md mx-auto space-y-1 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-center gap-1.5 text-blue-400 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Direct Offline Bluetooth Transfer</span>
          </div>
          <p className="text-slate-400 text-[10px]">
            Files and messages travel directly via Bluetooth hardware GATT packets without cloud internet.
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Radio className="w-8 h-8 mx-auto text-slate-600 animate-bounce" />
            <p className="text-xs">No messages yet. Pick a file or type a message to send over Bluetooth!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.isMine;
            const attachment = msg.fileAttachment;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-lg text-xs relative backdrop-blur-md ${
                    isMine
                      ? 'bg-blue-600/20 border border-blue-500/30 text-slate-100 rounded-tr-none shadow-blue-500/10'
                      : 'bg-white/10 border border-white/10 text-slate-100 rounded-tl-none'
                  }`}
                >
                  {/* Sender Label */}
                  {!isMine && (
                    <div className="font-bold text-[10px] text-blue-400 mb-1">
                      {msg.fromName}
                    </div>
                  )}

                  {/* File Attachment Card */}
                  {attachment && (
                    <div className="mb-2 p-2.5 bg-black/40 border border-white/10 rounded-xl space-y-2">
                      {attachment.fileType.startsWith('image/') ? (
                        <div className="relative rounded-lg overflow-hidden max-h-56 bg-black/60 flex items-center justify-center border border-white/10">
                          <img
                            src={attachment.dataUrl}
                            alt={attachment.fileName}
                            className="object-cover max-h-56 w-full"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
                          <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate text-xs text-slate-200">
                              {attachment.fileName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {formatFileSize(attachment.fileSize)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Download Link Button */}
                      <a
                        href={attachment.dataUrl}
                        download={attachment.fileName}
                        className="w-full py-1.5 px-3 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 text-blue-200 rounded-lg flex items-center justify-center gap-2 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download File ({formatFileSize(attachment.fileSize)})</span>
                      </a>
                    </div>
                  )}

                  {/* Message Text */}
                  {msg.text && (
                    <div className="whitespace-pre-wrap leading-relaxed text-xs font-sans">
                      {msg.text}
                    </div>
                  )}

                  {/* Bottom Metadata */}
                  <div
                    className={`flex items-center justify-end gap-1.5 text-[10px] mt-2 font-mono ${
                      isMine ? 'text-blue-200/80' : 'text-slate-400'
                    }`}
                  >
                    <span className="uppercase text-[9px] font-bold text-emerald-400">
                      BLUETOOTH
                    </span>
                    <span>•</span>
                    <span>{formatTime(msg.timestamp)}</span>
                    {isMine && <span>{getStatusTicks(msg.status)}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected File Banner Preview before sending */}
      {selectedFile && (
        <div className="px-4 py-2 bg-blue-950/80 border-t border-blue-500/30 flex items-center justify-between text-xs backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            {filePreviewUrl ? (
              <img
                src={filePreviewUrl}
                alt="Preview"
                className="w-8 h-8 object-cover rounded-md border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-md bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
                <File className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-slate-100 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                {formatFileSize(selectedFile.size)} • Ready to send via Bluetooth
              </p>
            </div>
          </div>
          <button
            onClick={clearSelectedFile}
            className="p-1 text-slate-400 hover:text-white bg-white/10 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Reply Chips */}
      <div className="px-2.5 sm:px-4 py-1.5 bg-white/5 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs backdrop-blur-md shrink-0">
        <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setInputText(chip)}
            className="px-2.5 sm:px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-200 rounded-full shrink-0 transition-all text-[10px] sm:text-[11px] cursor-pointer border border-white/10 font-medium whitespace-nowrap"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Message & File Composer Bar */}
      <form
        onSubmit={handleSend}
        className="p-2 sm:p-3 bg-white/5 border-t border-white/10 flex items-center gap-1.5 sm:gap-2 relative z-10 backdrop-blur-xl shrink-0"
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />

        {/* File Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-400 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl transition-colors cursor-pointer shrink-0"
          title="Select image or document to transfer via Bluetooth"
        >
          <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Emoji Toggle */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 sm:p-2.5 text-slate-400 hover:text-amber-400 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl transition-colors cursor-pointer shrink-0"
        >
          <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Emoji Quick Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-14 sm:bottom-16 left-2 sm:left-3 bg-slate-900/95 border border-white/10 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 sm:gap-2 z-30 backdrop-blur-xl max-w-[90vw] overflow-x-auto">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="p-1.5 hover:bg-white/10 rounded-xl text-base cursor-pointer transition-all shrink-0"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Input Field */}
        <input
          type="text"
          placeholder={selectedFile ? 'Add optional caption...' : 'Type message or pick file...'}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-[13px] sm:text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500/50 transition-all font-sans"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() && !selectedFile}
          className="p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl sm:rounded-2xl shadow-lg shadow-blue-600/30 border border-blue-400/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </main>
  );
};
