"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Admin Control Panel Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-gray-900 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-red-900/20 border border-red-500 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-500 mb-4">
              Admin Panel Error
            </h1>
            <div className="text-white space-y-4">
              <p className="font-semibold">Something went wrong:</p>
              <pre className="text-xs bg-gray-800 p-4 rounded overflow-auto">
                {this.state.error?.message}
              </pre>
              <pre className="text-xs bg-gray-800 p-4 rounded overflow-auto">
                {this.state.error?.stack}
              </pre>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
