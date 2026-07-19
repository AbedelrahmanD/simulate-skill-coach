import { Component, type ReactNode } from "react";

interface State { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error) { console.error("MockMate error:", error); }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Reset
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}