"use client";

import { useFormState } from "react-dom";
import { useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { submitContactForm, type ContactFormState } from "../actions";
import { FormField } from "./FormField";
import { FormTextarea } from "./FormTextarea";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

const initialState: ContactFormState = {};

export function ContactForm() {
  const [state, formAction] = useFormState(submitContactForm, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle>お問い合わせフォーム</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-6">
          <FormMessage state={state} />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              id="name"
              name="name"
              label="お名前"
              placeholder="山田太郎"
              required
              error={state.fieldErrors?.name?.[0]}
            />
            <FormField
              id="email"
              name="email"
              type="email"
              label="メールアドレス"
              placeholder="your@email.com"
              required
              error={state.fieldErrors?.email?.[0]}
            />
          </div>

          <FormField
            id="subject"
            name="subject"
            label="件名"
            placeholder="お問い合わせの件名"
            required
            error={state.fieldErrors?.subject?.[0]}
          />

          <FormTextarea
            id="message"
            name="message"
            label="メッセージ"
            placeholder="お問い合わせ内容をご記入ください"
            rows={6}
            required
            error={state.fieldErrors?.message?.[0]}
          />

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
