import { useState, useCallback } from 'react';

/**
 * Custom Hooks للأداء والتحسينات
 */

// Hook للـ Debounce (تأخير التنفيذ حتى يتوقف المستخدم عن الكتابة)
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// Hook للـ Local Storage مع Type Safety
export function useLocalStorage<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return initialValue;
        }
    });

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (error) {
                console.error('Error writing to localStorage:', error);
            }
        },
        [key, storedValue]
    );

    return [storedValue, setValue];
}

// Hook للتحكم في الـ Scroll
export function useScrollLock() {
    const lockScroll = useCallback(() => {
        document.body.style.overflow = 'hidden';
    }, []);

    const unlockScroll = useCallback(() => {
        document.body.style.overflow = '';
    }, []);

    return { lockScroll, unlockScroll };
}

// Hook للكشف عن حجم الشاشة
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
}

// Hook للكشف عن الاتصال بالإنترنت
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}

// Hook للنسخ إلى الحافظة
export function useCopyToClipboard(): [
    (text: string) => Promise<boolean>,
    boolean
] {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            setCopied(false);
            return false;
        }
    }, []);

    return [copy, copied];
}

// Hook للكشف عن الـ Intersection (ظهور العنصر في viewport)
export function useIntersectionObserver(
    elementRef: React.RefObject<Element>,
    options?: IntersectionObserverInit
): boolean {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        if (!elementRef.current) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        observer.observe(elementRef.current);

        return () => observer.disconnect();
    }, [elementRef, options]);

    return isIntersecting;
}
