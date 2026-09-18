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
function header(active='') {return `<header class="topbar"><div class="container nav"><a class="brand brand-ci" href="index.html" aria-label="Metro Inn 北投旅圖首頁"><img class="brand-logo-img" id="siteLogoImage" src="metro-inn-logo.png" alt="METRO INN"><span class="brand-divider"></span><span id="siteLogoText" class="brand-guide-name">北投旅圖</span></a><nav class="menu"><a href="news.html">最新消息</a><a href="spots.html">景點</a><a href="trips.html">行程</a><a href="foods.html">美食</a><a href="coupons.html">優惠</a><a href="stories.html">旅人遊記</a><a href="submit.html">投稿分享</a><a id="hotelLink" href="https://btresort.metro.taipei/" target="_blank">北投會館</a></nav><a id="bookingLink" class="nav-book" href="https://rwd.ezhotel.cloud/btresort/1" target="_blank">立即訂房 ↗</a></div></header>`}
function footer(){return `<footer class="footer"><div class="container"><div class="footer-compact"><div class="footer-about"><h2 id="footerTitle">北投旅圖</h2><p id="footerDescription">從一間舒服的旅店開始，慢慢走向你喜歡的城市風景。</p><address class="footer-contact">北捷行旅（捷運北投會館）<br>地址：<a href="https://www.google.com/maps/search/?api=1&amp;query=%E5%8F%B0%E5%8C%97%E5%B8%82%E5%8C%97%E6%8A%95%E5%8D%80%E5%A4%A7%E6%A5%AD%E8%B7%AF527%E5%B7%B788%E8%99%9F" target="_blank" rel="noopener noreferrer">台北市北投區大業路527巷88號</a>（捷運北投園區內）<br>訂房專線：<a href="tel:+886228921485">02-2892-1485</a>（24小時）</address><div id="footerSocial" class="footer-social"></div></div><div class="footer-newsletter"><button class="footer-newsletter-toggle" type="button" aria-expanded="false" aria-controls="footerNewsletterPanel"><span>✉　訂閱電子報</span><span class="footer-newsletter-chevron" aria-hidden="true">＋</span></button><div class="footer-newsletter-panel" id="footerNewsletterPanel" hidden><p>掌握住宿優惠與旅遊活動資訊。</p><p class="footer-newsletter-unavailable" role="status">訂閱服務尚未開通，暫不開放填寫。</p></div></div></div><p id="footerCopy" class="copy">© 2026 臺北大眾捷運股份有限公司。版權所有。</p></div></footer>`}
// 所有頁面共用的電子報展開行為，不收集未開通服務的電子郵件。
document.addEventListener('click',event=>{const toggle=event.target.closest('.footer-newsletter-toggle');if(!toggle)return;const panel=document.getElementById('footerNewsletterPanel');if(!panel)return;const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));panel.hidden=!open;toggle.querySelector('.footer-newsletter-chevron').textContent=open?'－':'＋';});


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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=*`, {cache:'no-store',headers:{apikey:SUPABASE_ANON_KEY, Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
    if(!res.ok) return;
    const data = await res.json();
    const s = data && data[0];
    if(!s) return;
    const setText=(id,val)=>{const el=document.getElementById(id); if(el && val) el.textContent=val;};
    const setHref=(id,val)=>{const el=document.getElementById(id); if(el && val) el.href=val;};
    setText('siteLogoText', s.logo_text || '北投旅圖');
    const logo = document.getElementById('siteLogoImage');
    if(logo && typeof s.logo_url === 'string' && /^https:\/\//i.test(s.logo_url.trim())) logo.src = s.logo_url.trim();
    setText('footerTitle', s.footer_title || s.site_title);
    setText('footerDescription', s.footer_description || s.site_subtitle);
    // 版權採全站統一的正式文字，避免舊後台設定覆蓋為 Demo。
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
    setText('footerCopy', s.copyright_text);
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
