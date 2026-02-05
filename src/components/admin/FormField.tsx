import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export default function FormField({
  label,
  required,
  hint,
  error,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-xs uppercase tracking-widest text-[#6E6E6E] mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[#6E6E6E] mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

export const fieldInputClass =
  'w-full border border-[#111]/10 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D4A05A] transition-colors';

export const fieldTextareaClass =
  'w-full border border-[#111]/10 px-3 py-2 text-sm bg-white min-h-20 focus:outline-none focus:border-[#D4A05A] transition-colors';

export const fieldSelectClass =
  'w-full border border-[#111]/10 px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D4A05A] transition-colors';
