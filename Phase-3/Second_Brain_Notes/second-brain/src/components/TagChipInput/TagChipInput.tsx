import { useState, useRef, useEffect } from 'react';
import './TagChipInput.css';

interface TagChipInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}

export default function TagChipInput({ tags, onChange, suggestions }: TagChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = suggestions
    .filter(s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s))
    .slice(0, 10);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
    setIsDropdownOpen(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="tag-chip-input-container" ref={containerRef}>
      <div className="tag-chips-wrapper">
        {tags.map(t => (
          <span key={t} className="tag-chip">
            #{t}
            <button className="tag-chip__remove" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>
              ×
            </button>
          </span>
        ))}
        <input
          className="tag-chip-input__input"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            setIsDropdownOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
        />
      </div>
      {isDropdownOpen && inputValue && filteredSuggestions.length > 0 && (
        <div className="tag-chip-input__suggestions">
          {filteredSuggestions.map(s => (
            <div
              key={s}
              className="tag-chip-input__suggestion-item"
              onClick={() => addTag(s)}
            >
              #{s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
