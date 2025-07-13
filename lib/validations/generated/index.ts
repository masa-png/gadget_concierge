import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;

// DECIMAL
//------------------------------------------------------

export const DecimalJsLikeSchema: z.ZodType<Prisma.DecimalJsLike> = z.object({
  d: z.array(z.number()),
  e: z.number(),
  s: z.number(),
  toFixed: z.function(z.tuple([]), z.string()),
})

export const DECIMAL_STRING_REGEX = /^(?:-?Infinity|NaN|-?(?:0[bB][01]+(?:\.[01]+)?(?:[pP][-+]?\d+)?|0[oO][0-7]+(?:\.[0-7]+)?(?:[pP][-+]?\d+)?|0[xX][\da-fA-F]+(?:\.[\da-fA-F]+)?(?:[pP][-+]?\d+)?|(?:\d+|\d*\.\d+)(?:[eE][-+]?\d+)?))$/;

export const isValidDecimalInput =
  (v?: null | string | number | Prisma.DecimalJsLike): v is string | number | Prisma.DecimalJsLike => {
    if (v === undefined || v === null) return false;
    return (
      (typeof v === 'object' && 'd' in v && 'e' in v && 's' in v && 'toFixed' in v) ||
      (typeof v === 'string' && DECIMAL_STRING_REGEX.test(v)) ||
      typeof v === 'number'
    )
  };

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserProfileScalarFieldEnumSchema = z.enum(['id','userId','username','full_name','avatar_url','questionCount','recommendationCount','created_at','updated_at']);

export const CategoryScalarFieldEnumSchema = z.enum(['id','name','description','parentId','created_at','updated_at']);

export const CategoryKeyPointScalarFieldEnumSchema = z.enum(['id','categoryId','point','created_at','updated_at']);

export const CategoryCommonQuestionScalarFieldEnumSchema = z.enum(['id','categoryId','question','answer','created_at','updated_at']);

export const ProductScalarFieldEnumSchema = z.enum(['id','name','description','price','rating','features','rakuten_url','image_url','created_at','updated_at']);

export const ProductCategoryScalarFieldEnumSchema = z.enum(['id','productId','categoryId','created_at','updated_at']);

export const TagScalarFieldEnumSchema = z.enum(['id','name','description','color','created_at','updated_at']);

export const ProductTagScalarFieldEnumSchema = z.enum(['id','productId','tagId','created_at','updated_at']);

export const QuestionScalarFieldEnumSchema = z.enum(['id','categoryId','text','description','type','is_required','created_at','updated_at']);

export const QuestionOptionScalarFieldEnumSchema = z.enum(['id','questionId','label','description','icon_url','value','created_at','updated_at']);

export const QuestionnaireSessionScalarFieldEnumSchema = z.enum(['id','userProfileId','categoryId','status','started_at','completed_at','created_at','updated_at']);

export const AnswerScalarFieldEnumSchema = z.enum(['id','questionnaireSessionId','questionId','questionOptionId','range_value','text_value','created_at','updated_at']);

export const RecommendationScalarFieldEnumSchema = z.enum(['id','questionnaireSessionId','productId','rank','score','reason','created_at','updated_at']);

