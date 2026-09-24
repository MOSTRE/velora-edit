-- Seed categories + collections (public content). Products ship as src/content/products.json (demo-marked).
insert into categories (slug, title, description) values
  ('rings','Rings','Signets, bands and sculptural forms.'),
  ('necklaces','Necklaces','Pendants, chains and everyday layers.'),
  ('bracelets','Bracelets','Cuffs, bangles and quiet links.'),
  ('earrings','Earrings','Studs, hoops and small statements.'),
  ('chains','Chains','The foundation of every stack.')
on conflict (slug) do nothing;

insert into collections (slug, title, description, image, editorial) values
  ('new-arrivals','New Arrivals','The latest pieces to join the edit.','/images/edit-arrivals.svg','Fresh finds, same strict eye.'),
  ('quiet-luxury','Quiet Luxury','No logos. No noise. Just form.','/images/edit-quiet.svg','Small details, stronger silhouette.'),
  ('under-20','Under €20','Beautiful doesn’t have to be excessive.','/images/edit-under20.svg','Every piece here costs less than a lunch in Paris.'),
  ('minimal-essentials','Minimal Essentials','The foundation of every jewelry wardrobe.','/images/edit-minimal.svg','Thin bands, fine chains, small studs.'),
  ('gold-edit','Gold Edit','Warm gold tones, edited to essentials.','/images/edit-gold.svg','Chosen for proportion, finish and ease.'),
  ('silver-edit','Silver Edit','Cool-toned staples for daily wear.','/images/edit-silver.svg','Silver keeps everything honest.'),
  ('for-him','For Him','Signets, chains and cuffs with weight.','/images/edit-him.svg','One strong piece is enough.'),
  ('for-her','For Her','Everyday pieces with a soft finish.','/images/edit-her.svg','Pieces that work with everything.'),
  ('unisex','Unisex','Designed to suit any hand, neck or wrist.','/images/edit-unisex.svg','Clean forms that look right on everybody.'),
  ('statement','Statement Pieces','A little more presence, still considered.','/images/edit-statement.svg','One statement piece per outfit is plenty.'),
  ('best-value','Best Value','The strongest look per euro.','/images/edit-value.svg','Not the cheapest — the most considered.'),
  ('gift-edit','Gift Edit','Easy to give, hard to get wrong.','/images/edit-gift.svg','Simple forms, always under control.'),
  ('signature','The Signature Collection','The definitive VELORA EDIT selection.','/images/edit-signature.svg','The silhouettes that define the edit.'),
  ('minimal-gold','Minimal Gold (legacy)','Warm gold tones, edited to essentials.','/images/edit-gold.svg','Continued as the Gold Edit.'),
  ('silver-essentials','Silver Essentials (legacy)','Cool-toned staples for daily wear.','/images/edit-silver.svg','Continued as the Silver Edit.'),
  ('everyday','Everyday Pieces','Chosen for comfort and repetition.','/images/edit-everyday.svg','If you will wear it four days a week, it belongs here.'),
  ('date-night','Date Night','A little more polish, still quiet.','/images/edit-date.svg','Keep it to two pieces.'),
  ('new-finds','New Finds (legacy)','The latest additions to the edit.','/images/edit-new.svg','Continued as New Arrivals.')
on conflict (slug) do nothing;
