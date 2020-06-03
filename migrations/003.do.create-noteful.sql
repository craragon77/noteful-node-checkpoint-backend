ALTER TABLE folders
DROP COLUMN note_id;

ALTER TABLE folders
ADD COLUMN note_id [] REFERENCES notes(id);