export const UserHistoryScalarFieldEnumSchema = z.enum(['id','userProfileId','type','title','description','status','created_at','updated_at','sessionId','categoryId','score','completion_rate','details_json']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const QuestionTypeSchema = z.enum(['SINGLE_CHOICE','MULTIPLE_CHOICE','RANGE','TEXT']);

export type QuestionTypeType = `${z.infer<typeof QuestionTypeSchema>}`

export const SessionStatusSchema = z.enum(['IN_PROGRESS','COMPLETED','ABANDONED']);

export type SessionStatusType = `${z.infer<typeof SessionStatusSchema>}`

export const HistoryTypeSchema = z.enum(['QUESTIONNAIRE','RECOMMENDATION']);

export type HistoryTypeType = `${z.infer<typeof HistoryTypeSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER PROFILE SCHEMA
/////////////////////////////////////////

export const UserProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  username: z.string().nullable(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  questionCount: z.number().int(),
  recommendationCount: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

/////////////////////////////////////////
// USER PROFILE PARTIAL SCHEMA
/////////////////////////////////////////

export const UserProfilePartialSchema = UserProfileSchema.partial()

export type UserProfilePartial = z.infer<typeof UserProfilePartialSchema>

// USER PROFILE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const UserProfileOptionalDefaultsSchema = UserProfileSchema.merge(z.object({
  id: z.string().cuid().optional(),
  questionCount: z.number().int().optional(),
  recommendationCount: z.number().int().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type UserProfileOptionalDefaults = z.infer<typeof UserProfileOptionalDefaultsSchema>

// USER PROFILE RELATION SCHEMA
//------------------------------------------------------

export type UserProfileRelations = {
  questionnaireSessions: QuestionnaireSessionWithRelations[];
  userHistories: UserHistoryWithRelations[];
};

export type UserProfileWithRelations = z.infer<typeof UserProfileSchema> & UserProfileRelations

export const UserProfileWithRelationsSchema: z.ZodType<UserProfileWithRelations> = UserProfileSchema.merge(z.object({
  questionnaireSessions: z.lazy(() => QuestionnaireSessionWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryWithRelationsSchema).array(),
}))

// USER PROFILE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type UserProfileOptionalDefaultsRelations = {
  questionnaireSessions: QuestionnaireSessionOptionalDefaultsWithRelations[];
  userHistories: UserHistoryOptionalDefaultsWithRelations[];
};

export type UserProfileOptionalDefaultsWithRelations = z.infer<typeof UserProfileOptionalDefaultsSchema> & UserProfileOptionalDefaultsRelations

export const UserProfileOptionalDefaultsWithRelationsSchema: z.ZodType<UserProfileOptionalDefaultsWithRelations> = UserProfileOptionalDefaultsSchema.merge(z.object({
  questionnaireSessions: z.lazy(() => QuestionnaireSessionOptionalDefaultsWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryOptionalDefaultsWithRelationsSchema).array(),
}))

// USER PROFILE PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type UserProfilePartialRelations = {
  questionnaireSessions?: QuestionnaireSessionPartialWithRelations[];
  userHistories?: UserHistoryPartialWithRelations[];
};

export type UserProfilePartialWithRelations = z.infer<typeof UserProfilePartialSchema> & UserProfilePartialRelations

export const UserProfilePartialWithRelationsSchema: z.ZodType<UserProfilePartialWithRelations> = UserProfilePartialSchema.merge(z.object({
  questionnaireSessions: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryPartialWithRelationsSchema).array(),
})).partial()

export type UserProfileOptionalDefaultsWithPartialRelations = z.infer<typeof UserProfileOptionalDefaultsSchema> & UserProfilePartialRelations

export const UserProfileOptionalDefaultsWithPartialRelationsSchema: z.ZodType<UserProfileOptionalDefaultsWithPartialRelations> = UserProfileOptionalDefaultsSchema.merge(z.object({
  questionnaireSessions: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryPartialWithRelationsSchema).array(),
}).partial())

export type UserProfileWithPartialRelations = z.infer<typeof UserProfileSchema> & UserProfilePartialRelations

export const UserProfileWithPartialRelationsSchema: z.ZodType<UserProfileWithPartialRelations> = UserProfileSchema.merge(z.object({
  questionnaireSessions: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// CATEGORY SCHEMA
/////////////////////////////////////////

export const CategorySchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable(),
  parentId: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Category = z.infer<typeof CategorySchema>

/////////////////////////////////////////
// CATEGORY PARTIAL SCHEMA
/////////////////////////////////////////

export const CategoryPartialSchema = CategorySchema.partial()

export type CategoryPartial = z.infer<typeof CategoryPartialSchema>

// CATEGORY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const CategoryOptionalDefaultsSchema = CategorySchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type CategoryOptionalDefaults = z.infer<typeof CategoryOptionalDefaultsSchema>

// CATEGORY RELATION SCHEMA
//------------------------------------------------------

export type CategoryRelations = {
  parentCategory?: CategoryWithRelations | null;
  subCategories: CategoryWithRelations[];
  productCategories: ProductCategoryWithRelations[];
  questions: QuestionWithRelations[];
  keyPoints: CategoryKeyPointWithRelations[];
  commonQuestions: CategoryCommonQuestionWithRelations[];
  userHistories: UserHistoryWithRelations[];
  QuestionnaireSession: QuestionnaireSessionWithRelations[];
};

export type CategoryWithRelations = z.infer<typeof CategorySchema> & CategoryRelations

export const CategoryWithRelationsSchema: z.ZodType<CategoryWithRelations> = CategorySchema.merge(z.object({
  parentCategory: z.lazy(() => CategoryWithRelationsSchema).nullable(),
  subCategories: z.lazy(() => CategoryWithRelationsSchema).array(),
  productCategories: z.lazy(() => ProductCategoryWithRelationsSchema).array(),
  questions: z.lazy(() => QuestionWithRelationsSchema).array(),
  keyPoints: z.lazy(() => CategoryKeyPointWithRelationsSchema).array(),
  commonQuestions: z.lazy(() => CategoryCommonQuestionWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryWithRelationsSchema).array(),
  QuestionnaireSession: z.lazy(() => QuestionnaireSessionWithRelationsSchema).array(),
}))

// CATEGORY OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type CategoryOptionalDefaultsRelations = {
  parentCategory?: CategoryOptionalDefaultsWithRelations | null;
  subCategories: CategoryOptionalDefaultsWithRelations[];
  productCategories: ProductCategoryOptionalDefaultsWithRelations[];
  questions: QuestionOptionalDefaultsWithRelations[];
  keyPoints: CategoryKeyPointOptionalDefaultsWithRelations[];
  commonQuestions: CategoryCommonQuestionOptionalDefaultsWithRelations[];
  userHistories: UserHistoryOptionalDefaultsWithRelations[];
  QuestionnaireSession: QuestionnaireSessionOptionalDefaultsWithRelations[];
};

export type CategoryOptionalDefaultsWithRelations = z.infer<typeof CategoryOptionalDefaultsSchema> & CategoryOptionalDefaultsRelations

export const CategoryOptionalDefaultsWithRelationsSchema: z.ZodType<CategoryOptionalDefaultsWithRelations> = CategoryOptionalDefaultsSchema.merge(z.object({
  parentCategory: z.lazy(() => CategoryOptionalDefaultsWithRelationsSchema).nullable(),
  subCategories: z.lazy(() => CategoryOptionalDefaultsWithRelationsSchema).array(),
  productCategories: z.lazy(() => ProductCategoryOptionalDefaultsWithRelationsSchema).array(),
  questions: z.lazy(() => QuestionOptionalDefaultsWithRelationsSchema).array(),
  keyPoints: z.lazy(() => CategoryKeyPointOptionalDefaultsWithRelationsSchema).array(),
  commonQuestions: z.lazy(() => CategoryCommonQuestionOptionalDefaultsWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryOptionalDefaultsWithRelationsSchema).array(),
  QuestionnaireSession: z.lazy(() => QuestionnaireSessionOptionalDefaultsWithRelationsSchema).array(),
}))

// CATEGORY PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type CategoryPartialRelations = {
  parentCategory?: CategoryPartialWithRelations | null;
  subCategories?: CategoryPartialWithRelations[];
  productCategories?: ProductCategoryPartialWithRelations[];
  questions?: QuestionPartialWithRelations[];
  keyPoints?: CategoryKeyPointPartialWithRelations[];
  commonQuestions?: CategoryCommonQuestionPartialWithRelations[];
  userHistories?: UserHistoryPartialWithRelations[];
  QuestionnaireSession?: QuestionnaireSessionPartialWithRelations[];
};

export type CategoryPartialWithRelations = z.infer<typeof CategoryPartialSchema> & CategoryPartialRelations

export const CategoryPartialWithRelationsSchema: z.ZodType<CategoryPartialWithRelations> = CategoryPartialSchema.merge(z.object({
  parentCategory: z.lazy(() => CategoryPartialWithRelationsSchema).nullable(),
  subCategories: z.lazy(() => CategoryPartialWithRelationsSchema).array(),
  productCategories: z.lazy(() => ProductCategoryPartialWithRelationsSchema).array(),
  questions: z.lazy(() => QuestionPartialWithRelationsSchema).array(),
  keyPoints: z.lazy(() => CategoryKeyPointPartialWithRelationsSchema).array(),
  commonQuestions: z.lazy(() => CategoryCommonQuestionPartialWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryPartialWithRelationsSchema).array(),
  QuestionnaireSession: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema).array(),
})).partial()

export type CategoryOptionalDefaultsWithPartialRelations = z.infer<typeof CategoryOptionalDefaultsSchema> & CategoryPartialRelations

export const CategoryOptionalDefaultsWithPartialRelationsSchema: z.ZodType<CategoryOptionalDefaultsWithPartialRelations> = CategoryOptionalDefaultsSchema.merge(z.object({
  parentCategory: z.lazy(() => CategoryPartialWithRelationsSchema).nullable(),
  subCategories: z.lazy(() => CategoryPartialWithRelationsSchema).array(),
  productCategories: z.lazy(() => ProductCategoryPartialWithRelationsSchema).array(),
  questions: z.lazy(() => QuestionPartialWithRelationsSchema).array(),
  keyPoints: z.lazy(() => CategoryKeyPointPartialWithRelationsSchema).array(),
  commonQuestions: z.lazy(() => CategoryCommonQuestionPartialWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryPartialWithRelationsSchema).array(),
  QuestionnaireSession: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema).array(),
}).partial())

export type CategoryWithPartialRelations = z.infer<typeof CategorySchema> & CategoryPartialRelations

export const CategoryWithPartialRelationsSchema: z.ZodType<CategoryWithPartialRelations> = CategorySchema.merge(z.object({
  parentCategory: z.lazy(() => CategoryPartialWithRelationsSchema).nullable(),
  subCategories: z.lazy(() => CategoryPartialWithRelationsSchema).array(),
  productCategories: z.lazy(() => ProductCategoryPartialWithRelationsSchema).array(),
  questions: z.lazy(() => QuestionPartialWithRelationsSchema).array(),
  keyPoints: z.lazy(() => CategoryKeyPointPartialWithRelationsSchema).array(),
  commonQuestions: z.lazy(() => CategoryCommonQuestionPartialWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryPartialWithRelationsSchema).array(),
  QuestionnaireSession: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// CATEGORY KEY POINT SCHEMA
/////////////////////////////////////////

export const CategoryKeyPointSchema = z.object({
  id: z.string().cuid(),
  categoryId: z.string(),
  point: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type CategoryKeyPoint = z.infer<typeof CategoryKeyPointSchema>

/////////////////////////////////////////
// CATEGORY KEY POINT PARTIAL SCHEMA
/////////////////////////////////////////

export const CategoryKeyPointPartialSchema = CategoryKeyPointSchema.partial()

export type CategoryKeyPointPartial = z.infer<typeof CategoryKeyPointPartialSchema>

// CATEGORY KEY POINT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const CategoryKeyPointOptionalDefaultsSchema = CategoryKeyPointSchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type CategoryKeyPointOptionalDefaults = z.infer<typeof CategoryKeyPointOptionalDefaultsSchema>

// CATEGORY KEY POINT RELATION SCHEMA
//------------------------------------------------------

export type CategoryKeyPointRelations = {
  category: CategoryWithRelations;
};

export type CategoryKeyPointWithRelations = z.infer<typeof CategoryKeyPointSchema> & CategoryKeyPointRelations

export const CategoryKeyPointWithRelationsSchema: z.ZodType<CategoryKeyPointWithRelations> = CategoryKeyPointSchema.merge(z.object({
  category: z.lazy(() => CategoryWithRelationsSchema),
}))

// CATEGORY KEY POINT OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type CategoryKeyPointOptionalDefaultsRelations = {
  category: CategoryOptionalDefaultsWithRelations;
};

export type CategoryKeyPointOptionalDefaultsWithRelations = z.infer<typeof CategoryKeyPointOptionalDefaultsSchema> & CategoryKeyPointOptionalDefaultsRelations

export const CategoryKeyPointOptionalDefaultsWithRelationsSchema: z.ZodType<CategoryKeyPointOptionalDefaultsWithRelations> = CategoryKeyPointOptionalDefaultsSchema.merge(z.object({
  category: z.lazy(() => CategoryOptionalDefaultsWithRelationsSchema),
}))

// CATEGORY KEY POINT PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type CategoryKeyPointPartialRelations = {
  category?: CategoryPartialWithRelations;
};

export type CategoryKeyPointPartialWithRelations = z.infer<typeof CategoryKeyPointPartialSchema> & CategoryKeyPointPartialRelations

export const CategoryKeyPointPartialWithRelationsSchema: z.ZodType<CategoryKeyPointPartialWithRelations> = CategoryKeyPointPartialSchema.merge(z.object({
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
})).partial()

export type CategoryKeyPointOptionalDefaultsWithPartialRelations = z.infer<typeof CategoryKeyPointOptionalDefaultsSchema> & CategoryKeyPointPartialRelations

export const CategoryKeyPointOptionalDefaultsWithPartialRelationsSchema: z.ZodType<CategoryKeyPointOptionalDefaultsWithPartialRelations> = CategoryKeyPointOptionalDefaultsSchema.merge(z.object({
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
}).partial())

export type CategoryKeyPointWithPartialRelations = z.infer<typeof CategoryKeyPointSchema> & CategoryKeyPointPartialRelations

export const CategoryKeyPointWithPartialRelationsSchema: z.ZodType<CategoryKeyPointWithPartialRelations> = CategoryKeyPointSchema.merge(z.object({
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// CATEGORY COMMON QUESTION SCHEMA
/////////////////////////////////////////

export const CategoryCommonQuestionSchema = z.object({
  id: z.string().cuid(),
  categoryId: z.string(),
  question: z.string(),
  answer: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type CategoryCommonQuestion = z.infer<typeof CategoryCommonQuestionSchema>

/////////////////////////////////////////
// CATEGORY COMMON QUESTION PARTIAL SCHEMA
/////////////////////////////////////////

export const CategoryCommonQuestionPartialSchema = CategoryCommonQuestionSchema.partial()

export type CategoryCommonQuestionPartial = z.infer<typeof CategoryCommonQuestionPartialSchema>

// CATEGORY COMMON QUESTION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const CategoryCommonQuestionOptionalDefaultsSchema = CategoryCommonQuestionSchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type CategoryCommonQuestionOptionalDefaults = z.infer<typeof CategoryCommonQuestionOptionalDefaultsSchema>

// CATEGORY COMMON QUESTION RELATION SCHEMA
//------------------------------------------------------

export type CategoryCommonQuestionRelations = {
  category: CategoryWithRelations;
};

export type CategoryCommonQuestionWithRelations = z.infer<typeof CategoryCommonQuestionSchema> & CategoryCommonQuestionRelations

export const CategoryCommonQuestionWithRelationsSchema: z.ZodType<CategoryCommonQuestionWithRelations> = CategoryCommonQuestionSchema.merge(z.object({
  category: z.lazy(() => CategoryWithRelationsSchema),
}))

// CATEGORY COMMON QUESTION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type CategoryCommonQuestionOptionalDefaultsRelations = {
  category: CategoryOptionalDefaultsWithRelations;
};

export type CategoryCommonQuestionOptionalDefaultsWithRelations = z.infer<typeof CategoryCommonQuestionOptionalDefaultsSchema> & CategoryCommonQuestionOptionalDefaultsRelations

export const CategoryCommonQuestionOptionalDefaultsWithRelationsSchema: z.ZodType<CategoryCommonQuestionOptionalDefaultsWithRelations> = CategoryCommonQuestionOptionalDefaultsSchema.merge(z.object({
  category: z.lazy(() => CategoryOptionalDefaultsWithRelationsSchema),
}))

// CATEGORY COMMON QUESTION PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type CategoryCommonQuestionPartialRelations = {
  category?: CategoryPartialWithRelations;
};

export type CategoryCommonQuestionPartialWithRelations = z.infer<typeof CategoryCommonQuestionPartialSchema> & CategoryCommonQuestionPartialRelations

export const CategoryCommonQuestionPartialWithRelationsSchema: z.ZodType<CategoryCommonQuestionPartialWithRelations> = CategoryCommonQuestionPartialSchema.merge(z.object({
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
})).partial()

export type CategoryCommonQuestionOptionalDefaultsWithPartialRelations = z.infer<typeof CategoryCommonQuestionOptionalDefaultsSchema> & CategoryCommonQuestionPartialRelations

export const CategoryCommonQuestionOptionalDefaultsWithPartialRelationsSchema: z.ZodType<CategoryCommonQuestionOptionalDefaultsWithPartialRelations> = CategoryCommonQuestionOptionalDefaultsSchema.merge(z.object({
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
}).partial())

export type CategoryCommonQuestionWithPartialRelations = z.infer<typeof CategoryCommonQuestionSchema> & CategoryCommonQuestionPartialRelations

export const CategoryCommonQuestionWithPartialRelationsSchema: z.ZodType<CategoryCommonQuestionWithPartialRelations> = CategoryCommonQuestionSchema.merge(z.object({
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// PRODUCT SCHEMA
/////////////////////////////////////////

export const ProductSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.instanceof(Prisma.Decimal, { message: "Field 'price' must be a Decimal. Location: ['Models', 'Product']"}).nullable(),
  rating: z.instanceof(Prisma.Decimal, { message: "Field 'rating' must be a Decimal. Location: ['Models', 'Product']"}).nullable(),
  features: z.string(),
  rakuten_url: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Product = z.infer<typeof ProductSchema>

/////////////////////////////////////////
// PRODUCT PARTIAL SCHEMA
/////////////////////////////////////////

export const ProductPartialSchema = ProductSchema.partial()

export type ProductPartial = z.infer<typeof ProductPartialSchema>

// PRODUCT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ProductOptionalDefaultsSchema = ProductSchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type ProductOptionalDefaults = z.infer<typeof ProductOptionalDefaultsSchema>

// PRODUCT RELATION SCHEMA
//------------------------------------------------------

export type ProductRelations = {
  productCategories: ProductCategoryWithRelations[];
  productTags: ProductTagWithRelations[];
  recommendations: RecommendationWithRelations[];
};

export type ProductWithRelations = z.infer<typeof ProductSchema> & ProductRelations

export const ProductWithRelationsSchema: z.ZodType<ProductWithRelations> = ProductSchema.merge(z.object({
  productCategories: z.lazy(() => ProductCategoryWithRelationsSchema).array(),
  productTags: z.lazy(() => ProductTagWithRelationsSchema).array(),
  recommendations: z.lazy(() => RecommendationWithRelationsSchema).array(),
}))

// PRODUCT OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type ProductOptionalDefaultsRelations = {
  productCategories: ProductCategoryOptionalDefaultsWithRelations[];
  productTags: ProductTagOptionalDefaultsWithRelations[];
  recommendations: RecommendationOptionalDefaultsWithRelations[];
};

export type ProductOptionalDefaultsWithRelations = z.infer<typeof ProductOptionalDefaultsSchema> & ProductOptionalDefaultsRelations

export const ProductOptionalDefaultsWithRelationsSchema: z.ZodType<ProductOptionalDefaultsWithRelations> = ProductOptionalDefaultsSchema.merge(z.object({
  productCategories: z.lazy(() => ProductCategoryOptionalDefaultsWithRelationsSchema).array(),
  productTags: z.lazy(() => ProductTagOptionalDefaultsWithRelationsSchema).array(),
  recommendations: z.lazy(() => RecommendationOptionalDefaultsWithRelationsSchema).array(),
}))

// PRODUCT PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type ProductPartialRelations = {
  productCategories?: ProductCategoryPartialWithRelations[];
  productTags?: ProductTagPartialWithRelations[];
  recommendations?: RecommendationPartialWithRelations[];
};

export type ProductPartialWithRelations = z.infer<typeof ProductPartialSchema> & ProductPartialRelations

export const ProductPartialWithRelationsSchema: z.ZodType<ProductPartialWithRelations> = ProductPartialSchema.merge(z.object({
  productCategories: z.lazy(() => ProductCategoryPartialWithRelationsSchema).array(),
  productTags: z.lazy(() => ProductTagPartialWithRelationsSchema).array(),
  recommendations: z.lazy(() => RecommendationPartialWithRelationsSchema).array(),
})).partial()

export type ProductOptionalDefaultsWithPartialRelations = z.infer<typeof ProductOptionalDefaultsSchema> & ProductPartialRelations

export const ProductOptionalDefaultsWithPartialRelationsSchema: z.ZodType<ProductOptionalDefaultsWithPartialRelations> = ProductOptionalDefaultsSchema.merge(z.object({
  productCategories: z.lazy(() => ProductCategoryPartialWithRelationsSchema).array(),
  productTags: z.lazy(() => ProductTagPartialWithRelationsSchema).array(),
  recommendations: z.lazy(() => RecommendationPartialWithRelationsSchema).array(),
}).partial())

export type ProductWithPartialRelations = z.infer<typeof ProductSchema> & ProductPartialRelations

export const ProductWithPartialRelationsSchema: z.ZodType<ProductWithPartialRelations> = ProductSchema.merge(z.object({
  productCategories: z.lazy(() => ProductCategoryPartialWithRelationsSchema).array(),
  productTags: z.lazy(() => ProductTagPartialWithRelationsSchema).array(),
  recommendations: z.lazy(() => RecommendationPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// PRODUCT CATEGORY SCHEMA
/////////////////////////////////////////

export const ProductCategorySchema = z.object({
  id: z.string().cuid(),
  productId: z.string(),
  categoryId: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type ProductCategory = z.infer<typeof ProductCategorySchema>

/////////////////////////////////////////
// PRODUCT CATEGORY PARTIAL SCHEMA
/////////////////////////////////////////

export const ProductCategoryPartialSchema = ProductCategorySchema.partial()

export type ProductCategoryPartial = z.infer<typeof ProductCategoryPartialSchema>

// PRODUCT CATEGORY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ProductCategoryOptionalDefaultsSchema = ProductCategorySchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type ProductCategoryOptionalDefaults = z.infer<typeof ProductCategoryOptionalDefaultsSchema>

// PRODUCT CATEGORY RELATION SCHEMA
//------------------------------------------------------

export type ProductCategoryRelations = {
  product: ProductWithRelations;
  category: CategoryWithRelations;
};

export type ProductCategoryWithRelations = z.infer<typeof ProductCategorySchema> & ProductCategoryRelations

export const ProductCategoryWithRelationsSchema: z.ZodType<ProductCategoryWithRelations> = ProductCategorySchema.merge(z.object({
  product: z.lazy(() => ProductWithRelationsSchema),
  category: z.lazy(() => CategoryWithRelationsSchema),
}))

// PRODUCT CATEGORY OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type ProductCategoryOptionalDefaultsRelations = {
  product: ProductOptionalDefaultsWithRelations;
  category: CategoryOptionalDefaultsWithRelations;
};

export type ProductCategoryOptionalDefaultsWithRelations = z.infer<typeof ProductCategoryOptionalDefaultsSchema> & ProductCategoryOptionalDefaultsRelations

export const ProductCategoryOptionalDefaultsWithRelationsSchema: z.ZodType<ProductCategoryOptionalDefaultsWithRelations> = ProductCategoryOptionalDefaultsSchema.merge(z.object({
  product: z.lazy(() => ProductOptionalDefaultsWithRelationsSchema),
  category: z.lazy(() => CategoryOptionalDefaultsWithRelationsSchema),
}))

// PRODUCT CATEGORY PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type ProductCategoryPartialRelations = {
  product?: ProductPartialWithRelations;
  category?: CategoryPartialWithRelations;
};

export type ProductCategoryPartialWithRelations = z.infer<typeof ProductCategoryPartialSchema> & ProductCategoryPartialRelations

export const ProductCategoryPartialWithRelationsSchema: z.ZodType<ProductCategoryPartialWithRelations> = ProductCategoryPartialSchema.merge(z.object({
  product: z.lazy(() => ProductPartialWithRelationsSchema),
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
})).partial()

export type ProductCategoryOptionalDefaultsWithPartialRelations = z.infer<typeof ProductCategoryOptionalDefaultsSchema> & ProductCategoryPartialRelations

export const ProductCategoryOptionalDefaultsWithPartialRelationsSchema: z.ZodType<ProductCategoryOptionalDefaultsWithPartialRelations> = ProductCategoryOptionalDefaultsSchema.merge(z.object({
  product: z.lazy(() => ProductPartialWithRelationsSchema),
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
}).partial())

export type ProductCategoryWithPartialRelations = z.infer<typeof ProductCategorySchema> & ProductCategoryPartialRelations

export const ProductCategoryWithPartialRelationsSchema: z.ZodType<ProductCategoryWithPartialRelations> = ProductCategorySchema.merge(z.object({
  product: z.lazy(() => ProductPartialWithRelationsSchema),
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// TAG SCHEMA
/////////////////////////////////////////

export const TagSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Tag = z.infer<typeof TagSchema>

/////////////////////////////////////////
// TAG PARTIAL SCHEMA
/////////////////////////////////////////

export const TagPartialSchema = TagSchema.partial()

export type TagPartial = z.infer<typeof TagPartialSchema>

// TAG OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const TagOptionalDefaultsSchema = TagSchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type TagOptionalDefaults = z.infer<typeof TagOptionalDefaultsSchema>

// TAG RELATION SCHEMA
//------------------------------------------------------

export type TagRelations = {
  productTags: ProductTagWithRelations[];
};

export type TagWithRelations = z.infer<typeof TagSchema> & TagRelations

export const TagWithRelationsSchema: z.ZodType<TagWithRelations> = TagSchema.merge(z.object({
  productTags: z.lazy(() => ProductTagWithRelationsSchema).array(),
}))

// TAG OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type TagOptionalDefaultsRelations = {
  productTags: ProductTagOptionalDefaultsWithRelations[];
};

export type TagOptionalDefaultsWithRelations = z.infer<typeof TagOptionalDefaultsSchema> & TagOptionalDefaultsRelations

export const TagOptionalDefaultsWithRelationsSchema: z.ZodType<TagOptionalDefaultsWithRelations> = TagOptionalDefaultsSchema.merge(z.object({
  productTags: z.lazy(() => ProductTagOptionalDefaultsWithRelationsSchema).array(),
}))

// TAG PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type TagPartialRelations = {
  productTags?: ProductTagPartialWithRelations[];
};

export type TagPartialWithRelations = z.infer<typeof TagPartialSchema> & TagPartialRelations

export const TagPartialWithRelationsSchema: z.ZodType<TagPartialWithRelations> = TagPartialSchema.merge(z.object({
  productTags: z.lazy(() => ProductTagPartialWithRelationsSchema).array(),
})).partial()

export type TagOptionalDefaultsWithPartialRelations = z.infer<typeof TagOptionalDefaultsSchema> & TagPartialRelations

export const TagOptionalDefaultsWithPartialRelationsSchema: z.ZodType<TagOptionalDefaultsWithPartialRelations> = TagOptionalDefaultsSchema.merge(z.object({
  productTags: z.lazy(() => ProductTagPartialWithRelationsSchema).array(),
}).partial())

export type TagWithPartialRelations = z.infer<typeof TagSchema> & TagPartialRelations

export const TagWithPartialRelationsSchema: z.ZodType<TagWithPartialRelations> = TagSchema.merge(z.object({
  productTags: z.lazy(() => ProductTagPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// PRODUCT TAG SCHEMA
/////////////////////////////////////////

export const ProductTagSchema = z.object({
  id: z.string().cuid(),
  productId: z.string(),
  tagId: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type ProductTag = z.infer<typeof ProductTagSchema>

/////////////////////////////////////////
// PRODUCT TAG PARTIAL SCHEMA
/////////////////////////////////////////

export const ProductTagPartialSchema = ProductTagSchema.partial()

export type ProductTagPartial = z.infer<typeof ProductTagPartialSchema>

// PRODUCT TAG OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const ProductTagOptionalDefaultsSchema = ProductTagSchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type ProductTagOptionalDefaults = z.infer<typeof ProductTagOptionalDefaultsSchema>

// PRODUCT TAG RELATION SCHEMA
//------------------------------------------------------

export type ProductTagRelations = {
  product: ProductWithRelations;
  tag: TagWithRelations;
};

export type ProductTagWithRelations = z.infer<typeof ProductTagSchema> & ProductTagRelations

export const ProductTagWithRelationsSchema: z.ZodType<ProductTagWithRelations> = ProductTagSchema.merge(z.object({
  product: z.lazy(() => ProductWithRelationsSchema),
  tag: z.lazy(() => TagWithRelationsSchema),
}))

// PRODUCT TAG OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type ProductTagOptionalDefaultsRelations = {
  product: ProductOptionalDefaultsWithRelations;
  tag: TagOptionalDefaultsWithRelations;
};

export type ProductTagOptionalDefaultsWithRelations = z.infer<typeof ProductTagOptionalDefaultsSchema> & ProductTagOptionalDefaultsRelations

export const ProductTagOptionalDefaultsWithRelationsSchema: z.ZodType<ProductTagOptionalDefaultsWithRelations> = ProductTagOptionalDefaultsSchema.merge(z.object({
  product: z.lazy(() => ProductOptionalDefaultsWithRelationsSchema),
  tag: z.lazy(() => TagOptionalDefaultsWithRelationsSchema),
}))

// PRODUCT TAG PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type ProductTagPartialRelations = {
  product?: ProductPartialWithRelations;
  tag?: TagPartialWithRelations;
};

export type ProductTagPartialWithRelations = z.infer<typeof ProductTagPartialSchema> & ProductTagPartialRelations

export const ProductTagPartialWithRelationsSchema: z.ZodType<ProductTagPartialWithRelations> = ProductTagPartialSchema.merge(z.object({
  product: z.lazy(() => ProductPartialWithRelationsSchema),
  tag: z.lazy(() => TagPartialWithRelationsSchema),
})).partial()

export type ProductTagOptionalDefaultsWithPartialRelations = z.infer<typeof ProductTagOptionalDefaultsSchema> & ProductTagPartialRelations

export const ProductTagOptionalDefaultsWithPartialRelationsSchema: z.ZodType<ProductTagOptionalDefaultsWithPartialRelations> = ProductTagOptionalDefaultsSchema.merge(z.object({
  product: z.lazy(() => ProductPartialWithRelationsSchema),
  tag: z.lazy(() => TagPartialWithRelationsSchema),
}).partial())

export type ProductTagWithPartialRelations = z.infer<typeof ProductTagSchema> & ProductTagPartialRelations

export const ProductTagWithPartialRelationsSchema: z.ZodType<ProductTagWithPartialRelations> = ProductTagSchema.merge(z.object({
  product: z.lazy(() => ProductPartialWithRelationsSchema),
  tag: z.lazy(() => TagPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// QUESTION SCHEMA
/////////////////////////////////////////

export const QuestionSchema = z.object({
  type: QuestionTypeSchema,
  id: z.string().cuid(),
  categoryId: z.string(),
  text: z.string(),
  description: z.string().nullable(),
  is_required: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Question = z.infer<typeof QuestionSchema>

/////////////////////////////////////////
// QUESTION PARTIAL SCHEMA
/////////////////////////////////////////

export const QuestionPartialSchema = QuestionSchema.partial()

export type QuestionPartial = z.infer<typeof QuestionPartialSchema>

// QUESTION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const QuestionOptionalDefaultsSchema = QuestionSchema.merge(z.object({
  id: z.string().cuid().optional(),
  is_required: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type QuestionOptionalDefaults = z.infer<typeof QuestionOptionalDefaultsSchema>

// QUESTION RELATION SCHEMA
//------------------------------------------------------

export type QuestionRelations = {
  category: CategoryWithRelations;
  options: QuestionOptionWithRelations[];
  answers: AnswerWithRelations[];
};

export type QuestionWithRelations = z.infer<typeof QuestionSchema> & QuestionRelations

export const QuestionWithRelationsSchema: z.ZodType<QuestionWithRelations> = QuestionSchema.merge(z.object({
  category: z.lazy(() => CategoryWithRelationsSchema),
  options: z.lazy(() => QuestionOptionWithRelationsSchema).array(),
  answers: z.lazy(() => AnswerWithRelationsSchema).array(),
}))

// QUESTION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type QuestionOptionalDefaultsRelations = {
  category: CategoryOptionalDefaultsWithRelations;
  options: QuestionOptionOptionalDefaultsWithRelations[];
  answers: AnswerOptionalDefaultsWithRelations[];
};

export type QuestionOptionalDefaultsWithRelations = z.infer<typeof QuestionOptionalDefaultsSchema> & QuestionOptionalDefaultsRelations

export const QuestionOptionalDefaultsWithRelationsSchema: z.ZodType<QuestionOptionalDefaultsWithRelations> = QuestionOptionalDefaultsSchema.merge(z.object({
  category: z.lazy(() => CategoryOptionalDefaultsWithRelationsSchema),
  options: z.lazy(() => QuestionOptionOptionalDefaultsWithRelationsSchema).array(),
  answers: z.lazy(() => AnswerOptionalDefaultsWithRelationsSchema).array(),
}))

// QUESTION PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type QuestionPartialRelations = {
  category?: CategoryPartialWithRelations;
  options?: QuestionOptionPartialWithRelations[];
  answers?: AnswerPartialWithRelations[];
};

export type QuestionPartialWithRelations = z.infer<typeof QuestionPartialSchema> & QuestionPartialRelations

export const QuestionPartialWithRelationsSchema: z.ZodType<QuestionPartialWithRelations> = QuestionPartialSchema.merge(z.object({
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
  options: z.lazy(() => QuestionOptionPartialWithRelationsSchema).array(),
  answers: z.lazy(() => AnswerPartialWithRelationsSchema).array(),
})).partial()

export type QuestionOptionalDefaultsWithPartialRelations = z.infer<typeof QuestionOptionalDefaultsSchema> & QuestionPartialRelations

export const QuestionOptionalDefaultsWithPartialRelationsSchema: z.ZodType<QuestionOptionalDefaultsWithPartialRelations> = QuestionOptionalDefaultsSchema.merge(z.object({
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
  options: z.lazy(() => QuestionOptionPartialWithRelationsSchema).array(),
  answers: z.lazy(() => AnswerPartialWithRelationsSchema).array(),
}).partial())

export type QuestionWithPartialRelations = z.infer<typeof QuestionSchema> & QuestionPartialRelations

export const QuestionWithPartialRelationsSchema: z.ZodType<QuestionWithPartialRelations> = QuestionSchema.merge(z.object({
  category: z.lazy(() => CategoryPartialWithRelationsSchema),
  options: z.lazy(() => QuestionOptionPartialWithRelationsSchema).array(),
  answers: z.lazy(() => AnswerPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// QUESTION OPTION SCHEMA
/////////////////////////////////////////

export const QuestionOptionSchema = z.object({
  id: z.string().cuid(),
  questionId: z.string(),
  label: z.string(),
  description: z.string().nullable(),
  icon_url: z.string().nullable(),
  value: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type QuestionOption = z.infer<typeof QuestionOptionSchema>

/////////////////////////////////////////
// QUESTION OPTION PARTIAL SCHEMA
/////////////////////////////////////////

export const QuestionOptionPartialSchema = QuestionOptionSchema.partial()

export type QuestionOptionPartial = z.infer<typeof QuestionOptionPartialSchema>

// QUESTION OPTION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const QuestionOptionOptionalDefaultsSchema = QuestionOptionSchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type QuestionOptionOptionalDefaults = z.infer<typeof QuestionOptionOptionalDefaultsSchema>

// QUESTION OPTION RELATION SCHEMA
//------------------------------------------------------

export type QuestionOptionRelations = {
  question: QuestionWithRelations;
  answers: AnswerWithRelations[];
};

export type QuestionOptionWithRelations = z.infer<typeof QuestionOptionSchema> & QuestionOptionRelations

export const QuestionOptionWithRelationsSchema: z.ZodType<QuestionOptionWithRelations> = QuestionOptionSchema.merge(z.object({
  question: z.lazy(() => QuestionWithRelationsSchema),
  answers: z.lazy(() => AnswerWithRelationsSchema).array(),
}))

// QUESTION OPTION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type QuestionOptionOptionalDefaultsRelations = {
  question: QuestionOptionalDefaultsWithRelations;
  answers: AnswerOptionalDefaultsWithRelations[];
};

export type QuestionOptionOptionalDefaultsWithRelations = z.infer<typeof QuestionOptionOptionalDefaultsSchema> & QuestionOptionOptionalDefaultsRelations

export const QuestionOptionOptionalDefaultsWithRelationsSchema: z.ZodType<QuestionOptionOptionalDefaultsWithRelations> = QuestionOptionOptionalDefaultsSchema.merge(z.object({
  question: z.lazy(() => QuestionOptionalDefaultsWithRelationsSchema),
  answers: z.lazy(() => AnswerOptionalDefaultsWithRelationsSchema).array(),
}))

// QUESTION OPTION PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type QuestionOptionPartialRelations = {
  question?: QuestionPartialWithRelations;
  answers?: AnswerPartialWithRelations[];
};

export type QuestionOptionPartialWithRelations = z.infer<typeof QuestionOptionPartialSchema> & QuestionOptionPartialRelations

export const QuestionOptionPartialWithRelationsSchema: z.ZodType<QuestionOptionPartialWithRelations> = QuestionOptionPartialSchema.merge(z.object({
  question: z.lazy(() => QuestionPartialWithRelationsSchema),
  answers: z.lazy(() => AnswerPartialWithRelationsSchema).array(),
})).partial()

export type QuestionOptionOptionalDefaultsWithPartialRelations = z.infer<typeof QuestionOptionOptionalDefaultsSchema> & QuestionOptionPartialRelations

export const QuestionOptionOptionalDefaultsWithPartialRelationsSchema: z.ZodType<QuestionOptionOptionalDefaultsWithPartialRelations> = QuestionOptionOptionalDefaultsSchema.merge(z.object({
  question: z.lazy(() => QuestionPartialWithRelationsSchema),
  answers: z.lazy(() => AnswerPartialWithRelationsSchema).array(),
}).partial())

export type QuestionOptionWithPartialRelations = z.infer<typeof QuestionOptionSchema> & QuestionOptionPartialRelations

export const QuestionOptionWithPartialRelationsSchema: z.ZodType<QuestionOptionWithPartialRelations> = QuestionOptionSchema.merge(z.object({
  question: z.lazy(() => QuestionPartialWithRelationsSchema),
  answers: z.lazy(() => AnswerPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// QUESTIONNAIRE SESSION SCHEMA
/////////////////////////////////////////

export const QuestionnaireSessionSchema = z.object({
  status: SessionStatusSchema,
  id: z.string().cuid(),
  userProfileId: z.string(),
  categoryId: z.string().nullable(),
  started_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type QuestionnaireSession = z.infer<typeof QuestionnaireSessionSchema>

/////////////////////////////////////////
// QUESTIONNAIRE SESSION PARTIAL SCHEMA
/////////////////////////////////////////

export const QuestionnaireSessionPartialSchema = QuestionnaireSessionSchema.partial()

export type QuestionnaireSessionPartial = z.infer<typeof QuestionnaireSessionPartialSchema>

// QUESTIONNAIRE SESSION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const QuestionnaireSessionOptionalDefaultsSchema = QuestionnaireSessionSchema.merge(z.object({
  status: SessionStatusSchema.optional(),
  id: z.string().cuid().optional(),
  started_at: z.coerce.date().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type QuestionnaireSessionOptionalDefaults = z.infer<typeof QuestionnaireSessionOptionalDefaultsSchema>

// QUESTIONNAIRE SESSION RELATION SCHEMA
//------------------------------------------------------

export type QuestionnaireSessionRelations = {
  userProfile: UserProfileWithRelations;
  category?: CategoryWithRelations | null;
  answers: AnswerWithRelations[];
  recommendations: RecommendationWithRelations[];
  userHistories: UserHistoryWithRelations[];
};

export type QuestionnaireSessionWithRelations = z.infer<typeof QuestionnaireSessionSchema> & QuestionnaireSessionRelations

export const QuestionnaireSessionWithRelationsSchema: z.ZodType<QuestionnaireSessionWithRelations> = QuestionnaireSessionSchema.merge(z.object({
  userProfile: z.lazy(() => UserProfileWithRelationsSchema),
  category: z.lazy(() => CategoryWithRelationsSchema).nullable(),
  answers: z.lazy(() => AnswerWithRelationsSchema).array(),
  recommendations: z.lazy(() => RecommendationWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryWithRelationsSchema).array(),
}))

// QUESTIONNAIRE SESSION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type QuestionnaireSessionOptionalDefaultsRelations = {
  userProfile: UserProfileOptionalDefaultsWithRelations;
  category?: CategoryOptionalDefaultsWithRelations | null;
  answers: AnswerOptionalDefaultsWithRelations[];
  recommendations: RecommendationOptionalDefaultsWithRelations[];
  userHistories: UserHistoryOptionalDefaultsWithRelations[];
};

export type QuestionnaireSessionOptionalDefaultsWithRelations = z.infer<typeof QuestionnaireSessionOptionalDefaultsSchema> & QuestionnaireSessionOptionalDefaultsRelations

export const QuestionnaireSessionOptionalDefaultsWithRelationsSchema: z.ZodType<QuestionnaireSessionOptionalDefaultsWithRelations> = QuestionnaireSessionOptionalDefaultsSchema.merge(z.object({
  userProfile: z.lazy(() => UserProfileOptionalDefaultsWithRelationsSchema),
  category: z.lazy(() => CategoryOptionalDefaultsWithRelationsSchema).nullable(),
  answers: z.lazy(() => AnswerOptionalDefaultsWithRelationsSchema).array(),
  recommendations: z.lazy(() => RecommendationOptionalDefaultsWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryOptionalDefaultsWithRelationsSchema).array(),
}))

// QUESTIONNAIRE SESSION PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type QuestionnaireSessionPartialRelations = {
  userProfile?: UserProfilePartialWithRelations;
  category?: CategoryPartialWithRelations | null;
  answers?: AnswerPartialWithRelations[];
  recommendations?: RecommendationPartialWithRelations[];
  userHistories?: UserHistoryPartialWithRelations[];
};

export type QuestionnaireSessionPartialWithRelations = z.infer<typeof QuestionnaireSessionPartialSchema> & QuestionnaireSessionPartialRelations

export const QuestionnaireSessionPartialWithRelationsSchema: z.ZodType<QuestionnaireSessionPartialWithRelations> = QuestionnaireSessionPartialSchema.merge(z.object({
  userProfile: z.lazy(() => UserProfilePartialWithRelationsSchema),
  category: z.lazy(() => CategoryPartialWithRelationsSchema).nullable(),
  answers: z.lazy(() => AnswerPartialWithRelationsSchema).array(),
  recommendations: z.lazy(() => RecommendationPartialWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryPartialWithRelationsSchema).array(),
})).partial()

export type QuestionnaireSessionOptionalDefaultsWithPartialRelations = z.infer<typeof QuestionnaireSessionOptionalDefaultsSchema> & QuestionnaireSessionPartialRelations

export const QuestionnaireSessionOptionalDefaultsWithPartialRelationsSchema: z.ZodType<QuestionnaireSessionOptionalDefaultsWithPartialRelations> = QuestionnaireSessionOptionalDefaultsSchema.merge(z.object({
  userProfile: z.lazy(() => UserProfilePartialWithRelationsSchema),
  category: z.lazy(() => CategoryPartialWithRelationsSchema).nullable(),
  answers: z.lazy(() => AnswerPartialWithRelationsSchema).array(),
  recommendations: z.lazy(() => RecommendationPartialWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryPartialWithRelationsSchema).array(),
}).partial())

export type QuestionnaireSessionWithPartialRelations = z.infer<typeof QuestionnaireSessionSchema> & QuestionnaireSessionPartialRelations

export const QuestionnaireSessionWithPartialRelationsSchema: z.ZodType<QuestionnaireSessionWithPartialRelations> = QuestionnaireSessionSchema.merge(z.object({
  userProfile: z.lazy(() => UserProfilePartialWithRelationsSchema),
  category: z.lazy(() => CategoryPartialWithRelationsSchema).nullable(),
  answers: z.lazy(() => AnswerPartialWithRelationsSchema).array(),
  recommendations: z.lazy(() => RecommendationPartialWithRelationsSchema).array(),
  userHistories: z.lazy(() => UserHistoryPartialWithRelationsSchema).array(),
}).partial())

/////////////////////////////////////////
// ANSWER SCHEMA
/////////////////////////////////////////

export const AnswerSchema = z.object({
  id: z.string().cuid(),
  questionnaireSessionId: z.string(),
  questionId: z.string(),
  questionOptionId: z.string().nullable(),
  range_value: z.number().int().nullable(),
  text_value: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Answer = z.infer<typeof AnswerSchema>

/////////////////////////////////////////
// ANSWER PARTIAL SCHEMA
/////////////////////////////////////////

export const AnswerPartialSchema = AnswerSchema.partial()

export type AnswerPartial = z.infer<typeof AnswerPartialSchema>

// ANSWER OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AnswerOptionalDefaultsSchema = AnswerSchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type AnswerOptionalDefaults = z.infer<typeof AnswerOptionalDefaultsSchema>

// ANSWER RELATION SCHEMA
//------------------------------------------------------

export type AnswerRelations = {
  session: QuestionnaireSessionWithRelations;
  question: QuestionWithRelations;
  option?: QuestionOptionWithRelations | null;
};

export type AnswerWithRelations = z.infer<typeof AnswerSchema> & AnswerRelations

export const AnswerWithRelationsSchema: z.ZodType<AnswerWithRelations> = AnswerSchema.merge(z.object({
  session: z.lazy(() => QuestionnaireSessionWithRelationsSchema),
  question: z.lazy(() => QuestionWithRelationsSchema),
  option: z.lazy(() => QuestionOptionWithRelationsSchema).nullable(),
}))

// ANSWER OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AnswerOptionalDefaultsRelations = {
  session: QuestionnaireSessionOptionalDefaultsWithRelations;
  question: QuestionOptionalDefaultsWithRelations;
  option?: QuestionOptionOptionalDefaultsWithRelations | null;
};

export type AnswerOptionalDefaultsWithRelations = z.infer<typeof AnswerOptionalDefaultsSchema> & AnswerOptionalDefaultsRelations

export const AnswerOptionalDefaultsWithRelationsSchema: z.ZodType<AnswerOptionalDefaultsWithRelations> = AnswerOptionalDefaultsSchema.merge(z.object({
  session: z.lazy(() => QuestionnaireSessionOptionalDefaultsWithRelationsSchema),
  question: z.lazy(() => QuestionOptionalDefaultsWithRelationsSchema),
  option: z.lazy(() => QuestionOptionOptionalDefaultsWithRelationsSchema).nullable(),
}))

// ANSWER PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type AnswerPartialRelations = {
  session?: QuestionnaireSessionPartialWithRelations;
  question?: QuestionPartialWithRelations;
  option?: QuestionOptionPartialWithRelations | null;
};

export type AnswerPartialWithRelations = z.infer<typeof AnswerPartialSchema> & AnswerPartialRelations

export const AnswerPartialWithRelationsSchema: z.ZodType<AnswerPartialWithRelations> = AnswerPartialSchema.merge(z.object({
  session: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema),
  question: z.lazy(() => QuestionPartialWithRelationsSchema),
  option: z.lazy(() => QuestionOptionPartialWithRelationsSchema).nullable(),
})).partial()

export type AnswerOptionalDefaultsWithPartialRelations = z.infer<typeof AnswerOptionalDefaultsSchema> & AnswerPartialRelations

export const AnswerOptionalDefaultsWithPartialRelationsSchema: z.ZodType<AnswerOptionalDefaultsWithPartialRelations> = AnswerOptionalDefaultsSchema.merge(z.object({
  session: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema),
  question: z.lazy(() => QuestionPartialWithRelationsSchema),
  option: z.lazy(() => QuestionOptionPartialWithRelationsSchema).nullable(),
}).partial())

export type AnswerWithPartialRelations = z.infer<typeof AnswerSchema> & AnswerPartialRelations

export const AnswerWithPartialRelationsSchema: z.ZodType<AnswerWithPartialRelations> = AnswerSchema.merge(z.object({
  session: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema),
  question: z.lazy(() => QuestionPartialWithRelationsSchema),
  option: z.lazy(() => QuestionOptionPartialWithRelationsSchema).nullable(),
}).partial())

/////////////////////////////////////////
// RECOMMENDATION SCHEMA
/////////////////////////////////////////

export const RecommendationSchema = z.object({
  id: z.string().cuid(),
  questionnaireSessionId: z.string(),
  productId: z.string(),
  rank: z.number().int(),
  score: z.instanceof(Prisma.Decimal, { message: "Field 'score' must be a Decimal. Location: ['Models', 'Recommendation']"}),
  reason: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Recommendation = z.infer<typeof RecommendationSchema>

/////////////////////////////////////////
// RECOMMENDATION PARTIAL SCHEMA
/////////////////////////////////////////

export const RecommendationPartialSchema = RecommendationSchema.partial()

export type RecommendationPartial = z.infer<typeof RecommendationPartialSchema>

// RECOMMENDATION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const RecommendationOptionalDefaultsSchema = RecommendationSchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type RecommendationOptionalDefaults = z.infer<typeof RecommendationOptionalDefaultsSchema>

// RECOMMENDATION RELATION SCHEMA
//------------------------------------------------------

export type RecommendationRelations = {
  session: QuestionnaireSessionWithRelations;
  product: ProductWithRelations;
};

export type RecommendationWithRelations = z.infer<typeof RecommendationSchema> & RecommendationRelations

export const RecommendationWithRelationsSchema: z.ZodType<RecommendationWithRelations> = RecommendationSchema.merge(z.object({
  session: z.lazy(() => QuestionnaireSessionWithRelationsSchema),
  product: z.lazy(() => ProductWithRelationsSchema),
}))

// RECOMMENDATION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type RecommendationOptionalDefaultsRelations = {
  session: QuestionnaireSessionOptionalDefaultsWithRelations;
  product: ProductOptionalDefaultsWithRelations;
};

export type RecommendationOptionalDefaultsWithRelations = z.infer<typeof RecommendationOptionalDefaultsSchema> & RecommendationOptionalDefaultsRelations

export const RecommendationOptionalDefaultsWithRelationsSchema: z.ZodType<RecommendationOptionalDefaultsWithRelations> = RecommendationOptionalDefaultsSchema.merge(z.object({
  session: z.lazy(() => QuestionnaireSessionOptionalDefaultsWithRelationsSchema),
  product: z.lazy(() => ProductOptionalDefaultsWithRelationsSchema),
}))

// RECOMMENDATION PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type RecommendationPartialRelations = {
  session?: QuestionnaireSessionPartialWithRelations;
  product?: ProductPartialWithRelations;
};

export type RecommendationPartialWithRelations = z.infer<typeof RecommendationPartialSchema> & RecommendationPartialRelations

export const RecommendationPartialWithRelationsSchema: z.ZodType<RecommendationPartialWithRelations> = RecommendationPartialSchema.merge(z.object({
  session: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema),
  product: z.lazy(() => ProductPartialWithRelationsSchema),
})).partial()

export type RecommendationOptionalDefaultsWithPartialRelations = z.infer<typeof RecommendationOptionalDefaultsSchema> & RecommendationPartialRelations

export const RecommendationOptionalDefaultsWithPartialRelationsSchema: z.ZodType<RecommendationOptionalDefaultsWithPartialRelations> = RecommendationOptionalDefaultsSchema.merge(z.object({
  session: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema),
  product: z.lazy(() => ProductPartialWithRelationsSchema),
}).partial())

export type RecommendationWithPartialRelations = z.infer<typeof RecommendationSchema> & RecommendationPartialRelations

export const RecommendationWithPartialRelationsSchema: z.ZodType<RecommendationWithPartialRelations> = RecommendationSchema.merge(z.object({
  session: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema),
  product: z.lazy(() => ProductPartialWithRelationsSchema),
}).partial())

/////////////////////////////////////////
// USER HISTORY SCHEMA
/////////////////////////////////////////

export const UserHistorySchema = z.object({
  type: HistoryTypeSchema,
  id: z.string().cuid(),
  userProfileId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  sessionId: z.string().nullable(),
  categoryId: z.string().nullable(),
  score: z.instanceof(Prisma.Decimal, { message: "Field 'score' must be a Decimal. Location: ['Models', 'UserHistory']"}).nullable(),
  completion_rate: z.number().int().nullable(),
  details_json: JsonValueSchema.nullable(),
})

export type UserHistory = z.infer<typeof UserHistorySchema>

/////////////////////////////////////////
// USER HISTORY PARTIAL SCHEMA
/////////////////////////////////////////

export const UserHistoryPartialSchema = UserHistorySchema.partial()

export type UserHistoryPartial = z.infer<typeof UserHistoryPartialSchema>

// USER HISTORY OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const UserHistoryOptionalDefaultsSchema = UserHistorySchema.merge(z.object({
  id: z.string().cuid().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}))

export type UserHistoryOptionalDefaults = z.infer<typeof UserHistoryOptionalDefaultsSchema>

// USER HISTORY RELATION SCHEMA
//------------------------------------------------------

export type UserHistoryRelations = {
  userProfile: UserProfileWithRelations;
  category?: CategoryWithRelations | null;
  session?: QuestionnaireSessionWithRelations | null;
};

export type UserHistoryWithRelations = Omit<z.infer<typeof UserHistorySchema>, "details_json"> & {
  details_json?: JsonValueType | null;
} & UserHistoryRelations

export const UserHistoryWithRelationsSchema: z.ZodType<UserHistoryWithRelations> = UserHistorySchema.merge(z.object({
  userProfile: z.lazy(() => UserProfileWithRelationsSchema),
  category: z.lazy(() => CategoryWithRelationsSchema).nullable(),
  session: z.lazy(() => QuestionnaireSessionWithRelationsSchema).nullable(),
}))

// USER HISTORY OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type UserHistoryOptionalDefaultsRelations = {
  userProfile: UserProfileOptionalDefaultsWithRelations;
  category?: CategoryOptionalDefaultsWithRelations | null;
  session?: QuestionnaireSessionOptionalDefaultsWithRelations | null;
};

export type UserHistoryOptionalDefaultsWithRelations = Omit<z.infer<typeof UserHistoryOptionalDefaultsSchema>, "details_json"> & {
  details_json?: JsonValueType | null;
} & UserHistoryOptionalDefaultsRelations

export const UserHistoryOptionalDefaultsWithRelationsSchema: z.ZodType<UserHistoryOptionalDefaultsWithRelations> = UserHistoryOptionalDefaultsSchema.merge(z.object({
  userProfile: z.lazy(() => UserProfileOptionalDefaultsWithRelationsSchema),
  category: z.lazy(() => CategoryOptionalDefaultsWithRelationsSchema).nullable(),
  session: z.lazy(() => QuestionnaireSessionOptionalDefaultsWithRelationsSchema).nullable(),
}))

// USER HISTORY PARTIAL RELATION SCHEMA
//------------------------------------------------------

export type UserHistoryPartialRelations = {
  userProfile?: UserProfilePartialWithRelations;
  category?: CategoryPartialWithRelations | null;
  session?: QuestionnaireSessionPartialWithRelations | null;
};

export type UserHistoryPartialWithRelations = Omit<z.infer<typeof UserHistoryPartialSchema>, "details_json"> & {
  details_json?: JsonValueType | null;
} & UserHistoryPartialRelations

export const UserHistoryPartialWithRelationsSchema: z.ZodType<UserHistoryPartialWithRelations> = UserHistoryPartialSchema.merge(z.object({
  userProfile: z.lazy(() => UserProfilePartialWithRelationsSchema),
  category: z.lazy(() => CategoryPartialWithRelationsSchema).nullable(),
  session: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema).nullable(),
})).partial()

export type UserHistoryOptionalDefaultsWithPartialRelations = Omit<z.infer<typeof UserHistoryOptionalDefaultsSchema>, "details_json"> & {
  details_json?: JsonValueType | null;
} & UserHistoryPartialRelations

export const UserHistoryOptionalDefaultsWithPartialRelationsSchema: z.ZodType<UserHistoryOptionalDefaultsWithPartialRelations> = UserHistoryOptionalDefaultsSchema.merge(z.object({
  userProfile: z.lazy(() => UserProfilePartialWithRelationsSchema),
  category: z.lazy(() => CategoryPartialWithRelationsSchema).nullable(),
  session: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema).nullable(),
}).partial())

export type UserHistoryWithPartialRelations = Omit<z.infer<typeof UserHistorySchema>, "details_json"> & {
  details_json?: JsonValueType | null;
} & UserHistoryPartialRelations

export const UserHistoryWithPartialRelationsSchema: z.ZodType<UserHistoryWithPartialRelations> = UserHistorySchema.merge(z.object({
  userProfile: z.lazy(() => UserProfilePartialWithRelationsSchema),
  category: z.lazy(() => CategoryPartialWithRelationsSchema).nullable(),
  session: z.lazy(() => QuestionnaireSessionPartialWithRelationsSchema).nullable(),
}).partial())
