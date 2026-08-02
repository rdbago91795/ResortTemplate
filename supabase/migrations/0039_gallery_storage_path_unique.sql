-- 0039_gallery_storage_path_unique.sql — found while writing T051
--
-- gallery_images.storage_path had no unique constraint, so two rows could point at the same
-- stored object.
--
-- That is a data-loss hazard, not a tidiness one. FR-044 says deleting a gallery image
-- deletes the stored file with it. With two rows on one object, deleting either one destroys
-- the file the other still references — and the survivor becomes a row rendering a broken
-- image, with nothing in the schema explaining why.
--
-- ONE ROW ALREADY SERVES BOTH SURFACES. C11 and FR-041b require a single upload to appear in
-- a room's own gallery AND in the Rooms category, which the schema does with one row carrying
-- category_id, room_type_id, and a separate position for each surface. So the two-surface
-- feature is not a reason to allow duplicate paths — it is the reason none is needed.

create unique index gallery_images_storage_path_key
  on public.gallery_images (storage_path);

comment on index public.gallery_images_storage_path_key is
  'One row per stored object. FR-044 deletes the file with the row, so a second row on the same path would destroy an image still in use (0039).';
