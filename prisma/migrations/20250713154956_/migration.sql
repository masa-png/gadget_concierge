-- AddForeignKey
ALTER TABLE "questionnaire_sessions" ADD CONSTRAINT "questionnaire_sessions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
