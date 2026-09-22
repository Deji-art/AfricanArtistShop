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

  function setupLayout(){
    const about=document.getElementById('about');
    const contact=document.getElementById('contact');
    const signature=document.getElementById('signature');
    const footer=document.querySelector('footer');
    if(!footer) return;

    /* Remove the old early About/Contact blocks from the main flow. */
    if(about) about.style.display='none';
    if(contact) contact.style.display='none';

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
      const pro=document.getElementById('proartists');
      if(pro && pro.parentNode) pro.parentNode.insertBefore(section,signature||pro.nextSibling);
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
      if(heading && !heading.querySelector('.signature-only-note')){
        const note=document.createElement('div');
        note.className='signature-only-note tier-card';
        note.innerHTML='<span class="pill">SIGNATURE</span><h3>Renowned / Signature</h3><div class="fee">FREE</div><ul><li>8–10 works</li><li>For invited or approved artists</li><li>Dedicated signature shop</li></ul><button class="btn primary" type="button" onclick="openArtistApplySignature()">Register as Signature Artist</button>';
        heading.appendChild(note);
      }
    }
  }

  function addStyles(){
    if(document.getElementById('aasCoordinatedStyles')) return;
    const s=document.createElement('style');
    s.id='aasCoordinatedStyles';
    s.textContent=
      '.artist-paths{max-width:1240px;margin:20px auto 0;padding:70px 22px 25px}.artist-path-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.artist-path-card{background:var(--paper);border:1px solid var(--line);border-radius:22px;padding:26px;box-shadow:var(--shadow);display:flex;flex-direction:column;min-height:290px}.artist-path-card.kid-path{background:linear-gradient(135deg,#fff8e8,#f7ead2)}.artist-path-card.pro-path{background:linear-gradient(135deg,#eef5f0,#dceae4)}.artist-path-card.signature-path{background:linear-gradient(135deg,#f5f0ff,#ebe2f8)}.path-icon{font-size:30px;margin-bottom:14px}.artist-path-card h3{font:700 29px Georgia,serif;margin:9px 0}.artist-path-card p{line-height:1.65}.path-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:auto;padding-top:18px}.path-actions .btn{width:100%;text-align:center}.footer-info{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:28px;margin:0 0 35px;padding-bottom:32px;border-bottom:1px solid #ffffff22}.footer-col{min-width:0}.footer-kicker{font-size:11px;letter-spacing:2px;font-weight:900;color:#e5a23b;margin-bottom:10px}.footer-col h3{font:700 24px Georgia,serif;color:#fff;margin:0 0 12px}.footer-col p{color:#aaa;line-height:1.65;margin:8px 0}.footer-col a{color:#fff}.footer-col a:hover{color:#e5a23b}.footer-note{font-size:13px}@media(max-width:900px){.artist-path-grid{grid-template-columns:1fr 1fr}.footer-info{grid-template-columns:1fr 1fr}}@media(max-width:600px){.artist-paths{padding:50px 14px 10px}.artist-path-grid{grid-template-columns:1fr}.artist-path-card{min-height:0}.path-actions{grid-template-columns:1fr}.footer-info{grid-template-columns:1fr;gap:24px}}';
    document.head.appendChild(s);
  }

  /* Make the fix available before the second marketplace script calls currentUser. */
  addStyles();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setupLayout);
  else setupLayout();
})();
