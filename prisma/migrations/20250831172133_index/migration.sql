-- CreateIndex
CREATE INDEX "box_amenity_links_amenityId_boxId_idx" ON "public"."box_amenity_links"("amenityId", "boxId");

-- CreateIndex
CREATE INDEX "boxes_stableId_idx" ON "public"."boxes"("stableId");

-- CreateIndex
CREATE INDEX "boxes_archived_availableQuantity_createdAt_idx" ON "public"."boxes"("archived", "availableQuantity", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "boxes_price_idx" ON "public"."boxes"("price");

-- CreateIndex
CREATE INDEX "boxes_name_idx" ON "public"."boxes"("name");

-- CreateIndex
CREATE INDEX "boxes_boxType_idx" ON "public"."boxes"("boxType");

-- CreateIndex
CREATE INDEX "boxes_maxHorseSize_idx" ON "public"."boxes"("maxHorseSize");

-- CreateIndex
CREATE INDEX "boxes_dagsleie_idx" ON "public"."boxes"("dagsleie");

-- CreateIndex
CREATE INDEX "forum_posts_viewCount_createdAt_idx" ON "public"."forum_posts"("viewCount", "createdAt");

-- CreateIndex
CREATE INDEX "horse_buys_archived_deletedAt_createdAt_idx" ON "public"."horse_buys"("archived", "deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "horse_buys_gender_idx" ON "public"."horse_buys"("gender");

-- CreateIndex
CREATE INDEX "horse_buys_priceMin_idx" ON "public"."horse_buys"("priceMin");

-- CreateIndex
CREATE INDEX "horse_buys_priceMax_idx" ON "public"."horse_buys"("priceMax");

-- CreateIndex
CREATE INDEX "horse_buys_ageMin_idx" ON "public"."horse_buys"("ageMin");

-- CreateIndex
CREATE INDEX "horse_buys_ageMax_idx" ON "public"."horse_buys"("ageMax");

-- CreateIndex
CREATE INDEX "horse_buys_heightMin_idx" ON "public"."horse_buys"("heightMin");

-- CreateIndex
CREATE INDEX "horse_buys_heightMax_idx" ON "public"."horse_buys"("heightMax");

-- CreateIndex
CREATE INDEX "horse_sales_archived_deletedAt_createdAt_idx" ON "public"."horse_sales"("archived", "deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "horse_sales_userId_createdAt_idx" ON "public"."horse_sales"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "horse_sales_countyId_idx" ON "public"."horse_sales"("countyId");

-- CreateIndex
CREATE INDEX "horse_sales_municipalityId_idx" ON "public"."horse_sales"("municipalityId");

-- CreateIndex
CREATE INDEX "horse_sales_breedId_idx" ON "public"."horse_sales"("breedId");

-- CreateIndex
CREATE INDEX "horse_sales_disciplineId_idx" ON "public"."horse_sales"("disciplineId");

-- CreateIndex
CREATE INDEX "horse_sales_gender_idx" ON "public"."horse_sales"("gender");

-- CreateIndex
CREATE INDEX "horse_sales_size_idx" ON "public"."horse_sales"("size");

-- CreateIndex
CREATE INDEX "horse_sales_price_idx" ON "public"."horse_sales"("price");

-- CreateIndex
CREATE INDEX "horse_sales_age_idx" ON "public"."horse_sales"("age");

-- CreateIndex
CREATE INDEX "horse_sales_height_idx" ON "public"."horse_sales"("height");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "public"."messages"("conversationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "part_loan_horses_userId_idx" ON "public"."part_loan_horses"("userId");

-- CreateIndex
CREATE INDEX "profiles_nickname_idx" ON "public"."profiles"("nickname");

-- CreateIndex
CREATE INDEX "service_areas_serviceId_idx" ON "public"."service_areas"("serviceId");

-- CreateIndex
CREATE INDEX "service_areas_county_idx" ON "public"."service_areas"("county");

-- CreateIndex
CREATE INDEX "service_areas_municipality_idx" ON "public"."service_areas"("municipality");

-- CreateIndex
CREATE INDEX "services_archived_isActive_createdAt_idx" ON "public"."services"("archived", "isActive", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "services_serviceTypeId_idx" ON "public"."services"("serviceTypeId");

-- CreateIndex
CREATE INDEX "services_title_idx" ON "public"."services"("title");

-- CreateIndex
CREATE INDEX "services_userId_idx" ON "public"."services"("userId");

-- CreateIndex
CREATE INDEX "stable_amenity_links_amenityId_stableId_idx" ON "public"."stable_amenity_links"("amenityId", "stableId");

-- CreateIndex
CREATE INDEX "stable_faqs_stableId_idx" ON "public"."stable_faqs"("stableId");

-- CreateIndex
CREATE INDEX "stables_archived_createdAt_idx" ON "public"."stables"("archived", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "stables_countyId_archived_createdAt_idx" ON "public"."stables"("countyId", "archived", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "stables_municipalityId_archived_createdAt_idx" ON "public"."stables"("municipalityId", "archived", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "stables_ownerId_archived_createdAt_idx" ON "public"."stables"("ownerId", "archived", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "stables_deletedAt_createdAt_idx" ON "public"."stables"("deletedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "stables_name_idx" ON "public"."stables"("name");

-- CreateIndex
CREATE INDEX "stables_rating_idx" ON "public"."stables"("rating");
