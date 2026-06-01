export const setPreviousRoute = (path: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('previousRoute', path);
    }
  };
  export const getPreviousRoute = (): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('previousRoute');
    }
    return null;
  };