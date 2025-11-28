// This file provides a custom router setup that handles GitHub Pages routing
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useGitHubPagesRouting() {
  const location = useLocation();

  useEffect(() => {
    // GitHub Pages routing fix
    const path = location.pathname;
    if (path.includes('?/')) {
      const newPath = path.split('?/')[1].replace(/~and~/g, '&');
      window.history.replaceState(null, '', newPath);
    }
  }, [location]);
}

