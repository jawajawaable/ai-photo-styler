-- Add category column if it doesn't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'styles' and column_name = 'category') then
        alter table styles add column category text default 'Creative';
    end if;
end $$;

-- Update existing styles with categories
-- Professional
update styles set category = 'Profesyonel' where style_id in ('vesikalik');

-- Fantasy
update styles set category = 'Fantastik' where style_id in ('bulut', 'gryffindor');

-- Vintage/Nostalgic
update styles set category = 'Nostaljik' where style_id in ('osmanli', 'devrimci', 'arabesk');

-- Artistic
update styles set category = 'Sanatsal' where style_id in ('anime');

-- Creative (Default for others like 'asker', 'tattoo')
update styles set category = 'Yaratıcı' where style_id in ('asker', 'tattoo');
