import { createSignal, createContext, useContext, type JSX } from 'solid-js';

type MiddlewareContextType = {
  currentRoute: () => string;
  navigate: (path: string) => void;
  beforeNavigate: (cb: (from: string, to: string) => boolean | void) => void;
  afterNavigate: (cb: (to: string) => void) => void;
};

const MiddlewareContext = createContext<MiddlewareContextType>();

export const MiddlewareProvider = (props: { children: JSX.Element }) => {
  const [currentRoute, setCurrentRoute] = createSignal(typeof window !== 'undefined' ? window.location.pathname : '');
  const beforeNav = new Set<(from: string, to: string) => boolean | void>();
  const afterNav = new Set<(to: string) => void>();

  const navigate = (path: string) => {
    const from = currentRoute();
    // Run before hooks
    for (const cb of beforeNav) {
        if (cb(from, path) === false) return;
    }
    
    if (typeof window !== 'undefined') {
        window.history.pushState({}, '', path);
    }
    setCurrentRoute(path);
    
    // Run after hooks
    for (const cb of afterNav) {
        cb(path);
    }
  };

  if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        setCurrentRoute(window.location.pathname);
      });
  }

  const value = {
    currentRoute,
    navigate,
    beforeNavigate: (cb: any) => beforeNav.add(cb),
    afterNavigate: (cb: any) => afterNav.add(cb)
  };

  return (
    <MiddlewareContext.Provider value={value}>
      {props.children}
    </MiddlewareContext.Provider>
  );
};

export const useMiddleware = () => {
  const ctx = useContext(MiddlewareContext);
  if (!ctx) throw new Error("useMiddleware must be used within MiddlewareProvider");
  return ctx;
};

export const loggingMiddleware = () => (to: string) => {
  console.log('Navigated to:', to);
};

export const authMiddleware = () => (from: string, to: string) => {
  if (typeof document === 'undefined') return;
  const hasToken = document.cookie.includes('cognito-auth-token') || document.cookie.includes('firebase-auth-token');
  console.log('Auth check for navigation:', to, hasToken ? 'Authenticated' : 'Unauthenticated');
};
