import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी', flag: '🇮🇳' }
  ];

  const currentLang = languages.find(l => l.code === (i18n.language || 'en')) || languages[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative inline-block text-left z-50" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="language-switcher-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md"
        style={{
          background: isOpen ? 'var(--color-surface-warm)' : 'var(--color-surface-muted)',
          border: isOpen ? '1px solid var(--color-rose)' : '1px solid var(--color-border-light)',
          color: 'var(--color-navy)'
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--color-accent-light)' }}>
          <Globe className="w-3.5 h-3.5" style={{ color: 'var(--color-rose)' }} />
        </div>
        <span className="font-bold">{currentLang.native}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-600' : 'text-slate-400'}`}
        />
      </button>

      {/* Animated Custom Popover Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-2xl p-1.5 shadow-2xl animate-modal-in z-50 overflow-hidden"
          style={{
            background: 'rgba(253, 245, 244, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--color-border-light)',
            boxShadow: '0 12px 36px rgba(29, 26, 57, 0.18), 0 0 16px rgba(174, 68, 90, 0.1)'
          }}
        >
          <div className="px-2 py-1.5 mb-1 text-[10px] uppercase font-mono font-bold tracking-wider opacity-60" style={{ color: 'var(--color-navy)' }}>
            Select Language
          </div>
          <div className="space-y-1">
            {languages.map((lang) => {
              const isSelected = lang.code === currentLang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 text-left cursor-pointer ${
                    isSelected ? 'shadow-xs' : ''
                  }`}
                  style={
                    isSelected
                      ? {
                          background: 'linear-gradient(135deg, var(--color-navy), var(--color-deep-purple))',
                          color: 'var(--color-blush-light)'
                        }
                      : {
                          color: 'var(--color-navy)',
                          background: 'transparent'
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--color-surface-warm)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{lang.flag}</span>
                    <span className="font-sans">{lang.native}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blush-light animate-fade-in" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
