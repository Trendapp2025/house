CREATE EXTENSION IF NOT EXISTS postgis;
CREATE DOMAIN nonnegative AS numeric CHECK (VALUE >= 0 AND VALUE <> 'NaN'::numeric AND VALUE <> 'Infinity'::numeric);
CREATE TYPE geo_precision AS ENUM ('address','building','street','zone','municipality','unknown');
CREATE TYPE verification AS ENUM ('unverified','declared','verified','conflicting','not_applicable');
CREATE TYPE provenance_type AS ENUM ('listing_declared','user_provided','public_source','external_provider','houseid_calculated','houseid_estimated','demo','unknown');
CREATE TYPE residential_type AS ENUM ('apartment','detached_house','semi_detached_house','terraced_house','villa','farmhouse','other_residential');
CREATE TYPE market_kind AS ENUM ('ASKING_LISTING','TRANSACTION','OMI_QUOTE');
CREATE TYPE energy_class AS ENUM ('A4','A3','A2','A1','A','B','C','D','E','F','G');
CREATE TABLE source (
 id text PRIMARY KEY, name text NOT NULL, type text NOT NULL CHECK(type IN ('public_source','listing_portal','external_provider','houseid','user')),
 provider text, url text, reuse_notes text, access_method text NOT NULL, active boolean NOT NULL DEFAULT true
);
CREATE TABLE dataset_version (
 id text PRIMARY KEY, source_id text NOT NULL REFERENCES source, dataset_name text NOT NULL, version text NOT NULL,
 acquired_at timestamptz NOT NULL, valid_from date, valid_to date, checksum text NOT NULL,
 import_status text NOT NULL CHECK(import_status IN ('staging','completed','failed')), notes text,
 UNIQUE(source_id,dataset_name,version), UNIQUE(id,source_id), CHECK(valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);
CREATE TABLE municipality (
 id text PRIMARY KEY, istat_code text UNIQUE CHECK(istat_code ~ '^[0-9]{6}$'), name text NOT NULL,
 province text, province_code text, region text, country_code text NOT NULL,
 dataset_version_id text REFERENCES dataset_version
);
CREATE TABLE address (
 id text PRIMARY KEY, municipality_id text REFERENCES municipality, street text, street_number text, postal_code text,
 external_identifiers jsonb NOT NULL DEFAULT '[]'
);
CREATE TABLE building (
 id text PRIMARY KEY, source_id text NOT NULL REFERENCES source, dataset_version_id text NOT NULL,
 external_id text NOT NULL, geometry geometry(MultiPolygon,4326), attributes jsonb NOT NULL DEFAULT '{}',
 FOREIGN KEY(dataset_version_id,source_id) REFERENCES dataset_version(id,source_id), UNIQUE(dataset_version_id,external_id),
 CHECK(geometry IS NULL OR (ST_IsValid(geometry) AND NOT ST_IsEmpty(geometry)))
);
CREATE INDEX building_geometry_idx ON building USING gist(geometry);
CREATE TABLE address_point (
 id text PRIMARY KEY, address_id text REFERENCES address, building_id text REFERENCES building, street_number text,
 point geometry(Point,4326), precision geo_precision NOT NULL, source_id text NOT NULL REFERENCES source,
 dataset_version_id text NOT NULL, external_id text NOT NULL, attributes jsonb NOT NULL DEFAULT '{}',
 UNIQUE(dataset_version_id,external_id), FOREIGN KEY(dataset_version_id,source_id) REFERENCES dataset_version(id,source_id),
 CHECK(point IS NULL OR (NOT ST_IsEmpty(point) AND ST_X(point) BETWEEN -180 AND 180 AND ST_Y(point) BETWEEN -90 AND 90))
);
CREATE INDEX address_point_geometry_idx ON address_point USING gist(point);
CREATE TABLE property (
 id text PRIMARY KEY, address_id text NOT NULL REFERENCES address, building_id text REFERENCES building,
 address_point_id text REFERENCES address_point, data_kind text NOT NULL CHECK(data_kind IN ('demo','non_demo')),
 property_type residential_type, location geometry(Point,4326), precision geo_precision NOT NULL,
 geo_verification verification NOT NULL, geo_source_type provenance_type NOT NULL,
 commercial_surface nonnegative, usable_surface nonnegative, cadastral_surface nonnegative, heated_surface nonnegative,
 domain_payload jsonb NOT NULL CHECK(jsonb_typeof(domain_payload)='object' AND NOT domain_payload ? 'askingPrice'),
 CHECK(location IS NULL OR (NOT ST_IsEmpty(location) AND ST_X(location) BETWEEN -180 AND 180 AND ST_Y(location) BETWEEN -90 AND 90)),
 CHECK(domain_payload->>'propertyId'=id), CHECK(domain_payload->>'addressId'=address_id)
);
CREATE INDEX property_geometry_idx ON property USING gist(location);
CREATE TABLE listing (
 id text PRIMARY KEY, property_id text NOT NULL REFERENCES property, source_id text REFERENCES source,
 external_listing_id text, market text NOT NULL CHECK(market IN ('sale','rent')),
 asking_price nonnegative, currency text NOT NULL CHECK(currency='EUR'), published_at timestamptz, updated_at timestamptz,
 status text NOT NULL CHECK(status IN ('active','withdrawn','sold','rented','unknown')), domain_payload jsonb NOT NULL,
 CHECK(id<>property_id), CHECK(domain_payload->>'listingId'=id), CHECK(domain_payload->>'propertyId'=property_id)
);
CREATE TABLE listing_revision (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, listing_id text NOT NULL REFERENCES listing,
 recorded_at timestamptz NOT NULL DEFAULT now(), asking_price nonnegative, payload jsonb NOT NULL
);
CREATE FUNCTION capture_listing_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' OR NEW IS DISTINCT FROM OLD THEN
 INSERT INTO listing_revision(listing_id,asking_price,payload) VALUES(NEW.id,NEW.asking_price,to_jsonb(NEW));
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER listing_history AFTER INSERT OR UPDATE ON listing FOR EACH ROW EXECUTE FUNCTION capture_listing_revision();
CREATE TABLE property_observation (
 id text PRIMARY KEY, property_id text NOT NULL REFERENCES property, field text NOT NULL, value jsonb NOT NULL, unit text,
 source_id text REFERENCES source, dataset_version_id text, source_type provenance_type NOT NULL,
 observed_at timestamptz, acquired_at timestamptz, verification_status verification NOT NULL,
 provenance jsonb NOT NULL, raw_value jsonb,
 FOREIGN KEY(dataset_version_id,source_id) REFERENCES dataset_version(id,source_id),
 CHECK(dataset_version_id IS NULL OR source_id IS NOT NULL)
);
CREATE INDEX property_observation_field_idx ON property_observation(property_id,field);
CREATE TABLE territorial_feature (
 id text PRIMARY KEY, municipality_id text REFERENCES municipality, feature_type text NOT NULL,
 source_id text NOT NULL REFERENCES source, dataset_version_id text NOT NULL, external_id text NOT NULL,
 geometry geometry(Geometry,4326) NOT NULL, attributes jsonb NOT NULL DEFAULT '{}',
 UNIQUE(dataset_version_id,external_id), FOREIGN KEY(dataset_version_id,source_id) REFERENCES dataset_version(id,source_id),
 CHECK(ST_IsValid(geometry) AND NOT ST_IsEmpty(geometry))
);
CREATE INDEX territorial_geometry_idx ON territorial_feature USING gist(geometry);
CREATE TABLE property_territorial_link (
 id text PRIMARY KEY, property_id text NOT NULL REFERENCES property, territorial_feature_id text NOT NULL REFERENCES territorial_feature,
 link_method text NOT NULL CHECK(link_method IN ('point_inside_polygon','nearest','address_match','building_intersection')),
 distance_m nonnegative, quality verification NOT NULL, notes text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION require_precise_property() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM property WHERE id=NEW.property_id AND data_kind='non_demo'
 AND location IS NOT NULL AND precision IN ('address','building') AND geo_verification='verified'
 AND geo_source_type IN ('public_source','external_provider','user_provided')) THEN
 RAISE EXCEPTION 'Verified precise property location required'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER precise_territorial_link BEFORE INSERT OR UPDATE ON property_territorial_link FOR EACH ROW EXECUTE FUNCTION require_precise_property();
CREATE TABLE energy_certificate (
 id text PRIMARY KEY, certificate_identifier text NOT NULL, energy_class energy_class, epgl nonnegative,
 unit text CHECK(unit='kWh/m²/year'), heated_surface nonnegative, issue_date date, expiry_date date,
 source_id text NOT NULL REFERENCES source, dataset_version_id text NOT NULL,
 property_id text REFERENCES property, building_id text REFERENCES building,
 association_method text CHECK(association_method IN ('verified_identifier','document_review')),
 association_notes text, verification_status verification NOT NULL DEFAULT 'unverified',
 UNIQUE(dataset_version_id,certificate_identifier), FOREIGN KEY(dataset_version_id,source_id) REFERENCES dataset_version(id,source_id),
 CHECK(expiry_date IS NULL OR issue_date IS NULL OR expiry_date>=issue_date),
 CHECK((property_id IS NULL AND building_id IS NULL AND association_method IS NULL) OR
 ((property_id IS NOT NULL OR building_id IS NOT NULL) AND association_method IS NOT NULL AND verification_status='verified' AND association_notes IS NOT NULL))
);
CREATE TABLE market_observation (
 id text PRIMARY KEY, kind market_kind NOT NULL, price nonnegative, price_per_sqm nonnegative, surface nonnegative,
 surface_type text CHECK(surface_type IN ('commercial','usable','cadastral','heated','unspecified')),
 property_type residential_type, observation_date date NOT NULL, location geometry(Point,4326), precision geo_precision NOT NULL,
 source_id text NOT NULL REFERENCES source, dataset_version_id text NOT NULL, external_id text NOT NULL,
 source_type provenance_type NOT NULL CHECK(source_type NOT IN ('demo','unknown')),
 data_kind text NOT NULL CHECK(data_kind='non_demo'), verification_status verification NOT NULL,
 quality_flags text[] NOT NULL DEFAULT '{}', eligible_for_estimate boolean NOT NULL DEFAULT false CHECK(NOT eligible_for_estimate),
 UNIQUE(dataset_version_id,external_id,kind), UNIQUE(id,kind), FOREIGN KEY(dataset_version_id,source_id) REFERENCES dataset_version(id,source_id),
 CHECK(location IS NULL OR (NOT ST_IsEmpty(location) AND ST_X(location) BETWEEN -180 AND 180 AND ST_Y(location) BETWEEN -90 AND 90)),
 CHECK((surface IS NULL)=(surface_type IS NULL)), CHECK(kind<>'OMI_QUOTE' OR (price IS NULL AND price_per_sqm IS NULL))
);
CREATE TABLE omi_quote (
 market_observation_id text PRIMARY KEY, kind market_kind NOT NULL DEFAULT 'OMI_QUOTE' CHECK(kind='OMI_QUOTE'),
 territorial_feature_id text NOT NULL REFERENCES territorial_feature, year integer NOT NULL CHECK(year>=1900),
 semester smallint NOT NULL CHECK(semester IN (1,2)), property_type_label text NOT NULL, conservation text NOT NULL,
 market text NOT NULL CHECK(market IN ('sale','rent')), min_per_sqm nonnegative NOT NULL, max_per_sqm nonnegative NOT NULL,
 unit text NOT NULL CHECK(unit IN ('EUR/m²','EUR/m²/month')), dimensions jsonb NOT NULL DEFAULT '{}',
 FOREIGN KEY(market_observation_id,kind) REFERENCES market_observation(id,kind), CHECK(max_per_sqm>=min_per_sqm),
 CHECK((market='sale' AND unit='EUR/m²') OR (market='rent' AND unit='EUR/m²/month'))
);
CREATE TABLE estimate_run (
 id text PRIMARY KEY, property_id text REFERENCES property, property_reference jsonb, valuation_date date NOT NULL,
 model_version text NOT NULL, feature_schema_version text NOT NULL,
 status text NOT NULL CHECK(status IN ('pending','insufficient_data','completed','failed')),
 lower_value nonnegative, central_value nonnegative, upper_value nonnegative,
 completeness numeric CHECK(completeness BETWEEN 0 AND 1), confidence text, warnings jsonb NOT NULL DEFAULT '[]',
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(property_id IS NOT NULL OR property_reference IS NOT NULL),
 CHECK(lower_value IS NULL OR upper_value IS NULL OR lower_value<=upper_value),
 CHECK(central_value IS NULL OR (lower_value IS NOT NULL AND upper_value IS NOT NULL AND central_value BETWEEN lower_value AND upper_value)),
 CHECK(status='completed' OR (lower_value IS NULL AND central_value IS NULL AND upper_value IS NULL))
);
CREATE TABLE estimate_run_dataset (
 estimate_id text REFERENCES estimate_run, dataset_version_id text REFERENCES dataset_version,
 PRIMARY KEY(estimate_id,dataset_version_id)
);
CREATE TABLE import_record (
 dataset_version_id text NOT NULL REFERENCES dataset_version, external_id text NOT NULL,
 raw_hash text NOT NULL, raw_reference text, raw_payload jsonb, normalized_payload jsonb,
 status text NOT NULL CHECK(status IN ('staged','imported','rejected')), errors jsonb NOT NULL DEFAULT '[]',
 PRIMARY KEY(dataset_version_id,external_id)
);
CREATE TABLE import_report (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, dataset_version_id text NOT NULL REFERENCES dataset_version,
 created_at timestamptz NOT NULL DEFAULT now(), accepted integer NOT NULL, rejected integer NOT NULL, report jsonb NOT NULL
);
-- Historical evidence is append-only, including the relation to its source version.
CREATE FUNCTION reject_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Historical rows are append-only'; END $$;
CREATE TRIGGER immutable_listing_revision BEFORE UPDATE OR DELETE ON listing_revision FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER immutable_observation BEFORE UPDATE OR DELETE ON property_observation FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER immutable_market BEFORE UPDATE OR DELETE ON market_observation FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER immutable_territorial_feature BEFORE UPDATE OR DELETE ON territorial_feature FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER immutable_omi_quote BEFORE UPDATE OR DELETE ON omi_quote FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER immutable_building BEFORE UPDATE OR DELETE ON building FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE TRIGGER immutable_address_point BEFORE UPDATE OR DELETE ON address_point FOR EACH ROW EXECUTE FUNCTION reject_history_mutation();
CREATE FUNCTION preserve_dataset_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Dataset versions cannot be deleted'; END IF;
 IF ROW(NEW.id,NEW.source_id,NEW.dataset_name,NEW.version,NEW.checksum,NEW.acquired_at,NEW.valid_from,NEW.valid_to)
 IS DISTINCT FROM ROW(OLD.id,OLD.source_id,OLD.dataset_name,OLD.version,OLD.checksum,OLD.acquired_at,OLD.valid_from,OLD.valid_to)
 THEN RAISE EXCEPTION 'Dataset identity is immutable; create a new version'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER immutable_dataset BEFORE UPDATE OR DELETE ON dataset_version FOR EACH ROW EXECUTE FUNCTION preserve_dataset_identity();
