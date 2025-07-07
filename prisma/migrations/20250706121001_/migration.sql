/*
  Warnings:

  - You are about to alter the column `name` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - A unique constraint covering the columns `[questionnaireSessionId,rank]` on the table `recommendations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "answers_questionnaireSessionId_idx" ON "answers"("questionnaireSessionId");

-- CreateIndex
CREATE INDEX "answers_questionId_idx" ON "answers"("questionId");

-- CreateIndex
CREATE INDEX "answers_created_at_idx" ON "answers"("created_at");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CreateIndex
CREATE INDEX "categories_name_idx" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_created_at_idx" ON "categories"("created_at");

-- CreateIndex
CREATE INDEX "questionnaire_sessions_userProfileId_status_idx" ON "questionnaire_sessions"("userProfileId", "status");

-- CreateIndex
CREATE INDEX "questionnaire_sessions_categoryId_idx" ON "questionnaire_sessions"("categoryId");

-- CreateIndex
CREATE INDEX "questionnaire_sessions_status_idx" ON "questionnaire_sessions"("status");

-- CreateIndex
CREATE INDEX "questionnaire_sessions_created_at_idx" ON "questionnaire_sessions"("created_at");

-- CreateIndex
CREATE INDEX "questionnaire_sessions_completed_at_idx" ON "questionnaire_sessions"("completed_at");

-- CreateIndex
CREATE INDEX "recommendations_questionnaireSessionId_rank_idx" ON "recommendations"("questionnaireSessionId", "rank");

-- CreateIndex
CREATE INDEX "recommendations_productId_idx" ON "recommendations"("productId");

-- CreateIndex
CREATE INDEX "recommendations_score_idx" ON "recommendations"("score");

-- CreateIndex
CREATE UNIQUE INDEX "recommendations_questionnaireSessionId_rank_key" ON "recommendations"("questionnaireSessionId", "rank");

-- CreateIndex
CREATE INDEX "user_profiles_userId_idx" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_profiles_created_at_idx" ON "user_profiles"("created_at");

-- CreateIndex
CREATE INDEX "user_profiles_username_idx" ON "user_profiles"("username");
