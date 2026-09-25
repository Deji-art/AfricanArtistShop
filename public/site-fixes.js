/* AfricanArtistShop coordinated layout + auth safety fixes */
(function(){
  window.currentUser = async function(){
    try{
      const r = await fetch('/api/me',{credentials:'same-origin',cache:'no-store'});
      if(!r.ok) return null;
      const d = await r.json();
      return d && d.user ? d.user : null;
    }catch(e){ return null; }
  };

  window.showNikeSignature = function(){
    const box=document.getElementById('mb');
    if(!box || typeof window.openM!=='function') return;
    box.innerHTML=
      '<div class="nike-profile">'+
      '<img class="nike-profile-main" src="https://static.wixstatic.com/media/4bf3c6_86287c8864954058ae891282071e54c0~mv2.jpg/v1/fill/w_900%2Ch_790%2Cal_c%2Clg_1%2Cq_85/4bf3c6_86287c8864954058ae891282071e54c0~mv2.jpg" alt="Chief Nike Okundaye">'+
      '<div><span class="pill">APPROVED SIGNATURE ARTIST</span><h2>Chief Nike Okundaye · Nike Art Gallery</h2>'+
      '<p class="muted">Artist, textile artist, painter and founder of Nike Art Gallery. This profile links visitors to her official gallery and selected works for further exploration.</p>'+
      '<div class="nike-work-grid">'+
      '<img src="https://d7hftxdivxxvm.cloudfront.net/?height=630&quality=80&resize_to=fit&src=https%3A%2F%2Fd32dm0rphc51dk.cloudfront.net%2Fq9Ol1Mj9o74FjtsS0-X66Q%2Flarge.jpg&width=640" alt="Rythm of Life by Nike Davies Okundaye">'+
      '<img src="https://d7hftxdivxxvm.cloudfront.net/?height=767&quality=85&resize_to=fit&src=https%3A%2F%2Fd32dm0rphc51dk.cloudfront.net%2FH6EJpC5OEsOLH7s4cJJx8g%2Fnormalized.jpg&width=800" alt="The Spirit of the Past by Nike Davies Okundaye">'+
      '<img src="https://static.wixstatic.com/media/b5d009_23364d289d4048e1b1502b02117b1a6f~mv2.jpg/v1/fill/w_558%2Ch_600%2Cal_c%2Clg_1%2Cq_80/b5d009_23364d289d4048e1b1502b02117b1a6f~mv2.jpg" alt="Family of Hope by Nike Davies Okundaye">'+
      '</div>'+
      '<div class="actions"><a class="btn primary" href="https://nikeartgallery.ng/" target="_blank" rel="noopener">Official Nike Art Gallery</a><a class="btn" href="https://www.artsy.net/artist/nike-davies-okundaye" target="_blank" rel="noopener">View more works</a></div></div></div>';
    window.openM();
  };

  function setupLayout(){
    const about=document.getElementById('about');
    const contact=document.getElementById('contact');
    const signature=document.getElementById('signature');
    const footer=document.querySelector('footer');
    if(!footer) return;

    /* Remove the old early About/Contact blocks from the main flow. */
    if(about) about.remove();
    if(contact) contact.remove();

    /* One coordinated artist-path section: shopping and registration sit together. */
    if(!document.getElementById('artistPaths')){
      const section=document.createElement('section');
      section.id='artistPaths';
      section.className='artist-paths page-section';
      section.innerHTML=
        '<div class="sectionhead"><div><div class="kicker">CHOOSE YOUR PATH</div><h2>Discover artists or become one</h2><p class="muted sub">Shop from our young and professional artists, or register to build your own AfricanArtistShop storefront.</p></div></div>'+
        '<div class="artist-path-grid">'+
          '<article class="artist-path-card kid-path"><div class="path-icon">🎨</div><span class="pill">AGES 4–18</span><h3>Young Artists</h3><p class="muted">Discover original works from young creators. Registration is completed by a parent or guardian.</p><div class="path-actions"><a class="btn" href="#kidartists">Shop from Kid Artists</a><button class="btn primary" type="button" onclick="openArtistApplyKid()">Register as Kid Artist</button></div></article>'+
          '<article class="artist-path-card pro-path"><div class="path-icon">🖌️</div><span class="pill">ADULT CREATORS</span><h3>Professional Artists</h3><p class="muted">Explore collections from adult and professional artists, or create a professional storefront.</p><div class="path-actions"><a class="btn" href="#proartists">Shop from Professional Artists</a><button class="btn primary" type="button" onclick="openArtistApplyPro()">Register as Professional Artist</button></div></article>'+
          '<article class="artist-path-card signature-path"><div class="path-icon">✦</div><span class="pill">SIGNATURE</span><h3>Signature Artists</h3><p class="muted">Explore invited and approved renowned artists and their dedicated collections.</p><div class="path-actions"><a class="btn" href="#signature">Shop Signature Artists</a><button class="btn primary" type="button" onclick="openArtistApplySignature()">Register as Signature Artist</button></div></article>'+
        '</div>';
      const hero=document.getElementById('home');
      if(hero && !document.getElementById('adSlotHero')){ const ad=document.createElement('div'); ad.id='adSlotHero'; ad.className='ad-slot'; ad.innerHTML='<span>ADVERTISEMENT · MUST BUY</span><div class="ad-content"><img src="https://goodsstores.com/cdn/shop/files/paints_set_on_canvas.jpg?v=1776876090&width=900" alt="Acrylic Paint Set"><div><strong>Acrylic Paint Set</strong><p>Build your studio with a versatile acrylic paint set.</p><button class="btn primary" type="button" onclick="document.getElementById(\'supplies\').scrollIntoView({behavior:\'smooth\'});setTimeout(()=>{const q=document.getElementById(\'supplyQ\');if(q){q.value=\'Acrylic Paint Set\';loadSupplies()}},150)">Shop now</button></div></div>'; hero.parentNode.insertBefore(ad,hero.nextSibling); }
      const sig=document.getElementById('signature');
      if(sig && !document.getElementById('adSlotSignature')){ const ad=document.createElement('div'); ad.id='adSlotSignature'; ad.className='ad-slot'; ad.innerHTML='<span>FEATURED ARTWORK</span><div class="ad-content"><img src="/face-of-time.svg" alt="Face of Time"><div><strong>Face of Time</strong><p>Featured artwork by Peace Ayodeji.</p><button class="btn primary" type="button" onclick="openPeaceFeature()">View artwork</button></div></div>'; sig.parentNode.insertBefore(ad,sig); }
      const footerEl=document.querySelector('footer');
      if(footerEl && !document.getElementById('adSlotFooter')){ const ad=document.createElement('div'); ad.id='adSlotFooter'; ad.className='ad-slot ad-slot-footer'; ad.innerHTML='<span>FEATURED ARTIST</span><div class="ad-content"><img src="https://static.wixstatic.com/media/4bf3c6_86287c8864954058ae891282071e54c0~mv2.jpg/v1/fill/w_900%2Ch_790%2Cal_c%2Clg_1%2Cq_85/4bf3c6_86287c8864954058ae891282071e54c0~mv2.jpg" alt="Chief Nike Okundaye"><div><strong>Chief Nike Okundaye</strong><p>Nigerian artist, textile artist and founder of Nike Art Gallery.</p><button class="btn primary" type="button" onclick="showNikeSignature()">Explore profile</button></div></div>'; footerEl.parentNode.insertBefore(ad,footerEl); }

      const shop=document.getElementById('shop');
      const pro=document.getElementById('proartists');
      if(shop && shop.parentNode) shop.parentNode.insertBefore(section,shop);
      else if(pro && pro.parentNode) pro.parentNode.insertBefore(section,signature||pro.nextSibling);
      else if(footer.previousSibling) footer.parentNode.insertBefore(section,footer);
    }

    /* Footer is the final information area: About, Contact and Socials. */
    let info=document.getElementById('footerInfo');
    if(!info){
      info=document.createElement('div');
      info.id='footerInfo';
      info.className='footer-info';
      info.innerHTML=
        '<div class="footer-col" id="footer-about"><div class="footer-kicker">ABOUT US</div><h3>A marketplace for African creativity.</h3><p>AfricanArtistShop brings original artwork, artists and art materials together, helping collectors discover creators while giving artists a place to present their work.</p></div>'+
        '<div class="footer-col" id="footer-contact"><div class="footer-kicker">CONTACT US</div><h3>We are here to help.</h3><p>Orders, artist applications, training enquiries and delivery questions can be sent to us.</p><p><b>Phone & WhatsApp:</b><br><span class="contact-number"><a href="tel:+2349075452255">+234 907 545 2255</a> · <a href="https://wa.me/2349075452255" target="_blank" rel="noopener">WhatsApp</a></span><br><span class="contact-number"><a href="tel:+2347031484486">+234 703 148 4486</a> · <a href="https://wa.me/2347031484486" target="_blank" rel="noopener">WhatsApp</a></span></p><p><b>Gmail:</b><br><a href="mailto:africanartistshop@gmail.com">africanartistshop@gmail.com</a></p></div>'+
        '<div class="footer-col" id="footer-social"><div class="footer-kicker">SOCIAL MEDIA</div><h3>Follow AfricanArtistShop</h3><div class="social-grid"><a href="https://youtube.com/@africanartistsshop" target="_blank" rel="noopener">YouTube · @africanartistsshop</a><a href="https://www.tiktok.com/@africanartistshop" target="_blank" rel="noopener">TikTok · @africanartistshop</a><a href="https://www.instagram.com/africanartistshop" target="_blank" rel="noopener">Instagram · @africanartistshop</a><a href="https://www.linkedin.com/in/africanartistshop" target="_blank" rel="noopener">LinkedIn · @africanartistshop</a><a href="https://www.facebook.com/africanartistshop" target="_blank" rel="noopener">Facebook · africanartistshop</a><a href="https://x.com/africanartistshop" target="_blank" rel="noopener">X · @africanartistshop</a></div><p class="footer-note">Connect with us for new artwork, artist stories, materials and marketplace updates.</p></div>';
      footer.insertBefore(info,footer.firstChild);
    }
    if(about) about.remove();
    if(contact) contact.remove();

    /* Remove the redundant general artist listing because Kid/Professional sections are the dedicated storefronts. */
    const generalArtists=document.getElementById('artists');
    if(generalArtists) generalArtists.remove();
    /* The visible signature directory is already populated, so hide the empty API grid above it. */
    const signatureGrid=document.getElementById('signatureGrid');
    if(signatureGrid){ signatureGrid.innerHTML=''; signatureGrid.style.display='none'; }
    const sigIntro=document.querySelector('#signature .sectionhead:first-child .sub');
    if(sigIntro) sigIntro.textContent='Approved and invited signature artists are presented below with portraits and links to their official or gallery pages.';

    /* Add portraits to the existing signature-directory cards. */
    const directoryCards=document.querySelectorAll('#signature .signature-reference .signature-directory-card');
    const portraits=[
      ['https://i2.wp.com/www.johfrimartanddesign.com/wp-content/uploads/2018/09/Artist-Mufu-1.jpg?resize=600%2C600&ssl=1','Mufu Onifade'],
      ['https://thewheatbakerlagos.com/oatchace/2024/11/Duke-Asidere.jpg','Duke Asidere'],
      ['https://npr.brightspotcdn.com/dims3/default/strip/false/crop/2857x4000%2B0%2B0/resize/2857x4000%21/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2F5b%2F27%2Fc2d89f0a49178985bd1f5feeb596%2Fbruce-onobrakpeya-artist-13.jpg','Bruce Onobrakpeya']
    ];
    directoryCards.forEach((card,i)=>{
      const p=portraits[i];
      if(!p || card.querySelector('.directory-portrait')) return;
      const img=document.createElement('img');
      img.className='directory-portrait'; img.src=p[0]; img.alt=p[1]+' portrait'; img.loading='lazy'; img.referrerPolicy='no-referrer';
      img.onerror=function(){this.style.display='none';const ph=document.createElement('div');ph.className='directory-image-fallback';ph.textContent=p[1];this.parentNode.insertBefore(ph,this);};
      card.insertBefore(img,card.firstChild);
    });

    /* Open Gmail compose for the contact address. */
    document.querySelectorAll('#footer-contact a[href^="mailto:"]').forEach(a=>{
      const email=a.getAttribute('href').slice(7);
      a.href='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(email);
      a.target='_blank'; a.rel='noopener';
      a.textContent=email+' · Open Gmail';
    });

    /* Approved signature profile: Nike Art Gallery / Chief Nike Okundaye. */
    const ref=document.querySelector('#signature .signature-reference');
    if(false && ref && !document.getElementById('nikeSignatureCard')){
      const card=document.createElement('article');
      card.id='nikeSignatureCard';
      card.className='card signature-directory-card nike-card';
      card.innerHTML='<img src="https://static.wixstatic.com/media/4bf3c6_86287c8864954058ae891282071e54c0~mv2.jpg/v1/fill/w_900%2Ch_790%2Cal_c%2Clg_1%2Cq_85/4bf3c6_86287c8864954058ae891282071e54c0~mv2.jpg" alt="Chief Nike Okundaye"><div class="body"><span class="pill">APPROVED SIGNATURE ARTIST</span><h3>Nike Art Gallery</h3><p class="muted">Chief Nike Okundaye · artist, textile artist and founder of Nike Art Gallery.</p><button class="btn primary" type="button" onclick="showNikeSignature()">View profile & selected works</button></div>';
      ref.insertBefore(card,ref.firstChild);
    }

    /* Keep navigation links coordinated with the new footer locations. */
    document.querySelectorAll('a[href="#about"]').forEach(a=>a.href='#footer-about');
    document.querySelectorAll('a[href="#contact"]').forEach(a=>a.href='#footer-contact');

    /* Hide the old duplicated kid/pro registration cards in Become an Artist.
       The coordinated artist-path cards above are now the clear entry points. */
    const become=document.getElementById('become');
    if(become){
      const tiers=become.querySelectorAll('.tier-card');
      if(tiers[0]) tiers[0].style.display='none';
      if(tiers[1]) tiers[1].style.display='none';
      const heading=become.querySelector('.tier-grid');
      if(heading) heading.remove();
      if(false && heading && !heading.querySelector('.signature-only-note')){
        const note=document.createElement('div');
        note.className='signature-only-note tier-card';
        note.innerHTML='<span class="pill">SIGNATURE</span><h3>Renowned / Signature</h3><div class="fee">FREE</div><ul><li>8–10 works</li><li>For invited or approved artists</li><li>Dedicated signature shop</li></ul><button class="btn primary" type="button" onclick="openArtistApplySignature()">Register as Signature Artist</button>';
        heading.appendChild(note);
      }
    }
  }

  function removeDuplicatePeaceListings(){
    const removeFrom=(selector)=>{
      document.querySelectorAll(selector+' .card').forEach(card=>{
        const h=card.querySelector('h3');
        if(h && /Peace Ayodeji/i.test(h.textContent.trim())) card.remove();
      });
    };
    removeFrom('#adultGrid');
    removeFrom('#artistGrid');
  }
  function fixMarketplaceImages(){
    const fix=()=>{
      document.querySelectorAll('img').forEach(img=>{
        const src=img.getAttribute('src')||'';
        if(src.includes('/uploads/peace-ayodeji-profile.jpg')) img.src='/peace-ayodeji-profile.svg';
        if(src.includes('5b99be3e191f60c420084af5b098899b.jpg')) img.src='https://back.vantaart.com/uploads/images/3569d17946031a3d5207b1fc31c935fc.webp';
        img.style.maxWidth='100%';
      });
    };
    fix();
    const mo=new MutationObserver(()=>{fix(); if(typeof fixSupplyImages==='function') fixSupplyImages();});
    mo.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('load',fix);
  }

  function setupMobileNav(){
    const nav=document.querySelector('nav');
    const links=document.querySelector('.links');
    if(!nav||!links||document.getElementById('mobileMenuBtn')) return;
    const btn=document.createElement('button');
    btn.id='mobileMenuBtn'; btn.className='iconbtn mobile-menu-btn'; btn.type='button';
    btn.setAttribute('aria-label','Open menu'); btn.setAttribute('aria-expanded','false'); btn.textContent='☰';
    nav.insertBefore(btn,links);
    btn.onclick=()=>{
      const open=links.classList.toggle('mobile-open');
      btn.setAttribute('aria-expanded',String(open)); btn.textContent=open?'✕':'☰';
    };
    links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      links.classList.remove('mobile-open'); btn.setAttribute('aria-expanded','false'); btn.textContent='☰';
    }));
  }

  function addStyles(){
    if(document.getElementById('aasCoordinatedStyles')) return;
    const s=document.createElement('style');
    s.id='aasCoordinatedStyles';
    s.textContent='.artist-paths{max-width:1240px;margin:20px auto 0;padding:70px 22px 25px}.artist-path-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.artist-path-card{background:var(--paper);border:1px solid var(--line);border-radius:22px;padding:26px;box-shadow:var(--shadow);display:flex;flex-direction:column;min-height:290px}.artist-path-card.kid-path{background:linear-gradient(135deg,#fff8e8,#f7ead2)}.artist-path-card.pro-path{background:linear-gradient(135deg,#eef5f0,#dceae4)}.artist-path-card.signature-path{background:linear-gradient(135deg,#f5f0ff,#ebe2f8)}.path-icon{font-size:30px;margin-bottom:14px}.artist-path-card h3{font:700 29px Georgia,serif;margin:9px 0}.artist-path-card p{line-height:1.65}.path-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:auto;padding-top:18px}.path-actions .btn{width:100%;text-align:center}.footer-info{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:28px;margin:0 0 35px;padding-bottom:32px;border-bottom:1px solid #ffffff22}.footer-col{min-width:0}.footer-kicker{font-size:11px;letter-spacing:2px;font-weight:900;color:#e5a23b;margin-bottom:10px}.footer-col h3{font:700 24px Georgia,serif;color:#fff;margin:0 0 12px}.footer-col p{color:#aaa;line-height:1.65;margin:8px 0}.footer-col a{color:#fff}.footer-col a:hover{color:#e5a23b}.footer-note{font-size:13px}.social-grid{display:grid;grid-template-columns:1fr;gap:8px}.nike-card img{height:260px;width:100%;object-fit:cover}.directory-portrait{display:block!important;width:100%!important;height:250px!important;object-fit:cover!important;border-radius:16px 16px 0 0;aspect-ratio:4/3}.signature-reference .signature-directory-card{overflow:hidden;min-width:0;min-height:0}.signature-reference .body{height:auto;min-height:190px;display:flex;flex-direction:column;justify-content:flex-start}.signature-reference img,.nike-card img{max-width:100%;display:block}.directory-image-fallback{height:250px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#173f36,#d36a2a);color:#fff;font:700 28px Georgia,serif;padding:20px;text-align:center}.ad-slot{max-width:1200px;min-height:110px;margin:28px auto;padding:16px 22px;border:1px dashed #c9bda9;border-radius:18px;background:#f8f2e8;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;color:#756d61}.ad-slot span{font-size:10px;letter-spacing:2px;font-weight:900}.ad-slot strong{font-size:14px;font-weight:600}.ad-slot-footer{min-height:90px}.ad-content{width:100%;display:grid;grid-template-columns:180px 1fr;gap:18px;align-items:center;text-align:left}.ad-content img{width:180px;height:120px;object-fit:cover;border-radius:14px}.ad-content strong{font:700 24px Georgia,serif;color:#173f36}.ad-content p{margin:7px 0 12px}@media(max-width:600px){.ad-content{grid-template-columns:1fr;text-align:center}.ad-content img{width:100%;height:170px}.ad-content .btn{max-width:220px;margin:auto}}.grid img{max-width:100%}.card img{max-width:100%;display:block}.grid .card img{width:100%;height:auto;object-fit:cover}@media(max-width:900px){.artist-path-grid{grid-template-columns:1fr 1fr}.footer-info{grid-template-columns:1fr 1fr}}@media(max-width:700px){.directory-portrait{height:210px!important}.signature-reference{grid-template-columns:1fr!important}.signature-reference .signature-directory-card{width:100%}.directory-image-fallback{height:210px}.ad-slot{min-height:86px;margin:20px 14px;padding:14px}.ad-slot strong{font-size:12px}.nike-profile{grid-template-columns:1fr}.nike-profile-main{height:280px}.nike-work-grid{grid-template-columns:1fr 1fr}.nike-work-grid img{height:130px}.artist-path-grid{grid-template-columns:1fr}.artist-path-card{min-height:0}.path-actions{grid-template-columns:1fr}.footer-info{grid-template-columns:1fr;gap:24px}nav{position:sticky;top:0;padding:9px 12px;gap:7px;flex-wrap:nowrap}.mobile-menu-btn{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}.links{display:none;position:absolute;left:0;right:0;top:100%;background:var(--paper);border-bottom:1px solid var(--line);box-shadow:0 14px 30px #0002;padding:10px 14px;flex-direction:column;gap:0;z-index:60;max-height:70vh;overflow:auto}.links.mobile-open{display:flex}.links a{padding:14px 8px;border-bottom:1px solid var(--line);font-size:14px}.links a:last-child{border-bottom:0}.navsearch{display:none}.artist-paths{padding:50px 14px 10px}main{padding-left:4%;padding-right:4%}.hero{margin:0}.two,.stats{grid-template-columns:1fr}.modal{padding:8px}.box{width:100%;max-height:94vh}.form input,.form select,.form textarea{font-size:16px}.nike-profile-main{width:100%;object-fit:cover;border-radius:16px}}@media(max-width:600px){.signature-reference .body{min-height:0}.footer-info{grid-template-columns:1fr}.site-shell,.audience{padding:0 14px}.grid{grid-template-columns:1fr 1fr;gap:12px}.card img{height:180px}.card .body{padding:13px}.card h3{font-size:18px}.btn{width:100%;justify-content:center}.tier-card{padding:18px}.form{gap:10px}.logoImage{max-width:165px;max-height:44px}}@media(max-width:420px){.grid{grid-template-columns:1fr}.card img{height:230px}.hero h1{font-size:38px}.sectionhead h2{font-size:30px}}';
    document.head.appendChild(s);
  }

  /* Make the fix available before the second marketplace script calls currentUser. */
  setupMobileNav();
  addStyles();
  fixMarketplaceImages();
  removeDuplicatePeaceListings();
  const peaceObserver=new MutationObserver(removeDuplicatePeaceListings);
  peaceObserver.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setupLayout);
  else setupLayout();
  /* Expanded signature discovery + mixed Top 10. These are informational external profiles, not AfricanArtistShop sellers unless separately approved. */
  const AAS_SIGNATURES=[
    {name:'Ben Enwonwu',specialty:'Nigerian modernist · painter & sculptor',bio:'Pioneer of modern Nigerian art; documented by the Ben Enwonwu Foundation.',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Ben%20Enwonwu.jpg',url:'https://benenwonwufoundation.org/about/'},
    {name:'El Anatsui',specialty:'Ghanaian sculptor · Nigeria-based',bio:'Ghanaian sculptor whose long practice in Nigeria includes large-scale works made from reused materials.',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Artempo%20ElAnatsui.jpg',url:'https://elanatsui.art/biography'},
    {name:'Yinka Shonibare',specialty:'British-Nigerian contemporary artist',bio:'Artist born in London to Nigerian parents whose work explores Africa-Europe relationships.',image:'https://commons.wikimedia.org/wiki/Special:FilePath/YinkaShonibare2012.jpg',url:'https://www.npg.org.uk/schools-hub/yinka-shonibare-cbe-ra-by-sal-idriss'},
    {name:'Njideka Akunyili Crosby',specialty:'Nigerian-born contemporary artist',bio:'Los Angeles-based artist known for layered painting, drawing, photography and collage.',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Njideka%20Akunyili%20ed.jpg',url:'https://www.njidekaakunyilicrosby.com/about'},
    {name:'Bruce Onobrakpeya',specialty:'Nigerian printmaker · painter & sculptor',bio:'Nigerian artist known for experimental printmaking, painting and sculpture.',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Bruce%20Onobrakpeya%20The%20Pride%20of%20all%20nigerians.jpg',url:'https://arttwentyone.ng/artists/79-bruce-onobrakpeya/biography/'},
    {name:'Mufu Onifade',specialty:'Nigerian painter · Araism',bio:'Nigerian artist and originator of the Araism painting technique.',image:'https://i2.wp.com/www.johfrimartanddesign.com/wp-content/uploads/2018/09/Artist-Mufu-1.jpg?resize=600%2C600&ssl=1',url:'https://www.johfrimartanddesign.com/artists/'},
    {name:'Duke Asidere',specialty:'Nigerian contemporary painter',bio:'Nigerian contemporary artist known for figurative, landscape and contemporary painting.',image:'https://thewheatbakerlagos.com/oatchace/2024/11/Duke-Asidere.jpg',url:'https://dukeasidere.com/'},
    {name:'Chief Nike Okundaye',specialty:'Artist · textile artist · founder of Nike Art Gallery',bio:'Nigerian artist and founder of Nike Art Gallery.',image:'https://static.wixstatic.com/media/4bf3c6_86287c8864954058ae891282071e54c0~mv2.jpg/v1/fill/w_900%2Ch_790%2Cal_c%2Clg_1%2Cq_85/4bf3c6_86287c8864954058ae891282071e54c0~mv2.jpg',url:'https://nikeartgallery.ng/'}
  ];
  function addExpandedSignatureDirectory(){
    const ref=document.querySelector('#signature .signature-reference');
    if(!ref) return;
    const names=[...ref.querySelectorAll('h3')].map(x=>x.textContent.trim());
    AAS_SIGNATURES.forEach(x=>{
      if(names.includes(x.name)) return;
      const card=document.createElement('article');
      card.className='card signature-directory-card discovery-signature-card';
      card.innerHTML='<img class="directory-portrait" src="'+x.image+'" alt="'+x.name+'" loading="lazy"><div class="body"><span class="pill">SIGNATURE ARTIST</span><h3>'+x.name+'</h3><p class="muted">'+x.bio+'</p><a class="btn primary" href="'+x.url+'" target="_blank" rel="noopener">Profile / works</a></div>';
      const img=card.querySelector('img');
      img.onerror=function(){this.onerror=null;this.src='https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80';};
      ref.appendChild(card);
    });
  }
  const originalTopArtists=window.loadTopArtists;
  window.loadTopArtists=async function(){
    try{
      const a=await fetch('/api/top-artists',{credentials:'same-origin'}).then(r=>r.json());
      const market=a.map(x=>({kind:'market',...x}));
      const sig=AAS_SIGNATURES.slice(0,5).map(x=>({kind:'signature',...x,views:0,sales:0}));
      const out=[]; let m=0,s=0;
      while(out.length<10 && (m<market.length || s<sig.length)){
        if(s<sig.length) out.push(sig[s++]);
        if(out.length<10 && m<market.length) out.push(market[m++]);
      }
      while(out.length<10 && m<market.length) out.push(market[m++]);
      const grid=document.getElementById('topArtistsGrid');
      if(!grid) return;
      grid.innerHTML=out.slice(0,10).map((x,i)=>{
        if(x.kind==='signature') return '<article class="card toprank"><span class="rank">#'+(i+1)+'</span><img src="'+x.image+'" alt="'+x.name+'" loading="lazy"><div class="body"><span class="pill">Signature Artist</span><h3>'+x.name+'</h3><p class="muted">'+x.specialty+'</p><a class="btn primary" href="'+x.url+'" target="_blank" rel="noopener">Profile / works</a></div></article>';
        return '<article class="card toprank"><span class="rank">#'+(i+1)+'</span><img src="'+(x.image_url||'https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=900&q=80')+'" alt="'+x.name+'" loading="lazy"><div class="body"><span class="pill">'+(x.artist_type==='kid'?'Kid Artist':x.artist_type==='signature'?'Signature Artist':'Professional Artist')+'</span><h3>'+x.name+'</h3><p class="muted">'+(x.specialty||'African artist')+'</p><p class="mini-note">Today: '+x.views+' artwork views · '+x.sales+' sold</p><button class="btn primary" onclick="showArtistPage('+x.id+')">View artist & artworks</button></div></article>';
      }).join('');
    }catch(e){if(typeof originalTopArtists==='function') return originalTopArtists();}
  };
  setTimeout(()=>{addExpandedSignatureDirectory();window.loadTopArtists();},400);
  /* Fixed Top 10 artist discovery: a curated directory of documented African artists. */
  const AAS_TOP10=[
    {name:'Ben Enwonwu',specialty:'Nigerian modernist · painter & sculptor',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Ben%20Enwonwu.jpg',url:'https://benenwonwufoundation.org/about/'},
    {name:'El Anatsui',specialty:'Ghanaian sculptor · Nigeria-based',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Artempo%20ElAnatsui.jpg',url:'https://elanatsui.art/biography'},
    {name:'Yinka Shonibare',specialty:'British-Nigerian contemporary artist',image:'https://commons.wikimedia.org/wiki/Special:FilePath/YinkaShonibare2012.jpg',url:'https://www.npg.org.uk/schools-hub/yinka-shonibare-cbe-ra-by-sal-idriss'},
    {name:'Njideka Akunyili Crosby',specialty:'Nigerian-born contemporary artist',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Njideka%20Akunyili%20ed.jpg',url:'https://www.njidekaakunyilicrosby.com/about'},
    {name:'Bruce Onobrakpeya',specialty:'Nigerian printmaker · painter & sculptor',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Bruce%20Onobrakpeya%20The%20Pride%20of%20all%20nigerians.jpg',url:'https://arttwentyone.ng/artists/79-bruce-onobrakpeya/biography/'},
    {name:'Mufu Onifade',specialty:'Nigerian painter · Araism',image:'https://i2.wp.com/www.johfrimartanddesign.com/wp-content/uploads/2018/09/Artist-Mufu-1.jpg?resize=600%2C600&ssl=1',url:'https://www.johfrimartanddesign.com/artists/'},
    {name:'Duke Asidere',specialty:'Nigerian contemporary painter',image:'https://thewheatbakerlagos.com/oatchace/2024/11/Duke-Asidere.jpg',url:'https://dukeasidere.com/'},
    {name:'Peju Alatise',specialty:'Nigerian interdisciplinary artist',image:'https://static-assets.artlogic.net/c_limit%2Cf_auto%2Cfl_lossy%2Cq_auto/ws-koartspace/usr/library/main/images/peju-alatise_photo-1.jpg',url:'https://www.aicon.art/artists/peju-alatise'},
    {name:'Sokari Douglas Camp',specialty:'Nigerian-born sculptor · steel artist',image:'https://cdn.sanity.io/images/cxgd3urn/production/fe2ec2993b88eb487bcf2c19e84f6fc4564c758b-629x945.jpg?auto=format&fit=crop&h=1803&q=85&w=1200',url:'https://sokari.co.uk/'},
    {name:'Toyin Ojih Odutola',specialty:'Nigerian-born contemporary artist · drawing & works on paper',image:'https://commons.wikimedia.org/wiki/Special:FilePath/Toyin%20Ojih%20Odutola.jpg',url:'https://toyinojihodutola.com/'}
  ];
  function renderFixedTop10(){
    const grid=document.getElementById('topArtistsGrid'); if(!grid)return;
    const sub=document.querySelector('#top10 .sectionhead .sub'); if(sub) sub.textContent='Ten selected featured artists, with profile and works links for discovery.';
    grid.innerHTML=AAS_TOP10.map((x,i)=>'<article class="card toprank"><span class="rank">#'+(i+1)+'</span><img src="'+x.image+'" alt="'+x.name+'" loading="lazy"><div class="body"><span class="pill">FEATURED ARTIST</span><h3>'+x.name+'</h3><p class="muted">'+x.specialty+'</p><a class="btn primary" href="'+x.url+'" target="_blank" rel="noopener">Profile / works</a></div></article>').join('');
    grid.querySelectorAll('img').forEach((img,i)=>{img.onerror=function(){this.onerror=null;this.src='https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=900&q=80';};});
  }
  window.loadTopArtists=renderFixedTop10;
  /* Give every material its own relevant image query and a local fallback so broken remote images never show. */
  function fixSupplyImages(){
    const safeSvg=name=>{const label=String(name||'Art material').replace(/[<>&"']/g,''); const svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="100%" height="100%" fill="#f3eadb"/><text x="50%" y="45%" text-anchor="middle" font-family="Georgia,serif" font-size="46" font-weight="700" fill="#173f36">'+label.slice(0,26)+'</text><text x="50%" y="55%" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#756d61">AfricanArtistShop material</text></svg>';return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg)};
    document.querySelectorAll('#supplyGrid img').forEach(img=>{if(img.dataset.aasFixed)return;img.dataset.aasFixed='1';const name=img.alt||'Art material';img.onerror=function(){this.onerror=null;this.src=safeSvg(name)};});
  }
  setTimeout(()=>{renderFixedTop10();fixSupplyImages();},650);

})();
