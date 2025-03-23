// src/components/common/ErrorBoundary.js
'use client';
import { Component } from 'react';
export default class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error('[ErrorBoundary] Caught error:', error.message);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-500">Something went wrong.</div>;
    }
    return this.props.children;
  }
}