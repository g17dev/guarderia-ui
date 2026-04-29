import React from 'react';
import "./InputSearch.css";

// Definimos los tipos de props
interface InputSearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  showClearButton?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
}

export function InputSearch({
  placeholder = 'Buscar por nombre...',
  value = '',
  onChange,
  className = '',
  showClearButton = true,
  disabled = false,
  error = '',
  label = '',
}: InputSearchProps) {
  const handleClear = () => {
    if (onChange && !disabled) {
      onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // Eliminado el useId() - ya no se necesita

  return (
    <div className={`input-search-container ${className}`}>
      {label && (
        <label className="input-search-label">
          {label}
        </label>
      )}
      
      <div className="input-search-wrapper">
        {/* Ícono de búsqueda */}
        <div className="input-search-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="search-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input-search-field ${error ? 'error' : ''}`}
          style={{
            paddingLeft: '35px',  // ← ESPACIO PARA EL ÍCONO
          }}
          aria-label={placeholder}
          aria-invalid={!!error}
        />

        {showClearButton && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="input-search-clear"
            aria-label="Limpiar búsqueda"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="clear-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="input-search-error">
          {error}
        </div>
      )}
    </div>
  );
}