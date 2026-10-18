import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ProjectState } from '../utils/projectAutoSave';
import { markCrash, getLatestSnapshot } from '../utils/projectAutoSave';
import { 
  ShieldAlert, 
  RotateCcw, 
  RefreshCw, 
  Home, 
  Terminal, 
  AlertTriangle 
} from 'lucide-react';

interface Props {
  children: ReactNode;
  currentState?: ProjectState;
  onRestoreState?: (state: ProjectState) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class CrashErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('CrashErrorBoundary caught an uncaught error:', error, errorInfo);

    // Save emergency snapshot of the project state to LocalStorage
    try {
      markCrash(error.message || 'Komponenten-Absturz', this.props.currentState);
    } catch (saveErr) {
      console.warn('Could not record emergency snapshot:', saveErr);
    }
  }

  private handleRestoreLatest = () => {
    try {
      const latest = getLatestSnapshot();
      if (latest && latest.state && this.props.onRestoreState) {
        this.props.onRestoreState(latest.state);
        this.setState({ hasError: false, error: null, errorInfo: null });
        return;
      }
    } catch {
      // fallback to reload
    }
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToDemo = () => {
    try {
      localStorage.removeItem('voltcad_crash_detected');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const latestSnapshot = getLatestSnapshot();

      return (
        <div className="w-full h-full min-h-[440px] bg-slate-950 text-slate-100 flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-xl w-full bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl shadow-slate-950/90 space-y-6 my-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white flex items-center gap-2">
                  VoltCAD 3D • Absturz abgefangen
                </h1>
                <p className="text-xs text-amber-300">
                  Ein unerwarteter Fehler ist aufgetreten. Dein Projektstand wurde im LocalStorage gesichert.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>Fehlerprotokoll:</span>
              </div>
              <p className="text-xs text-rose-400 font-mono break-all">
                {this.state.error?.message || 'Unbekannter Ausnahmefehler'}
              </p>
            </div>

            {/* Latest Auto-Save Details */}
            {latestSnapshot && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>Verfügbarer Wiederherstellungspunkt:</span>
                </div>
                <p className="text-slate-400">
                  Stand vom <strong className="text-slate-200">{latestSnapshot.savedAtFormatted}</strong> ({latestSnapshot.description})
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {latestSnapshot.summary.furnitureCount} Möbel • {latestSnapshot.summary.electricalCount} Elektro • {latestSnapshot.summary.wiringCount} Leitungen
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              {latestSnapshot && (
                <button
                  onClick={this.handleRestoreLatest}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Projektstand wiederherstellen & fortfahren</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={this.handleReload}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Seite neu laden</span>
                </button>

                <button
                  onClick={this.handleResetToDemo}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  title="Auf Standard-Musterwohnung zurücksetzen"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Zurücksetzen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
