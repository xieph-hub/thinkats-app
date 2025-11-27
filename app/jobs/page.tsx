model Job {
  id               String  @id @db.Uuid @map("id")
  tenantId         String  @map("tenant_id") @db.Uuid
  title            String
  department       String?
  location         String?
  employmentType   String? @map("employment_type")
  experienceLevel  String? @map("experience_level")
  workMode         String? @map("work_mode")
  shortDescription String? @map("short_description")
  locationType     String? @map("location_type")
  status           String  @default("open")
  visibility       String  @default("public")
  tags             String[] @default([]) @map("tags")
  createdAt        DateTime @map("created_at") ...
  salaryMin        Decimal? @map("salary_min")
  salaryMax        Decimal? @map("salary_max")
  salaryCurrency   String?  @map("salary_currency")
  confidential     Boolean? @map("confidential")
  ...
}
