-- Fix: make planfor32 column nullable in evaluation_plans
ALTER TABLE evaluation_plans ALTER COLUMN planfor32 DROP NOT NULL;
