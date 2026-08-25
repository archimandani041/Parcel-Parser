import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateText } from '../utils/translator';

/**
 * Custom React Hook for Dynamic Auto-Translation
 * Dynamically translates dynamic backend text into current active UI language on the fly.
 */
export function useAutoTranslate(text) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    let isMounted = true;
    
    if (!text || currentLang === 'en') {
      setTranslatedText(text);
      return;
    }

    translateText(text, currentLang)
      .then(res => {
        if (isMounted) {
          setTranslatedText(res);
        }
      })
      .catch(() => {
        if (isMounted) setTranslatedText(text);
      });

    return () => {
      isMounted = false;
    };
  }, [text, currentLang]);

  return translatedText;
}

/**
 * AutoTranslate Component
 * Wraps dynamic strings (product names, status notes, dynamic arriving data) 
 * and automatically renders translated text based on active locale without manual key dictionary edits.
 */
export default function AutoTranslate({ text, fallback = '' }) {
  const translated = useAutoTranslate(text);
  return <>{translated || fallback || text}</>;
}
