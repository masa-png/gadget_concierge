import { prisma } from "@/lib/prisma";
import { ErrorCodes } from "@/lib/validations/api";
import { createErrorResponse } from "@/lib/api/middleware";

export async function getUserProfile(userId: string) {
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
  });
  if (!userProfile) {
    throw createErrorResponse(
      "ユーザープロフィールが見つかりません",
      404,
      ErrorCodes.NOT_FOUND
    );
  }
  return userProfile;
}

export async function getSession(sessionId: string, userProfileId: string) {
  const session = await prisma.questionnaireSession.findFirst({
    where: { id: sessionId, userProfileId },
  });
  if (!session) {
    throw createErrorResponse(
      "指定されたセッションが見つかりません",
      404,
      ErrorCodes.NOT_FOUND
    );
  }
  return session;
}

export async function getCategory(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    throw createErrorResponse(
      "指定されたカテゴリが見つかりません",
      404,
      ErrorCodes.NOT_FOUND
    );
  }
  return category;
}

export async function checkRequiredAnswers(
  sessionId: string,
  categoryId: string
) {
  // 必須質問一覧
  const requiredQuestions = await prisma.question.findMany({
    where: { categoryId, is_required: true },
    select: { id: true, text: true },
  });
  // 回答済みID一覧
  const answered = await prisma.answer.findMany({
    where: { questionnaireSessionId: sessionId },
    select: { questionId: true },
  });
  const answeredSet = new Set(answered.map((a) => a.questionId));
  const unanswered = requiredQuestions.filter((q) => !answeredSet.has(q.id));
  return unanswered;
}
