-- Supabase RLS policies reconfiguration
-- This script enables RLS and creates safe default policies
-- Run with: npx prisma db execute --file prisma/rls_policies.sql

-- ========== Helper notes ==========
-- auth.uid() returns the UUID of the authenticated user

-- ========== user_profiles ==========
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_own" ON "user_profiles";
CREATE POLICY "user_profiles_select_own" ON "user_profiles"
  FOR SELECT USING ("userId" = auth.uid());

DROP POLICY IF EXISTS "user_profiles_insert_self" ON "user_profiles";
CREATE POLICY "user_profiles_insert_self" ON "user_profiles"
  FOR INSERT WITH CHECK ("userId" = auth.uid());

DROP POLICY IF EXISTS "user_profiles_update_own" ON "user_profiles";
CREATE POLICY "user_profiles_update_own" ON "user_profiles"
  FOR UPDATE USING ("userId" = auth.uid()) WITH CHECK ("userId" = auth.uid());

DROP POLICY IF EXISTS "user_profiles_delete_own" ON "user_profiles";
CREATE POLICY "user_profiles_delete_own" ON "user_profiles"
  FOR DELETE USING ("userId" = auth.uid());

-- ========== questionnaire_sessions ==========
ALTER TABLE "questionnaire_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questionnaire_sessions" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "questionnaire_sessions_access_own" ON "questionnaire_sessions";
CREATE POLICY "questionnaire_sessions_access_own" ON "questionnaire_sessions"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "user_profiles" up
      WHERE up."id" = "questionnaire_sessions"."userProfileId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "questionnaire_sessions_insert_own" ON "questionnaire_sessions";
CREATE POLICY "questionnaire_sessions_insert_own" ON "questionnaire_sessions"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "user_profiles" up
      WHERE up."id" = "userProfileId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "questionnaire_sessions_update_own" ON "questionnaire_sessions";
CREATE POLICY "questionnaire_sessions_update_own" ON "questionnaire_sessions"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "user_profiles" up
      WHERE up."id" = "questionnaire_sessions"."userProfileId"
        AND up."userId" = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM "user_profiles" up
      WHERE up."id" = "questionnaire_sessions"."userProfileId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "questionnaire_sessions_delete_own" ON "questionnaire_sessions";
CREATE POLICY "questionnaire_sessions_delete_own" ON "questionnaire_sessions"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "user_profiles" up
      WHERE up."id" = "questionnaire_sessions"."userProfileId"
        AND up."userId" = auth.uid()
    )
  );

-- ========== answers ==========
ALTER TABLE "answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "answers" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "answers_access_own" ON "answers";
CREATE POLICY "answers_access_own" ON "answers"
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM "questionnaire_sessions" qs
      JOIN "user_profiles" up ON up."id" = qs."userProfileId"
      WHERE qs."id" = "answers"."questionnaireSessionId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "answers_insert_own" ON "answers";
CREATE POLICY "answers_insert_own" ON "answers"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "questionnaire_sessions" qs
      JOIN "user_profiles" up ON up."id" = qs."userProfileId"
      WHERE qs."id" = "questionnaireSessionId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "answers_update_own" ON "answers";
CREATE POLICY "answers_update_own" ON "answers"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM "questionnaire_sessions" qs
      JOIN "user_profiles" up ON up."id" = qs."userProfileId"
      WHERE qs."id" = "answers"."questionnaireSessionId"
        AND up."userId" = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "questionnaire_sessions" qs
      JOIN "user_profiles" up ON up."id" = qs."userProfileId"
      WHERE qs."id" = "answers"."questionnaireSessionId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "answers_delete_own" ON "answers";
CREATE POLICY "answers_delete_own" ON "answers"
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM "questionnaire_sessions" qs
      JOIN "user_profiles" up ON up."id" = qs."userProfileId"
      WHERE qs."id" = "answers"."questionnaireSessionId"
        AND up."userId" = auth.uid()
    )
  );

-- ========== recommendations ==========
ALTER TABLE "recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recommendations" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recommendations_access_own" ON "recommendations";
CREATE POLICY "recommendations_access_own" ON "recommendations"
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM "questionnaire_sessions" qs
      JOIN "user_profiles" up ON up."id" = qs."userProfileId"
      WHERE qs."id" = "recommendations"."questionnaireSessionId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "recommendations_insert_own" ON "recommendations";
