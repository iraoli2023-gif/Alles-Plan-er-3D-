import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Bell, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface WindowsCalendarFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  currentWatts: number;
}

export const WindowsCalendarFlyout: React.FC<WindowsCalendarFlyoutProps> = ({
  isOpen,
  onClose,
  currentWatts,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');
  
  const dateFormatted = currentTime.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed bottom-14 right-3 w-[92vw] max-w-[340px] bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl z-50 p-4 text-slate-100 flex flex-col gap-4 select-none animate-in fade-in slide-in-from-bottom-5 duration-200">
        {/* Top: Large Digital Clock & Date */}
        <div className="border-b border-white/10 pb-3 flex items-center justify-between">
          <div>
            <div className="text-3xl font-light font-mono text-white tracking-tight">
              {hours}:{minutes}<span className="text-lg text-slate-400">:{seconds}</span>
            </div>
            <div className="text-xs text-sky-400 font-medium mt-0.5">
              {dateFormatted}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Mini Calendar View */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">
              {currentTime.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </span>
            <div className="flex items-center gap-1 text-slate-400">
              <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-white" />
              <ChevronRight className="w-4 h-4 cursor-pointer hover:text-white" />
            </div>
          </div>
          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 font-semibold mb-1">
            <span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span>
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
              const isToday = day === currentTime.getDate();
              return (
                <div
                  key={day}
                  className={`h-7 flex items-center justify-center rounded-lg text-xs font-mono transition ${
                    isToday
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-300 hover:bg-white/10 cursor-pointer'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              Benachrichtigungen
            </span>
            <span className="text-[10px] text-slate-500">2 neu</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-white/10 flex items-start gap-2.5 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white">DIN 18015 Schnellprüfung</div>
                <div className="text-[10px] text-slate-400">Installationszonen & Stromkreise im grünen Bereich.</div>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/60 border border-white/10 flex items-start gap-2.5 text-left">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white">Echtzeit-Netzlast</div>
                <div className="text-[10px] text-slate-400">Aktueller Leistungsbedarf beträgt {currentWatts} Watt.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
