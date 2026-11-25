ALTER TABLE "PlatformSettings"
  ADD COLUMN "brandName" TEXT NOT NULL DEFAULT 'عصام ماث',
  ADD COLUMN "accentColor" TEXT NOT NULL DEFAULT '#128c73',
  ADD COLUMN "defaultTheme" TEXT NOT NULL DEFAULT 'light';
