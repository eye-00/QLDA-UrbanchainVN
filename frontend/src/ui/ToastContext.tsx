import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

export type ToastType = 'success' | 'error';

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

export const TOAST_AUTO_DISMISS_MS = 3200;

type ToastContextValue = {
  showToast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeToastId() {
  return `${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export function appendToastItem(items: ToastItem[], item: ToastItem) {
  return [...items, item];
}

export function removeToastItemById(items: ToastItem[], id: string) {
  return items.filter((item) => item.id !== id);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = makeToastId();
    setItems((prev) => appendToastItem(prev, { id, type, message }));
    globalThis.setTimeout(() => {
      setItems((prev) => removeToastItemById(prev, id));
    }, TOAST_AUTO_DISMISS_MS);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {items.map((item) => (
          <div className={`toast toast-${item.type}`} key={item.id}>
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside ToastProvider');
  return value;
}
