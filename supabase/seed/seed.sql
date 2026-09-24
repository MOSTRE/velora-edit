-- Seed categories + collections (public content). Products ship as src/content/products.json (demo-marked).
insert into categories (slug, title, description) values
  ('rings','Rings','Signets, bands and sculptural forms.'),
  ('necklaces','Necklaces','Pendants, chains and everyday layers.'),
  ('bracelets','Bracelets','Cuffs, bangles and quiet links.'),
  ('earrings','Earrings','Studs, hoops and small statements.'),
  ('chains','Chains','The foundation of every stack.')
on conflict (slug) do nothing;

insert into collections (slug, title, description, image, editorial) values
  ('under-20','The Under €20 Edit','Proof that proportion matters more than price.','/images/edit-under20.svg','Every piece here costs less than a lunch in Paris.'),
  ('quiet-luxury','Quiet Luxury','No logos. No noise. Just form.','/images/edit-quiet.svg','Small details, stronger silhouette.'),
  ('minimal-gold','Minimal Gold','Warm gold tones, edited to essentials.','/images/edit-gold.svg','Chosen for proportion, finish and ease.'),
  ('silver-essentials','Silver Essentials','Cool-toned staples for daily wear.','/images/edit-silver.svg','Start here if you are building a first stack.'),
  ('for-him','For Him','Signets, chains and cuffs with weight.','/images/edit-him.svg','One strong piece is enough.'),
  ('for-her','For Her','Everyday pieces with a soft finish.','/images/edit-her.svg','Pieces that work with everything.'),
  ('everyday','Everyday Pieces','Chosen for comfort and repetition.','/images/edit-everyday.svg','If you will wear it four days a week, it belongs here.'),
  ('date-night','Date Night','A little more polish, still quiet.','/images/edit-date.svg','Keep it to two pieces.'),
  ('gift-edit','Gift Edit','Easy to give, hard to get wrong.','/images/edit-gift.svg','Simple forms, always under control.'),
  ('new-finds','New Finds','The latest additions to the edit.','/images/edit-new.svg','A rotating selection for everyday wear.'),
  ('best-value','Best Value','The strongest look per euro.','/images/edit-value.svg','Not the cheapest — the most considered.')
on conflict (slug) do nothing;
