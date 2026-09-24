-- VELORA EDIT founders CMS table (backs /founders; bios stay editable, no invented history).
create table if not exists founders (
  id text primary key,
  name text not null,
  role text default '',
  bio text default '',
  quote text default '',
  portrait text default '',
  socials jsonb default '{"instagram":"","tiktok":"","pinterest":""}',
  display_order int default 0,
  published boolean default true,
  updated_at timestamptz default now()
);

alter table founders enable row level security;
create policy "public read founders" on founders for select using (published = true);
create policy "admin all founders" on founders for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

insert into founders (id, name, role, bio, quote, portrait, display_order, published) values
  ('sanae','Sanae','Co-Founder & Creative Director','Sanae brings the creative direction behind VELORA EDIT, with a focus on visual identity, styling and the small details that make a piece feel distinctive.','Beauty doesn’t need to be loud to be noticed.','/images/founder-sanae.svg',1,true),
  ('salma','Salma','Co-Founder & Brand Director','Salma shapes the brand experience behind VELORA EDIT, from the pieces we discover to the way they are presented, making every collection feel intentional and easy to explore.','Good style is often found in the details people almost miss.','/images/founder-salma.svg',2,true)
on conflict (id) do nothing;
