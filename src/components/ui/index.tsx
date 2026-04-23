import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, ChevronDown, Plus, Trash2, KeyRound } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div className={cn("premium-card p-4 sm:p-6", className)} onClick={onClick}>
    {children}
  </div>
);

export const Badge = ({ variant = 'default', children, className }: { variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'; children: React.ReactNode, className?: string }) => {
  const variants = {
    default: "bg-muted text-muted-foreground",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    info: "bg-blue-500/10 text-blue-600 border-blue-500/20"
  };
  
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-flex items-center", variants[variant], className)}>
      {children}
    </span>
  );
};

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'ghost' | 'danger' }>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
      outline: "border bg-transparent hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 px-4 py-2 gap-2",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative w-full">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn(
          'w-full bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 pr-10',
          className
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md"
        aria-label={visible ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

/** UI row with stable React key for custom credential key/value editors */
export type CustomCredentialFieldRow = { id: string; key: string; value: string };

let __customFieldSeq = 0;
export const newCustomFieldRow = (): CustomCredentialFieldRow => ({
  id: `cf-${Date.now()}-${++__customFieldSeq}`,
  key: '',
  value: ''
});

export function storedToCustomFieldRows(stored?: { key: string; value: string }[]): CustomCredentialFieldRow[] {
  return (stored ?? []).map((f, i) => ({
    id: `cf-init-${i}-${f.key}`,
    key: f.key,
    value: f.value
  }));
}

export function customFieldRowsToStored(rows: CustomCredentialFieldRow[]): { key: string; value: string }[] {
  return rows
    .filter((r) => r.key.trim() || r.value.trim())
    .map((r) => ({ key: r.key.trim(), value: r.value.trim() }));
}

export const CustomCredentialFieldsEditor = ({
  fields,
  onChange,
  addButtonLabel = 'Add field'
}: {
  fields: CustomCredentialFieldRow[];
  onChange: (next: CustomCredentialFieldRow[]) => void;
  addButtonLabel?: string;
}) => {
  const add = () => onChange([...fields, newCustomFieldRow()]);
  const remove = (id: string) => onChange(fields.filter((f) => f.id !== id));
  const patch = (id: string, updates: Partial<Pick<CustomCredentialFieldRow, 'key' | 'value'>>) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));

  return (
    <div className="space-y-2">
      {fields.map((row) => (
        <div key={row.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex gap-2 w-full">
            <input
              value={row.key}
              onChange={(e) => patch(row.id, { key: e.target.value })}
              placeholder="Field name"
              className="flex-1 min-w-0 bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
            <button
              type="button"
              onClick={() => remove(row.id)}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors sm:hidden"
              aria-label="Remove field"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <input
            value={row.value}
            onChange={(e) => patch(row.id, { value: e.target.value })}
            placeholder="Value"
            className="w-full sm:flex-1 min-w-0 bg-accent p-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 text-sm font-mono"
          />
          <button
            type="button"
            onClick={() => remove(row.id)}
            className="hidden sm:block p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors"
            aria-label="Remove field"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full border-dashed gap-2" onClick={add}>
        <Plus className="w-4 h-4" />
        {addButtonLabel}
      </Button>
    </div>
  );
};

export const CredentialField = ({
  label,
  value,
  isMasked = true,
  onReveal,
}: {
  label: string;
  value: string;
  type?: string;
  isMasked?: boolean;
  onReveal?: () => Promise<void>;
}) => {
  const [visible, setVisible] = useState(!isMasked);
  const [revealing, setRevealing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isStillMasked = value === '********';
  const shouldUseRevealFirst = isMasked && isStillMasked && !!onReveal;

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEye = async () => {
    if (shouldUseRevealFirst && onReveal) {
      setRevealing(true);
      try {
        await onReveal();
        // Once reveal succeeds, switch to normal eye toggle and show plain value.
        setVisible(true);
      } finally {
        setRevealing(false);
      }
    } else {
      setVisible(!visible);
    }
  };

  return (
    <div className="space-y-1.5 group">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2 bg-accent/50 p-2.5 rounded-xl border border-transparent group-hover:border-border transition-all">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          readOnly
          className="bg-transparent border-none focus:ring-0 text-sm font-mono flex-1 p-0"
        />
        <div className="flex items-center gap-1">
          {isMasked && (
            <button
              onClick={() => { void handleEye(); }}
              disabled={revealing}
              className="p-1 hover:bg-white/10 rounded-md text-muted-foreground transition-colors disabled:opacity-50"
            >
              {revealing ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
              ) : shouldUseRevealFirst ? (
                <KeyRound className="w-4 h-4" />
              ) : visible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
          <button onClick={copy} className="p-1 hover:bg-white/10 rounded-md text-muted-foreground transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CustomSelect = <T extends string | number>({ 
  value, 
  onChange, 
  options, 
  placeholder = "Select option...",
  className 
}: { 
  value: T; 
  onChange: (value: T) => void; 
  options: { value: T; label: string }[];
  placeholder?: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-accent/50 hover:bg-accent border rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-primary/20 outline-none"
      >
        <span className={cn(!selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={cn("transition-transform duration-200", isOpen && "rotate-180")}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>

      {/* Backdrop for closing */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
      
      <div
        className={cn(
          "absolute left-0 right-0 z-50 overflow-hidden bg-card border rounded-2xl shadow-xl max-h-64 overflow-y-auto premium-card custom-scrollbar dropdown-content",
          isOpen && "dropdown-content-open"
        )}
      >
        <div className="p-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-xl transition-colors",
                value === option.value 
                  ? "bg-primary text-primary-foreground font-bold" 
                  : "hover:bg-accent text-foreground"
              )}
            >
              <span>{option.label}</span>
              {value === option.value && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'md' | 'lg' | 'xl' }) => {
  if (!isOpen) return null;

  const sizeClass = size === 'xl' ? 'max-w-3xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className={cn("bg-card text-card-foreground p-6 sm:p-8 rounded-3xl border shadow-2xl w-full relative z-50 premium-card h-auto overflow-visible animate-in fade-in zoom-in-95 duration-200", sizeClass)}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-xl transition-colors">
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-visible min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};

