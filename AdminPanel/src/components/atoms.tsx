import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
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

export function Textarea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }): ReactNode {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea {...props} />
    </label>
  );
}

const HOURS_12 = Array.from({ length: 12 }, (_, idx) =>
  String(idx + 1).padStart(2, "0")
);
const MINUTES_60 = Array.from({ length: 60 }, (_, idx) =>
  String(idx).padStart(2, "0")
);

function splitTime24(value: string): { hour12: string; minute: string; period: "AM" | "PM" } {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return { hour12: "10", minute: "00", period: "AM" };
  const hours24 = Number(match[1]);
  const period: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";
  const hour12 = String(hours24 % 12 || 12).padStart(2, "0");
  return { hour12, minute: match[2], period };
}

function toTime24(hour12: string, minute: string, period: "AM" | "PM"): string {
  const raw = Number(hour12) % 12;
  const hours24 = period === "PM" ? raw + 12 : raw;
  return `${String(hours24).padStart(2, "0")}:${minute}`;
}

export function AmPmTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next24: string) => void;
}): ReactNode {
  const { hour12, minute, period } = splitTime24(value);
  return (
    <div className="field">
      <span>{label}</span>
      <div className="timePickerRow">
        <select
          aria-label={`${label} hour`}
          value={hour12}
          onChange={(event) => onChange(toTime24(event.target.value, minute, period))}
        >
          {HOURS_12.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <select
          aria-label={`${label} minute`}
          value={minute}
          onChange={(event) => onChange(toTime24(hour12, event.target.value, period))}
        >
          {MINUTES_60.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          aria-label={`${label} AM or PM`}
          value={period}
          onChange={(event) =>
            onChange(toTime24(hour12, minute, event.target.value as "AM" | "PM"))
          }
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
