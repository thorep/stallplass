-- CreateTable
CREATE TABLE "public"."forum_posts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'html',
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "categoryId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_reactions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_categories" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."forum_tags" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "threadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "forum_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forum_posts_parentId_createdAt_idx" ON "public"."forum_posts"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "forum_posts_categoryId_isPinned_createdAt_idx" ON "public"."forum_posts"("categoryId", "isPinned", "createdAt");

-- CreateIndex
CREATE INDEX "forum_posts_authorId_idx" ON "public"."forum_posts"("authorId");

-- CreateIndex
CREATE INDEX "forum_posts_createdAt_idx" ON "public"."forum_posts"("createdAt");

-- CreateIndex
CREATE INDEX "forum_reactions_postId_type_idx" ON "public"."forum_reactions"("postId", "type");

-- CreateIndex
CREATE INDEX "forum_reactions_userId_idx" ON "public"."forum_reactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_reactions_postId_userId_type_key" ON "public"."forum_reactions"("postId", "userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "forum_categories_name_key" ON "public"."forum_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "forum_categories_slug_key" ON "public"."forum_categories"("slug");

-- CreateIndex
CREATE INDEX "forum_categories_sortOrder_isActive_idx" ON "public"."forum_categories"("sortOrder", "isActive");

-- CreateIndex
CREATE INDEX "forum_categories_slug_idx" ON "public"."forum_categories"("slug");

-- CreateIndex
CREATE INDEX "forum_tags_name_idx" ON "public"."forum_tags"("name");

-- CreateIndex
CREATE INDEX "forum_tags_threadId_idx" ON "public"."forum_tags"("threadId");

-- AddForeignKey
ALTER TABLE "public"."forum_posts" ADD CONSTRAINT "forum_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_posts" ADD CONSTRAINT "forum_posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."forum_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_posts" ADD CONSTRAINT "forum_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."forum_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_reactions" ADD CONSTRAINT "forum_reactions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_reactions" ADD CONSTRAINT "forum_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."forum_tags" ADD CONSTRAINT "forum_tags_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
