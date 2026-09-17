ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS cuisine varchar(40) NOT NULL DEFAULT 'other';
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS source_category text NOT NULL DEFAULT '';
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS menus jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS catalog_status varchar(40) NOT NULL DEFAULT 'review_required';
ALTER TABLE restaurant_profiles ADD COLUMN IF NOT EXISTS catalog_managed boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS place_memberships (
  id varchar(160) PRIMARY KEY,
  place_id uuid NOT NULL REFERENCES places(id),
  program varchar(40) NOT NULL DEFAULT 'ku-membership',
  period_label varchar(80) NOT NULL,
  source_name text NOT NULL,
  summary text NOT NULL,
  benefits jsonb NOT NULL,
  conditions jsonb NOT NULL,
  source_url text NOT NULL,
  source_label text NOT NULL,
  checked_on date NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active',
  valid_from date,
  valid_through date,
  is_published boolean NOT NULL DEFAULT false,
  verification_note text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS place_memberships_place_idx ON place_memberships(place_id);
