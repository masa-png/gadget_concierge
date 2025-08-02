"use server";

import { PrismaClient } from "@prisma/client";
import { contactFormSchema } from "@/lib/validations/contact";

const prisma = new PrismaClient();

export type ContactFormState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string[];
    email?: string[];
    subject?: string[];
    message?: string[];
  };
};

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  try {
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    const validationResult = contactFormSchema.safeParse(data);

    if (!validationResult.success) {
      return {
        success: false,
        fieldErrors: validationResult.error.flatten().fieldErrors,
      };
    }

    // データベースにお問い合わせを保存
    await prisma.contactInquiry.create({
      data: {
        name: validationResult.data.name,
        email: validationResult.data.email,
        subject: validationResult.data.subject,
        message: validationResult.data.message,
        status: "UNREAD",
        priority: "NORMAL",
      },
    });

    console.log("Contact inquiry saved to database:", validationResult.data);

    return {
      success: true,
    };
  } catch (error) {
    console.error("Contact form submission error:", error);
    return {
      success: false,
      error: "送信中にエラーが発生しました。しばらくしてから再度お試しください。",
    };
  } finally {
    await prisma.$disconnect();
  }
}