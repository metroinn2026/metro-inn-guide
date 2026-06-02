-- Metro Inn Guide 修正版資料欄位確認
-- 可重複執行，不會覆蓋既有資料

alter table public.banners add column if not exists image_pc_source text;
alter table public.banners add column if not exists image_mobile_source text;

alter table public.news add column if not exists cover_image_source text;
alter table public.spots add column if not exists cover_image_source text;
alter table public.foods add column if not exists cover_image_source text;
alter table public.trips add column if not exists cover_image_source text;
alter table public.coupons add column if not exists cover_image_source text;

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

select '欄位與圖片素材庫確認完成' as status;
