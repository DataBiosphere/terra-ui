import { useEffect, useState } from 'react';

/**
 * Returns the dimensions of the window.
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
