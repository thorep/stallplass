'use client';

import { useEffect, useState } from 'react';

const DENSE_KEY = 'forum_dense_view_v1';

export function useForumView() {
  const [dense, setDense] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DENSE_KEY);
      if (saved === '1') setDense(true);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (dense) localStorage.setItem(DENSE_KEY, '1');
      else localStorage.removeItem(DENSE_KEY);
    } catch {}
  }, [dense]);

  return {
    dense,
    setDense,
  } as const;
}

