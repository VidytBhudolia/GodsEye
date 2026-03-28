BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE public.position_history
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lon double precision,
  ADD COLUMN IF NOT EXISTS alt_m double precision;

UPDATE public.position_history
SET
  lat = COALESCE(lat, ST_Y(position::geometry)),
  lon = COALESCE(lon, ST_X(position::geometry)),
  alt_m = COALESCE(alt_m, altitude_m::double precision)
WHERE lat IS NULL OR lon IS NULL OR alt_m IS NULL;

CREATE OR REPLACE FUNCTION public.sync_position_history_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.lat IS NULL AND NEW.position IS NOT NULL THEN
    NEW.lat := ST_Y(NEW.position::geometry);
  END IF;

  IF NEW.lon IS NULL AND NEW.position IS NOT NULL THEN
    NEW.lon := ST_X(NEW.position::geometry);
  END IF;

  IF NEW.position IS NULL AND NEW.lat IS NOT NULL AND NEW.lon IS NOT NULL THEN
    NEW.position := ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326)::geometry;
  END IF;

  IF NEW.alt_m IS NULL AND NEW.altitude_m IS NOT NULL THEN
    NEW.alt_m := NEW.altitude_m::double precision;
  END IF;

  IF NEW.altitude_m IS NULL AND NEW.alt_m IS NOT NULL THEN
    NEW.altitude_m := ROUND(NEW.alt_m)::integer;
  END IF;

  IF NEW.recorded_at IS NULL THEN
    NEW.recorded_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_position_history_fields ON public.position_history;

CREATE TRIGGER trg_sync_position_history_fields
BEFORE INSERT OR UPDATE ON public.position_history
FOR EACH ROW
EXECUTE FUNCTION public.sync_position_history_fields();

ALTER TABLE public.position_history
  ALTER COLUMN lat SET NOT NULL,
  ALTER COLUMN lon SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_summaries_expires_at
  ON public.ai_summaries (expires_at);

COMMIT;
