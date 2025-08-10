import React, { Component, ReactNode, ComponentType } from 'react';

interface SafeComponentProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface SafeComponentState {
  hasError: boolean;
  error: Error | null;
}

// Safe component wrapper that prevents any React errors
class SafeComponent extends Component<SafeComponentProps, SafeComponentState> {
  constructor(props: SafeComponentProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): SafeComponentState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 SafeComponent caught error:', error);
    console.error('🔍 Component:', this.props.componentName || 'Unknown');
    console.error('📍 Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p className="text-sm text-muted-foreground">
            Component failed to load
          </p>
        </div>
      );
    }

    try {
      return this.props.children;
    } catch (error) {
      console.error('🚨 Error in SafeComponent render:', error);
      return (
        <div className="p-4 text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <p className="text-sm text-muted-foreground">
            Component render failed
          </p>
        </div>
      );
    }
  }
}

// Higher-order component to wrap any component with safety
export function withSafety<P extends object>(
  WrappedComponent: ComponentType<P>,
  componentName?: string
) {
  return React.forwardRef<any, P>((props, ref) => {
    return (
      <SafeComponent componentName={componentName || WrappedComponent.name}>
        <WrappedComponent {...(props as P)} ref={ref} />
      </SafeComponent>
    );
  });
}

// Safe render function that catches any render errors
export function safeRender(renderFunction: () => ReactNode, fallback?: ReactNode): ReactNode {
  try {
    return renderFunction();
  } catch (error) {
    console.error('🚨 Safe render caught error:', error);
    if (fallback) {
      return fallback;
    }
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 text-2xl mb-2">⚠️</div>
        <p className="text-sm text-muted-foreground">
          Render failed
        </p>
      </div>
    );
  }
}

// Safe hook wrapper
export function useSafeEffect(effect: () => void | (() => void), deps?: React.DependencyList) {
  React.useEffect(() => {
    try {
      return effect();
    } catch (error) {
      console.error('🚨 Safe effect caught error:', error);
    }
  }, deps);
}

// Safe state wrapper
export function useSafeState<T>(initialState: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(initialState);
  
  const safeSetState = React.useCallback((value: React.SetStateAction<T>) => {
    try {
      setState(value);
    } catch (error) {
      console.error('🚨 Safe setState caught error:', error);
    }
  }, []);
  
  return [state, safeSetState];
}

export default SafeComponent;
