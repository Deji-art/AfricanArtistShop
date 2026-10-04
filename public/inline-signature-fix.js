(function(){
  function getCard(el){
    return el&&el.closest&&el.closest('#signature .signature-directory-card,#topArtistsGrid .toprank');
  }
  function getName(card){
    if(!card)return '';
    var h=card.querySelector('h3');
    return h?String(h.textContent||'').trim():'';
  }
  function cleanModal(){
    document.querySelectorAll('.signature-inline-profile a').forEach(function(a){a.remove();});
  }
  function openInside(name){
    if(typeof window.showSignatureProfile==='function'){
      window.showSignatureProfile(name);
      setTimeout(cleanModal,0);
      setTimeout(cleanModal,100);
      return true;
    }
    return false;
  }
  function hardStop(e){
    var target=e.target&&e.target.nodeType===1?e.target:e.target&&e.target.parentElement;
    var card=getCard(target);
    if(!card)return;
    var text=(target&&target.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    var isView=/view\s+(artist\s*\/\s*works|artist'?s?\s+works|works)/i.test(text) || !!(target&&target.closest&&target.closest('a[href]'));
    if(!isView)return;
    var name=getName(card);
    if(!name)return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    openInside(name);
  }
  document.addEventListener('click',hardStop,true);
  function normalizeCard(card){
    if(!card)return;
    var body=card.querySelector('.body')||card;
    body.querySelectorAll('a,button').forEach(function(el){el.remove();});
    var b=document.createElement('button');
    b.type='button';
    b.className='btn primary';
    b.textContent='View artist / works';
    b.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      openInside(getName(card));
    });
    body.appendChild(b);
  }
  function apply(){
    document.querySelectorAll('#signature .signature-directory-card,#topArtistsGrid .toprank').forEach(normalizeCard);
    cleanModal();
  }
  function hook(){
    if(typeof window.showSignatureProfile==='function'&&!window.__aasInlineWrapped){
      var original=window.showSignatureProfile;
      window.showSignatureProfile=function(name){
        original(name);
        setTimeout(cleanModal,0);
        setTimeout(cleanModal,100);
      };
      window.__aasInlineWrapped=true;
    }
    apply();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
  [200,500,1000,2000].forEach(function(ms){setTimeout(hook,ms);});
  new MutationObserver(function(){apply();}).observe(document.body,{childList:true,subtree:true});
})();