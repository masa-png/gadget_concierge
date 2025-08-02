import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, "お名前を入力してください")
    .max(50, "お名前は50文字以内で入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
  subject: z
    .string()
    .min(1, "件名を入力してください")
    .max(100, "件名は100文字以内で入力してください"),
  message: z
    .string()
    .min(1, "メッセージを入力してください")
    .max(1000, "メッセージは1000文字以内で入力してください"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;