"use client";

import { Component } from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center py-32 border border-border-alt bg-card">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-xl border border-border-alt bg-hover flex items-center justify-center mx-auto">
                <span className="text-red-500 text-xl">!</span>
              </div>
              <p className="font-mono text-sm text-fg-dim font-semibold">Something went wrong</p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="font-mono text-[10px] text-red-500 uppercase tracking-widest hover:underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
