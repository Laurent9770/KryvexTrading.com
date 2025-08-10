import React from 'react';

// Safe React renderer that prevents any React errors
export class SafeReactRenderer {
  private static instance: SafeReactRenderer;
  private errorCount = 0;
  private maxErrors = 10;

  static getInstance(): SafeReactRenderer {
    if (!SafeReactRenderer.instance) {
      SafeReactRenderer.instance = new SafeReactRenderer();
    }
    return SafeReactRenderer.instance;
  }

  // Safe render function that catches any React errors
  safeRender(element: React.ReactElement, container: Element): void {
    try {
      // Check if we've exceeded error threshold
      if (this.errorCount >= this.maxErrors) {
        console.warn('🚨 Too many React errors, showing fallback UI');
        this.renderFallbackUI(container);
        return;
      }

      // Attempt to render
      ReactDOM.render(element, container);
    } catch (error) {
      this.errorCount++;
      console.error('🚨 SafeReactRenderer caught error:', error);
      this.renderFallbackUI(container);
    }
  }

  // Safe createRoot function for React 18+
  safeCreateRoot(container: Element): any {
    try {
      const { createRoot } = require('react-dom/client');
      return createRoot(container);
    } catch (error) {
      console.error('🚨 Error creating React root:', error);
      return null;
    }
  }

  // Safe render with createRoot
  safeRenderWithRoot(element: React.ReactElement, container: Element): void {
    try {
      const root = this.safeCreateRoot(container);
      if (root) {
        root.render(element);
      } else {
        this.renderFallbackUI(container);
      }
    } catch (error) {
      console.error('🚨 Error rendering with root:', error);
      this.renderFallbackUI(container);
    }
  }

  // Render fallback UI when React fails
  private renderFallbackUI(container: Element): void {
    try {
      container.innerHTML = `
        <div style="
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          font-family: system-ui, -apple-system, sans-serif;
          padding: 1rem;
        ">
          <div style="
            max-width: 400px;
            text-align: center;
            background: white;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          ">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; color: #1f2937;">
              React Render Error
            </h1>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">
              The application encountered a rendering error. Please refresh the page to try again.
            </p>
            <button 
              onclick="window.location.reload()"
              style="
                background-color: #3b82f6;
                color: white;
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 0.375rem;
                font-weight: 500;
                cursor: pointer;
                width: 100%;
              "
            >
              Refresh Page
            </button>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('🚨 Error rendering fallback UI:', error);
      // Last resort - just show a simple message
      container.innerHTML = '<div style="padding: 20px; text-align: center;">Application Error - Please Refresh</div>';
    }
  }

  // Reset error count
  resetErrorCount(): void {
    this.errorCount = 0;
  }

  // Get current error count
  getErrorCount(): number {
    return this.errorCount;
  }
}

// Safe React hooks wrapper
export function useSafeReactState<T>(initialState: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(initialState);
  
  const safeSetState = React.useCallback((value: React.SetStateAction<T>) => {
    try {
      setState(value);
    } catch (error) {
      console.error('🚨 Safe React state error:', error);
    }
  }, []);
  
  return [state, safeSetState];
}

// Safe React effect wrapper
export function useSafeReactEffect(effect: () => void | (() => void), deps?: React.DependencyList): void {
  React.useEffect(() => {
    try {
      return effect();
    } catch (error) {
      console.error('🚨 Safe React effect error:', error);
    }
  }, deps);
}

// Safe React callback wrapper
export function useSafeReactCallback<T extends (...args: any[]) => any>(callback: T, deps?: React.DependencyList): T {
  return React.useCallback((...args: Parameters<T>) => {
    try {
      return callback(...args);
    } catch (error) {
      console.error('🚨 Safe React callback error:', error);
    }
  }, deps) as T;
}

// Safe React memo wrapper
export function safeReactMemo<T extends React.ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
): T {
  const MemoizedComponent = React.memo(Component, propsAreEqual);
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    try {
      return <MemoizedComponent {...props} ref={ref} />;
    } catch (error) {
      console.error('🚨 Safe React memo error:', error);
      return <div>Component Error</div> as any;
    }
  }) as T;
}

// Export singleton instance
export const safeReactRenderer = SafeReactRenderer.getInstance();
