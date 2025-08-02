import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function FormField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  required,
  error,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && "*"}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className={error ? "border-red-500" : ""}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}