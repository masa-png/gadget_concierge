import { Textarea } from "@/app/_components/ui/textarea";
import { Label } from "@/app/_components/ui/label";

interface FormTextareaProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  error?: string;
}

export function FormTextarea({
  id,
  name,
  label,
  placeholder,
  rows = 4,
  required,
  error,
}: FormTextareaProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && "*"}
      </Label>
      <Textarea
        id={id}
        name={name}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}