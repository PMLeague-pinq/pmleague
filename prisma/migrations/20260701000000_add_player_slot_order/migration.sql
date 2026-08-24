-- AddPlayerSlotOrder
ALTER TABLE "Player" ADD COLUMN "slotOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing players in each team by current id order so the edit screen loads consistently.
WITH ordered_players AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "teamId" ORDER BY "id") AS rn
  FROM "Player"
)
UPDATE "Player" AS p
SET "slotOrder" = ordered_players.rn
FROM ordered_players
WHERE p."id" = ordered_players."id";

CREATE INDEX "Player_teamId_slotOrder_idx" ON "Player"("teamId", "slotOrder");