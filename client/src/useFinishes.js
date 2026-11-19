import { useEffect, useState } from 'react';
import { api } from './api.js';

/** Loads the finishes catalog once per page. */
export function useFinishes() {
  const [state, setState] = useState({ finishes: [], loading: true, error: null });

  useEffect(() => {
    let alive = true;
    api
      .finishes()
      .then((finishes) => alive && setState({ finishes, loading: false, error: null }))
      .catch((error) => alive && setState({ finishes: [], loading: false, error }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
