-- Append-only snapshots reuse Building/AddressPoint/TerritorialFeature and import staging.
ALTER TABLE dataset_version ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}';
CREATE TABLE dataset_head (
 source_id text NOT NULL REFERENCES source, dataset_name text NOT NULL,
 dataset_version_id text NOT NULL, PRIMARY KEY(source_id,dataset_name),
 FOREIGN KEY(dataset_version_id,source_id) REFERENCES dataset_version(id,source_id)
);
ALTER TABLE address ADD COLUMN source_attributes jsonb NOT NULL DEFAULT '{}';
ALTER TABLE address ADD COLUMN dataset_version_id text REFERENCES dataset_version;
ALTER TABLE address ADD COLUMN street_number_suffix text;
CREATE INDEX address_dataset_idx ON address(dataset_version_id);
CREATE INDEX import_record_hash_idx ON import_record(dataset_version_id,raw_hash);
-- Never repair malformed geometries silently: the importer quarantines NULL/invalid results.
CREATE FUNCTION bdtre_geometry(payload jsonb, source_srid integer) RETURNS geometry LANGUAGE plpgsql AS $$
BEGIN
 RETURN ST_Transform(ST_Force2D(ST_SetSRID(ST_GeomFromGeoJSON(payload::text),source_srid)),4326);
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;
