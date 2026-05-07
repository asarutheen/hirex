CREATE TABLE "Resume" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "fileName"    TEXT NOT NULL,
  "fileKey"     TEXT NOT NULL,
  "fileUrl"     TEXT NOT NULL,
  "parsedText"  TEXT,
  "embedding"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;