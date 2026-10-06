ALTER TABLE "Team"
  ADD COLUMN "regularTotalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "postSeasonTotalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "isPostSeason" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Player"
  ADD COLUMN "regularTotalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "postSeasonTotalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "isPostSeason" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Team"
SET "regularTotalScore" = "totalScore",
    "postSeasonTotalScore" = 0
WHERE TRUE;

UPDATE "Player"
SET "regularTotalScore" = "totalScore",
    "postSeasonTotalScore" = 0
WHERE TRUE;
