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
    /* The directory already contains the signature/reference artists, so hide the empty API grid above it. */
    const signatureGrid=document.getElementById('signatureGrid');
    if(signatureGrid){ signatureGrid.innerHTML=''; signatureGrid.style.display='none'; }
    const sigIntro=document.querySelector('#signature .sectionhead:first-child .sub');
    if(sigIntro) sigIntro.textContent='Approved and invited signature artists are presented below with portraits and links to their official or gallery pages.';

    /* Add portraits to the existing signature-directory cards. */
    const directoryCards=document.querySelectorAll('#signature .signature-reference .signature-directory-card');
    const portraits=[
      ['https://back.vantaart.com/uploads/images/5b99be3e191f60c420084af5b098899b.jpg','Mufu Onifade'],
      ['https://thewheatbakerlagos.com/oatchace/2024/11/Duke-Asidere.jpg','Duke Asidere'],
      ['https://eu-images.contentstack.com/v3/assets/bltacf39601912ccb86/bltd34b4ecf4ae42318/633ff5ab60364e0f6d9ffe5d/Bruce_Onobrakpeya.jpg?auto=webp','Bruce Onobrakpeya']
    ];
    directoryCards.forEach((card,i)=>{
      const p=portraits[i];
      if(!p || card.querySelector('.directory-portrait')) return;
      const img=document.createElement('img');
      img.className='directory-portrait'; img.src=p[0]; img.alt=p[1]+' portrait'; img.loading='lazy'; img.referrerPolicy='no-referrer';
      card.insertBefore(img,card.firstChild);
    });

    /* Make the contact email open Gmail compose. */
    document.querySelectorAll('#footer-contact a[href^="mailto:"]').forEach(a=>{
      const email=a.getAttribute('href').slice(7);
      a.href='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(email);
      a.target='_blank'; a.rel='noopener'; a.textContent=email+' · Open Gmail';
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
  s.textContent='.directory-portrait{display:block!important;width:100%!important;height:250px!important;object-fit:cover!important;border-radius:16px 16px 0 0}.signature-reference .signature-directory-card{overflow:hidden}.nike-card img{height:260px;width:100%;object-fit:cover}@media(max-width:700px){.directory-portrait{height:210px!important}.signature-reference .signature-directory-card{width:100%}.signature-reference{grid-template-columns:1fr!important}}';
  document.head.appendChild(s);
  }

  /* Make the fix available before the second marketplace script calls currentUser. */
  setupMobileNav();
  addStyles();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setupLayout);
  else setupLayout();
})();