CREATE POLICY "recommendations_insert_own" ON "recommendations"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "questionnaire_sessions" qs
      JOIN "user_profiles" up ON up."id" = qs."userProfileId"
      WHERE qs."id" = "questionnaireSessionId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "recommendations_update_own" ON "recommendations";
CREATE POLICY "recommendations_update_own" ON "recommendations"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM "questionnaire_sessions" qs
      JOIN "user_profiles" up ON up."id" = qs."userProfileId"
      WHERE qs."id" = "recommendations"."questionnaireSessionId"
        AND up."userId" = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "questionnaire_sessions" qs
      JOIN "user_profiles" up ON up."id" = qs."userProfileId"
      WHERE qs."id" = "recommendations"."questionnaireSessionId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "recommendations_delete_own" ON "recommendations";
CREATE POLICY "recommendations_delete_own" ON "recommendations"
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM "questionnaire_sessions" qs
      JOIN "user_profiles" up ON up."id" = qs."userProfileId"
      WHERE qs."id" = "recommendations"."questionnaireSessionId"
        AND up."userId" = auth.uid()
    )
  );

-- ========== user_histories ==========
ALTER TABLE "user_histories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_histories" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_histories_access_own" ON "user_histories";
CREATE POLICY "user_histories_access_own" ON "user_histories"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "user_profiles" up
      WHERE up."id" = "user_histories"."userProfileId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_histories_insert_own" ON "user_histories";
CREATE POLICY "user_histories_insert_own" ON "user_histories"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "user_profiles" up
      WHERE up."id" = "userProfileId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_histories_update_own" ON "user_histories";
CREATE POLICY "user_histories_update_own" ON "user_histories"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "user_profiles" up
      WHERE up."id" = "user_histories"."userProfileId"
        AND up."userId" = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM "user_profiles" up
      WHERE up."id" = "user_histories"."userProfileId"
        AND up."userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "user_histories_delete_own" ON "user_histories";
CREATE POLICY "user_histories_delete_own" ON "user_histories"
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM "user_profiles" up
      WHERE up."id" = "user_histories"."userProfileId"
        AND up."userId" = auth.uid()
    )
  );

-- ========== Public read-only (enable RLS and allow SELECT) ==========
DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories';
  IF FOUND THEN
    ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "categories_read_all" ON "categories";
    CREATE POLICY "categories_read_all" ON "categories" FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'category_key_points';
  IF FOUND THEN
    ALTER TABLE "category_key_points" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "category_key_points_read_all" ON "category_key_points";
    CREATE POLICY "category_key_points_read_all" ON "category_key_points" FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'category_common_questions';
  IF FOUND THEN
    ALTER TABLE "category_common_questions" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "category_common_questions_read_all" ON "category_common_questions";
    CREATE POLICY "category_common_questions_read_all" ON "category_common_questions" FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products';
  IF FOUND THEN
    ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "products_read_all" ON "products";
    CREATE POLICY "products_read_all" ON "products" FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tags';
  IF FOUND THEN
    ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "tags_read_all" ON "tags";
    CREATE POLICY "tags_read_all" ON "tags" FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_categories';
  IF FOUND THEN
    ALTER TABLE "product_categories" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "product_categories_read_all" ON "product_categories";
    CREATE POLICY "product_categories_read_all" ON "product_categories" FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_tags';
  IF FOUND THEN
    ALTER TABLE "product_tags" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "product_tags_read_all" ON "product_tags";
    CREATE POLICY "product_tags_read_all" ON "product_tags" FOR SELECT USING (true);
  END IF;
END $$;

-- ========== contact_inquiries ==========
-- Allow inserts from anyone (anon/auth) to submit contact form; no reads/updates
DO $$ BEGIN
  PERFORM 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_inquiries';
  IF FOUND THEN
    ALTER TABLE "contact_inquiries" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE "contact_inquiries" FORCE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "contact_inquiries_insert_any" ON "contact_inquiries";
    CREATE POLICY "contact_inquiries_insert_any" ON "contact_inquiries"
      FOR INSERT WITH CHECK (true);

    -- Intentionally no SELECT/UPDATE/DELETE policies (service_role bypasses RLS)
  END IF;
END $$;


