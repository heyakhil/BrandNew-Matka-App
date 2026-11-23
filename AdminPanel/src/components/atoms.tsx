import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export function Button({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>): ReactNode {
  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}

export function Input({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }): ReactNode {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}
