import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  loading = false,
  fullWidth = true,
  disabled,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <button
      type={type}
      className={`app-button ${variant} ${size}${fullWidth ? ' full-width' : ''}${className ? ` ${className}` : ''}`}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? <span className="button-spinner" aria-label="Loading" /> : <>
        {leadingIcon}<span>{label}</span>{trailingIcon}
      </>}
    </button>
  );
}
