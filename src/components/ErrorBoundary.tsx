import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Called with (error, info) — plug in a logger/telemetry here. */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Optional custom fallback. If not provided a default one is rendered. */
  fallback?: (args: { error: Error; reset: () => void }) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Catches render/lifecycle errors anywhere in the
 * tree and shows a recovery screen instead of letting React unmount the whole
 * app with a blank page.
 *
 * For async errors (fetch, event handlers) use toast + try/catch in callers.
 * React boundaries don't see those — that's a React limitation, not a bug.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Forward to any telemetry pipeline (Sentry.captureException, console, etc.)
    this.props.onError?.(error, info);
    // Helpful in dev — the default console.error already fires but this
    // groups the component stack next to it.
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground">
                Something went wrong
              </h1>
              <p className="text-xs text-muted-foreground">
                The app crashed unexpectedly. Try reloading.
              </p>
            </div>
          </div>

          {import.meta.env.DEV && (
            <pre className="text-[11px] bg-secondary/60 border border-border rounded-lg p-3 overflow-auto max-h-40 font-mono text-muted-foreground whitespace-pre-wrap break-words">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={this.reset}
              className="text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs font-medium bg-secondary hover:bg-secondary/80 border border-border px-3 py-2 rounded-lg text-foreground transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
