-- Migration script to add time columns to study_plans table
-- Run this in your Supabase SQL editor

ALTER TABLE public.study_plans 
ADD COLUMN IF NOT EXISTS start_time TIME NOT NULL DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS end_time TIME NOT NULL DEFAULT '10:00:00';

-- Update existing records to have default times
UPDATE public.study_plans 
SET start_time = '09:00:00', end_time = '10:00:00' 
WHERE start_time IS NULL OR end_time IS NULL;
