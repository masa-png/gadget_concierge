import { type ContactFormState } from "../actions";

interface FormMessageProps {
  state: ContactFormState;
}

export function FormMessage({ state }: FormMessageProps) {
  if (state.success) {
    return (
      <div className="rounded-md bg-green-50 p-4 border border-green-200">
        <p className="text-sm text-green-800">
          お問い合わせを送信しました。ありがとうございます。
        </p>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="rounded-md bg-red-50 p-4 border border-red-200">
        <p className="text-sm text-red-800">{state.error}</p>
      </div>
    );
  }

  return null;
}