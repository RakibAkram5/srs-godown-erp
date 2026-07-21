import { forwardRef } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface NumberFieldProps {
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  allowDecimal?: boolean;
}

/**
 * A numeric input that:
 *  - selects its content on focus (so the value is replaced as you type)
 *  - strips leading zeros (no more "0121")
 *  - stays fully controlled (uses type="text" + inputMode to avoid the
 *    browser number-input quirks that keep a leading zero)
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ value, onValueChange, className, disabled, placeholder, id, allowDecimal = true }, ref) => {
    return (
      <Input
        ref={ref}
        id={id}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(className)}
        value={value === 0 ? '0' : String(value)}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          let raw = e.target.value.replace(allowDecimal ? /[^\d.]/g : /[^\d]/g, '');
          // keep only the first dot
          if (allowDecimal) {
            const parts = raw.split('.');
            if (parts.length > 2) raw = `${parts[0]}.${parts.slice(1).join('')}`;
          }
          // strip leading zeros (but keep a single leading 0 before a dot)
          raw = raw.replace(/^0+(?=\d)/, '');
          onValueChange(raw === '' || raw === '.' ? 0 : Number(raw));
        }}
      />
    );
  },
);
NumberField.displayName = 'NumberField';
