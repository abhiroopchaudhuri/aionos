import { useState, useCallback } from 'react';

export function useComingSoon() {
  const [visible, setVisible] = useState(false);
  const [feature, setFeature] = useState('');

  const show = useCallback((featureName: string) => {
    setFeature(featureName);
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  return { visible, feature, show, hide };
}
