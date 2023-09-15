import { useEffect, useState } from 'react';

/**
 * Returns window.innerWidth and window.innerHeight.
 * Rerenders the component when the window is resized.
 */
export const useWindowDimensions = (): { width: number; height: number } => {
  const [dimensions, setDimensions] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));

  useEffect(() => {
    const onResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return dimensions;
};
