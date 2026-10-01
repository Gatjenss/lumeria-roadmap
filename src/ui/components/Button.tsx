import type { ButtonHTMLAttributes } from 'react';

const styles = {
  primary: 'bg-sky-600 text-white active:bg-sky-700',
  neutral: 'bg-slate-200 text-slate-900 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100',
  danger: 'bg-rose-600 text-white active:bg-rose-700',
  ok: 'bg-emerald-600 text-white active:bg-emerald-700',
  warn: 'bg-amber-500 text-white active:bg-amber-600',
} as const;

export function Button({ tone = 'primary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof styles }) {
  return <button className={`min-h-14 rounded-2xl px-4 text-lg font-semibold transition disabled:opacity-40 ${styles[tone]} ${className}`} {...rest} />;
}
