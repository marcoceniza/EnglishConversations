import React, { Component, ErrorInfo, PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
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

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 24,
          margin: 24,
          backgroundColor: '#1a1a2e',
          borderRadius: 12,
          color: '#e0e0e0',
          fontFamily: 'system-ui, sans-serif',
          maxWidth: 400,
        }}>
          <h2 style={{ color: '#ff6b6b', marginTop: 0 }}>⚠️ Something went wrong</h2>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '10px 20px',
              backgroundColor: '#208AEF',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
