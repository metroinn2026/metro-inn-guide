const IMG={
hero:'https://commons.wikimedia.org/wiki/Special:FilePath/Thermal%20Valley%20beitou%20Taiwan.jpg',
valley:'https://commons.wikimedia.org/wiki/Special:FilePath/Thermal%20Valley%20in%20Beitou.jpg',
museum:'https://commons.wikimedia.org/wiki/Special:FilePath/Beitou%20Hot%20Spring%20Museum.jpg',
library:'https://commons.wikimedia.org/wiki/Special:FilePath/Taipei%20Public%20Library%20Beitou%20Branch.jpg',
yang:'https://commons.wikimedia.org/wiki/Special:FilePath/Yangmingshan%20National%20Park.jpg',
shilin:'https://commons.wikimedia.org/wiki/Special:FilePath/Taiwan%20Shilin%20Night%20Market.jpg',
tamsui:'https://commons.wikimedia.org/wiki/Special:FilePath/2020%20Sunset%20of%20Tamsui%20Fisherman%27s%20Wharf.jpg',
onsen:'https://commons.wikimedia.org/wiki/Special:FilePath/Beitou%20Thermal%20Valley.jpg',
dining:'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85',
beef:'https://commons.wikimedia.org/wiki/Special:FilePath/Taiwanese%20Beef%20Noodle%20Soup.jpg',
grill:'https://commons.wikimedia.org/wiki/Special:FilePath/Taiwan%20Night%20Market.JPG',
gift:'https://commons.wikimedia.org/wiki/Special:FilePath/Raohe%20Street%20Night%20Market%2C%20Taipei%2020170923.jpg',
hotel:'https://commons.wikimedia.org/wiki/Special:FilePath/2007-10-23%20Room%20%40%20Far%20East%20Plaza%20Hotel%2C%20Taipei%2001.jpg',
family:'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1600&q=85',
coffee:'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=85',
river:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85',
shop:'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=85'
};
function header(active='') {return `<header class="topbar"><div class="container nav"><a class="brand" href="index.html"><span class="mark"></span><span id="siteLogoText">Metro Inn Guide｜北投旅圖</span></a><nav class="menu"><a href="news.html">最新消息</a><a href="spots.html">景點</a><a href="trips.html">行程</a><a href="foods.html">美食</a><a href="coupons.html">優惠</a><a href="submit.html">投稿分享</a><a id="hotelLink" href="https://btresort.metro.taipei/" target="_blank">北投會館</a></nav><a id="bookingLink" class="nav-book" href="https://rwd.ezhotel.cloud/btresort/1" target="_blank">立即訂房 ↗</a></div></header>`}
function footer(){return `<footer class="footer"><div class="container"><div class="footer-grid"><div><h2 id="footerTitle">Metro Inn Guide｜北投旅圖</h2><p id="footerDescription">住進台北的剛剛好，從一間舒服的旅店開始，慢慢走向你喜歡的城市風景。</p><p id="footerContact" class="footer-contact"></p><div id="footerSocial" class="footer-social"></div></div><div class="footer-links"><a href="news.html">最新消息</a><a href="spots.html">景點</a><a href="trips.html">行程</a><a href="foods.html">美食</a><a href="coupons.html">優惠</a><a id="footerBooking" href="https://rwd.ezhotel.cloud/btresort/1" target="_blank">立即訂房</a><a href="#top">回到頂端</a></div></div><p id="footerCopy" class="copy">© 2026 Metro Inn. Local Travel Guide Demo.</p></div></footer>`}


document.addEventListener('click', async (event) => {
  const button = event.target.closest('.share-icon');
  if (!button) return;
  const title = document.title || '北捷行旅';
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      showShareToast('已複製連結');
    } else {
      showShareToast('請複製網址列連結');
    }
  } catch (e) {}
});
function showShareToast(text){
  let toast=document.querySelector('.share-toast');
  if(!toast){toast=document.createElement('div');toast.className='share-toast';document.body.appendChild(toast);}
  toast.textContent=text;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1600);
}


async function loadSiteSettings(){
  if(typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') return;
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.site_0001&select=*`, {headers:{apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
    if(!res.ok) return;
    const data = await res.json();
    const s = data && data[0];
    if(!s) return;
    const setText=(id,val)=>{const el=document.getElementById(id); if(el && val) el.textContent=val;};
    const setHref=(id,val)=>{const el=document.getElementById(id); if(el && val) el.href=val;};
    setText('siteLogoText', s.logo_text || s.site_title);
    setText('footerTitle', s.site_title);
    setText('footerDescription', s.footer_description || s.site_subtitle);
    setText('footerCopy', s.footer_copyright);
    setText('bookingLink', s.booking_text);
    setText('footerBooking', s.booking_text ? s.booking_text.replace('↗','').trim() : '');
    setHref('bookingLink', s.booking_url);
    setHref('footerBooking', s.booking_url);
    setHref('hotelLink', s.hotel_url);
    const contact=[];
    if(s.footer_address) contact.push(`地址：${s.footer_address}`);
    if(s.footer_phone) contact.push(`電話：${s.footer_phone}`);
    if(s.footer_email) contact.push(`Email：${s.footer_email}`);
    setText('footerContact', contact.join('｜'));
    const social=document.getElementById('footerSocial');
    if(social){
      social.innerHTML = [
        s.facebook_url ? `<a href="${s.facebook_url}" target="_blank">Facebook</a>` : '',
        s.instagram_url ? `<a href="${s.instagram_url}" target="_blank">Instagram</a>` : '',
        s.line_url ? `<a href="${s.line_url}" target="_blank">LINE</a>` : '',
        s.google_map_url ? `<a href="${s.google_map_url}" target="_blank">Google Map</a>` : ''
      ].filter(Boolean).join('');
    }
  }catch(e){console.warn('site settings not loaded', e);}
}
document.addEventListener('DOMContentLoaded', () => setTimeout(loadSiteSettings, 0));
