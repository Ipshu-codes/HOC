"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onError: () => void;
}

/**
 * Keeps a renderer failure from taking the gallery page with it. The DOM walk stays mounted as the
 * fallback; Gallery switches to hanging-memory when this fires. No UI or words are rendered here.
 */
export default class MuseumErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
