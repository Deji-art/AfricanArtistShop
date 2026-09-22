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
        '<div class="footer-col" id="footer-contact"><div class="footer-kicker">CONTACT US</div><h3>We are here to help.</h3><p>Orders, artist applications, training enquiries and delivery questions can be sent to us.</p><p><b>Phone / WhatsApp:</b><br><a href="tel:+2349075452255">+234 907 545 2255</a></p><p><b>Email:</b><br><a href="mailto:hello@africanartistshop.com">hello@africanartistshop.com</a></p></div>'+
        '<div class="footer-col" id="footer-social"><div class="footer-kicker">SOCIAL MEDIA</div><h3>Follow AfricanArtistShop</h3><p><a href="https://instagram.com/Africanartist_shop" target="_blank" rel="noopener">Instagram · @Africanartist_shop</a></p><p><a href="https://facebook.com/Africanartistshop" target="_blank" rel="noopener">Facebook · Africanartistshop</a></p><p class="footer-note">Connect with us for new artwork, artist stories, materials and marketplace updates.</p></div>';
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
      ['https://images.weserv.nl/?url=back.vantaart.com%2Fuploads%2Fimages%2F3569d17946031a3d5207b1fc31c935fc.webp&w=700&q=82','Mufu Onifade'],
      ['https://images.weserv.nl/?url=thewheatbakerlagos.com%2Foatchace%2F2024%2F11%2FDuke-Asidere.jpg&w=700&q=82','Duke Asidere'],
      ['https://images.weserv.nl/?url=npr.brightspotcdn.com%2Fdims3%2Fdefault%2Fstrip%2Ffalse%2Fcrop%2F2857x4000%2B0%2B0%2Fresize%2F2857x4000%2521%2F%3Furl%3Dhttp%253A%252F%252Fnpr-brightspot.s3.amazonaws.com%252F5b%252F27%252Fc2d89f0a49178985bd1f5feeb596%252Fbruce-onobrakpeya-artist-13.jpg&w=700&q=82','Bruce Onobrakpeya']
    ];
    directoryCards.forEach((card,i)=>{
      const p=portraits[i];
      if(!p || card.querySelector('.directory-portrait')) return;
      const img=document.createElement('img');
      img.className='directory-portrait'; img.src=p[0]; img.alt=p[1]+' portrait'; img.loading='lazy'; img.referrerPolicy='no-referrer';
      img.onerror=function(){if(this.dataset.fallback){this.style.display='none';return}this.dataset.fallback='1';this.src='https://back.vantaart.com/uploads/images/5b99be3e191f60c420084af5b098899b.jpg'};
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
    if(ref && !document.getElementById('nikeSignatureCard')){
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
    const mo=new MutationObserver(fix);
    mo.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('load',fix);
  }

  function addImageSafety(){
    if(document.getElementById('aasImageSafety')) return;
    const s=document.createElement('style'); s.id='aasImageSafety';
    s.textContent='img{max-width:100%;height:auto;box-sizing:border-box}main img,.card img,.grid img,.panel img,.artist-collection-grid img,.professional-artist-card img,.signature-reference img{max-width:100%;height:auto}.card,.panel,.grid,.artist-collection-grid,.professional-artist-card,.signature-directory-card{min-width:0;max-width:100%}.grid .card img,.artist-collection-grid .card img{width:100%;height:auto;object-fit:contain;object-position:center}.professional-artist-card .artist-card-image{width:100%;height:auto;max-height:360px;object-fit:contain;background:#f1eadf}.signature-reference .directory-portrait{width:100%!important;height:250px!important;object-fit:cover!important}@media(max-width:700px){img{max-width:100%!important}.professional-artist-card .artist-card-image{max-height:300px}.signature-reference .directory-portrait{height:210px!important}.artist-collection-grid{grid-template-columns:1fr!important}.artist-collection-grid .card img{max-height:none!important}.card,.panel{overflow:hidden}}';
    document.head.appendChild(s);
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
    s.textContent=
      '.artist-paths{max-width:1240px;margin:20px auto 0;padding:70px 22px 25px}.artist-path-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.artist-path-card{background:var(--paper);border:1px solid var(--line);border-radius:22px;padding:26px;box-shadow:var(--shadow);display:flex;flex-direction:column;min-height:290px}.artist-path-card.kid-path{background:linear-gradient(135deg,#fff8e8,#f7ead2)}.artist-path-card.pro-path{background:linear-gradient(135deg,#eef5f0,#dceae4)}.artist-path-card.signature-path{background:linear-gradient(135deg,#f5f0ff,#ebe2f8)}.path-icon{font-size:30px;margin-bottom:14px}.artist-path-card h3{font:700 29px Georgia,serif;margin:9px 0}.artist-path-card p{line-height:1.65}.path-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:auto;padding-top:18px}.path-actions .btn{width:100%;text-align:center}.footer-info{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:28px;margin:0 0 35px;padding-bottom:32px;border-bottom:1px solid #ffffff22}.footer-col{min-width:0}.footer-kicker{font-size:11px;letter-spacing:2px;font-weight:900;color:#e5a23b;margin-bottom:10px}.footer-col h3{font:700 24px Georgia,serif;color:#fff;margin:0 0 12px}.footer-col p{color:#aaa;line-height:1.65;margin:8px 0}.footer-col a{color:#fff}.footer-col a:hover{color:#e5a23b}.footer-note{font-size:13px}.nike-card img{height:260px;width:100%;object-fit:cover}.directory-portrait{display:block!important;width:100%!important;height:250px!important;object-fit:cover!important;border-radius:16px 16px 0 0;aspect-ratio:4/3}.signature-reference .signature-directory-card{overflow:hidden;min-width:0}.signature-reference img,.nike-card img{max-width:100%;display:block}@media(max-width:700px){.directory-portrait{height:210px!important}.signature-reference{grid-template-columns:1fr!important}.signature-reference .signature-directory-card{width:100%}}.grid img{max-width:100%;}.card img{max-width:100%;display:block;}.grid .card img{width:100%;height:auto;object-fit:cover;}@media(max-width:700px){.grid .card img{max-height:260px;}.nike-profile{display:grid;grid-template-columns:280px 1fr;gap:22px;align-items:start}.nike-profile-main{width:100%;height:360px;object-fit:cover;border-radius:16px}.nike-work-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}.nike-work-grid img{width:100%;height:150px;object-fit:cover;border-radius:12px}.nike-profile .actions{display:flex;gap:10px;flex-wrap:wrap}@media(max-width:700px){.nike-profile{grid-template-columns:1fr}.nike-profile-main{height:280px}.nike-work-grid{grid-template-columns:1fr 1fr}.nike-work-grid img{height:130px}}@media(max-width:900px){.artist-path-grid{grid-template-columns:1fr 1fr}.footer-info{grid-template-columns:1fr 1fr}}@media(max-width:700px){nav{position:sticky;top:0;padding:9px 12px;gap:7px;flex-wrap:nowrap}.mobile-menu-btn{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}.links{display:none;position:absolute;left:0;right:0;top:100%;background:var(--paper);border-bottom:1px solid var(--line);box-shadow:0 14px 30px #0002;padding:10px 14px;flex-direction:column;gap:0;z-index:60;max-height:70vh;overflow:auto}.links.mobile-open{display:flex}.links a{padding:14px 8px;border-bottom:1px solid var(--line);font-size:14px}.links a:last-child{border-bottom:0}.navsearch{display:none}.artist-paths{padding:50px 14px 10px}.artist-path-grid{grid-template-columns:1fr}.artist-path-card{min-height:0}.path-actions{grid-template-columns:1fr}.footer-info{grid-template-columns:1fr;gap:24px}main{padding-left:4%;padding-right:4%}.hero{margin:0}.two,.stats{grid-template-columns:1fr}.modal{padding:8px}.box{width:100%;max-height:94vh}.form input,.form select,.form textarea{font-size:16px}}';
    document.head.appendChild(s);
  }

  /* Make the fix available before the second marketplace script calls currentUser. */
  setupMobileNav();
  addStyles();
  addImageSafety();
  fixMarketplaceImages();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setupLayout);
  else setupLayout();
})();
