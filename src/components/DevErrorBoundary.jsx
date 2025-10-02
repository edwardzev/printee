import React from 'react';

export default class DevErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // also log to console
    // eslint-disable-next-line no-console
    console.error('DevErrorBoundary caught error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, info } = this.state;

    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ color: '#b91c1c' }}>Application Error</h1>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#111', color: '#fff', padding: 12, borderRadius: 6 }}>
          {String(error && (error.stack || error.message || error))}
        </pre>
        {info && info.componentStack ? (
          <details style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
            <summary style={{ cursor: 'pointer' }}>Component stack</summary>
            <pre>{info.componentStack}</pre>
          </details>
        ) : null}
      </div>
    );
  }
}
