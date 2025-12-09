-- Create categories table
create table if not exists categories (
  id text primary key, -- e.g. 'Profesyonel'
  title text not null,
  description text,
  icon text, -- e.g. 'tie', 'camera'
  image_url text, -- optional cover image
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table categories enable row level security;

-- Create policies (public read, authenticated write - similar to styles)
create policy "Public categories are viewable by everyone."
  on categories for select
  using ( true );

create policy "Users can insert their own categories."
  on categories for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update their own categories."
  on categories for update
  using ( auth.role() = 'authenticated' );

create policy "Users can delete their own categories."
  on categories for delete
  using ( auth.role() = 'authenticated' );

-- Seed default categories
insert into categories (id, title, description, icon, sort_order)
values
  ('Profesyonel', 'Profesyonel', 'Vesikalık, LinkedIn ve kurumsal portreler', 'tie', 10),
  ('Yaratıcı', 'Yaratıcı', 'Asker, Dövme ve deneysel stiller', 'palette', 20),
  ('Fantastik', 'Fantastik', 'Büyücüler, ejderhalar ve masalsı dünyalar', 'wizard-hat', 30),
  ('Nostaljik', 'Nostaljik', 'Osmanlı, 90lar ve retro esintiler', 'filmstrip', 40),
  ('Sanatsal', 'Sanatsal', 'Anime, yağlı boya ve çeşitli sanat akımları', 'brush', 50)
on conflict (id) do update 
set 
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
