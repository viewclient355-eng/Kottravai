/**
 * Run this in your Supabase SQL Editor to seed the artisans table
 * and add a 'hub' column to the products table.
 */

/* 
-- 1. Add 'hub' column to products if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS hub TEXT;

-- 2. Create artisans table
CREATE TABLE IF NOT EXISTS artisans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  craft_specialization TEXT,
  impact_statement TEXT,
  image TEXT,
  background_story TEXT,
  motivation TEXT,
  dream TEXT,
  craft_details TEXT,
  materials TEXT,
  eco_friendly_practices TEXT,
  hub TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Seed example artisan for Mathalampaarai
INSERT INTO artisans (
  name, 
  craft_specialization, 
  impact_statement, 
  hub, 
  background_story, 
  motivation, 
  dream, 
  craft_details, 
  materials, 
  eco_friendly_practices
) VALUES (
  'Mariya Selvam',
  'Terracotta Jewelry Master',
  'I went from earning 50 rupees a day to supporting my daughter''s engineering degree.',
  'mathalampaarai',
  'Mariya has lived in Mathalampaarai her entire life. For decades, she worked in the scorching sun as a daily wage laborer.',
  'She wanted a life of dignity where her creative skills were valued over her physical endurance.',
  'To see her village become a global center for sustainable crafts.',
  'Mastering the art of firing clay at precise temperatures to ensure durability without losing the earthy texture.',
  'Local river bed clay, natural mineral pigments, and organic binders.',
  'Using sun-drying techniques to reduce kiln time and sourcing all clay within a 5km radius.'
);

-- 4. Tag some existing products with the hub (Example)
-- UPDATE products SET hub = 'mathalampaarai' WHERE slug IN ('terracotta-earrings-v1', 'heritage-mix-classic');
*/
