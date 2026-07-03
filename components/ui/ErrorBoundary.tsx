'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import Button from './Button';
import { FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
            <FiAlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-zinc-400">
            {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
          </p>
          <div className="mt-6">
            <Button
              onClick={this.handleRetry}
              icon={<FiRefreshCw className="h-4 w-4" />}
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
