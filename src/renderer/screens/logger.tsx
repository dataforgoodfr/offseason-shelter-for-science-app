import { useEffect, useState, useRef } from "react";
import { MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/outline";
import { LOG_SOURCE_MAIN, LOG_SOURCE_RENDERER, LOG_SOURCE_SYSTEM, LogSource } from "lib/electron-app/types/logger";

// Types
interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: LogSource;
  message: string;
  data?: any;
}

export function LoggerScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [filterSource, setFilterSource] = useState<'all' | LogSource>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load existing logs
    loadLogs();

    // Listen for new logs
    const removeListener = window.App.onLoggerNewLog((log: LogEntry) => {
      setLogs(prev => [...prev, log]);
    });

    // Listen for logs cleared notification
    const removeClearListener = window.App.onLoggerLogsCleared(() => {
      setLogs([]);
    });

    return () => {
      removeListener();
      removeClearListener();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to the bottom when new logs arrive
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const loadLogs = async () => {
    try {
      const existingLogs = await window.App.getLogs();
      setLogs(existingLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const clearLogs = async () => {
    try {
      await window.App.clearLogs();
      setLogs([]);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (filterSource !== 'all' && log.source !== filterSource) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'debug': return 'text-green-400';
      default: return 'text-green-200';
    }
  };

  const getSourceColor = (source: LogEntry['source']) => {
    switch (source) {
      case LOG_SOURCE_MAIN: return 'text-green-300';
      case LOG_SOURCE_RENDERER: return 'text-green-300';
      case LOG_SOURCE_SYSTEM: return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex w-full h-screen p-4 flex-col items-start gap-0 box-border rounded-xl border border-white bg-gradient-to-t from-transparent via-transparent to-black/30 backdrop-blur-[17px] overflow-hidden"
        style={{ 
          background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.00) 50%, rgba(0, 0, 0, 0.30) 100%), rgba(69, 126, 101, 0.75)'
        }}
    >
      {/* Header */}
      <div className="flex justify-end items-center self-stretch mb-4">
        <button
          onClick={clearLogs}
          className="flex gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors text-white"
        >
          <TrashIcon className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-end p-3 rounded-md border border-white/30 mb-4 w-full bg-[#457E65] backdrop-blur-[17px]">
        <div className="flex items-center gap-4">
          {/* Filter by level */}
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">Level:</span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="px-2 py-1 rounded text-sm bg-[#457E65]"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.3)",
                fontFamily: "Akzidenz-Grotesk Pro"
              }}
            >
              <option value="all">All</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          {/* Filter by source */}
          <div className="flex items-center gap-2 text-white">
            <span className="text-sm font-medium">Source:</span>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
              className="px-2 py-1 rounded text-sm bg-[#457E65]"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.3)",
                fontFamily: "Akzidenz-Grotesk Pro"
              }}
            >
              <option value="all">All</option>
              <option value={LOG_SOURCE_MAIN}>Main</option>
              <option value={LOG_SOURCE_RENDERER}>Renderer</option>
              <option value={LOG_SOURCE_SYSTEM}>System</option>
            </select>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-end gap-2 text-white">
            <MagnifyingGlassIcon className="w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter logs by message..."
              className="px-2 py-1 rounded text-sm bg-[#457E65] text-white placeholder-white/60 w-48"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.3)",
                fontFamily: "Akzidenz-Grotesk Pro"
              }}
            />
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-auto w-full">
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-white/70 py-8">
              No logs to display
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-md border border-white/30 font-mono text-sm"
                style={{
                  background: "linear-gradient(0deg, rgba(69, 126, 101, 0.3), rgba(69, 126, 101, 0.3)), linear-gradient(360deg, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.1) 100%)"
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-bold ${getLevelColor(log.level)}`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className={`text-xs ${getSourceColor(log.source)}`}>
                    [{log.source}]
                  </span>
                  <span className="text-white/60 text-xs">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-white">{log.message}</div>
                {log.data && (
                  <div className="mt-2 p-2 rounded text-xs text-white/80"
                       style={{
                         background: "rgba(0, 0, 0, 0.2)"
                       }}>
                    <pre>{JSON.stringify(log.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="w-full h-[32px] flex items-center gap-2 pt-2 opacity-80 justify-center"
            style={{ transform: "rotate(0deg)" }}>
        <span className="text-[9px] text-white font-normal uppercase tracking-[0.1em] leading-[100%] text-center align-middle"
              style={{ fontFamily: "Akzidenz-Grotesk Pro" }}>
          {filteredLogs.length} log(s) displayed on {logs.length} total
        </span>
      </div>
    </div>
  );
}
