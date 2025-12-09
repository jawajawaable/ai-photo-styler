-- 1. Add 'category' column to 'styles' table if missing
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'styles' and column_name = 'category') then
        alter table styles add column category text;
    end if;
end $$;

-- 2. Create 'categories' table if missing
create table if not exists categories (
  id text primary key,
  title text not null,
  description text,
  icon text,
  sort_order int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Seed 'categories'
insert into categories (id, title, description, icon, sort_order)
values
  ('Profesyonel', 'Profesyonel', 'Kurumsal portreler', 'tie', 10),
  ('Yaratıcı', 'Yaratıcı', 'Deneysel çalışmalar', 'palette', 20),
  ('Fantastik', 'Fantastik', 'Masalsı dünyalar', 'wizard-hat', 30),
  ('Nostaljik', 'Nostaljik', 'Retro stiller', 'filmstrip', 40),
  ('Sanatsal', 'Sanatsal', 'Sanat akımları', 'brush', 50)
on conflict (id) do nothing;

-- 4. Enable RLS on categories
alter table categories enable row level security;

-- Drop policies to avoid errors if they exist, then recreate
drop policy if exists "Public view" on categories;
create policy "Public view" on categories for select using (true);

drop policy if exists "Admin edit" on categories;
create policy "Admin edit" on categories for all using (auth.role() = 'authenticated');

-- 5. Backfill existing styles categories
UPDATE styles SET category = 'Profesyonel' WHERE style_id = 'vesikalik';
UPDATE styles SET category = 'Fantastik' WHERE style_id IN ('bulut', 'gryffindor');
UPDATE styles SET category = 'Nostaljik' WHERE style_id IN ('osmanli', 'devrimci', 'arabesk');
UPDATE styles SET category = 'Sanatsal' WHERE style_id = 'anime';
UPDATE styles SET category = 'Yaratıcı' WHERE category IS NULL;
