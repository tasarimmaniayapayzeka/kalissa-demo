document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.querySelector('[data-menu-toggle]');
  const nav=document.querySelector('[data-nav]');
  if(toggle&&nav){
    toggle.addEventListener('click',()=>{
      const open=nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded',String(open));
      toggle.setAttribute('aria-label',open?'Menüyü kapat':'Menüyü aç');
    });
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&nav.classList.contains('is-open')){
        nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.focus();
      }
    });
  }

  const filters=document.querySelectorAll('[data-filter]');
  const query=document.querySelector('[data-search]');
  const cards=[...document.querySelectorAll('[data-service-card]')];
  const count=document.querySelector('[data-count]');
  const empty=document.querySelector('[data-empty]');
  let category='all';
  function normalize(s){return s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  function apply(){
    const q=normalize((query?.value||'').trim());let visible=0;
    cards.forEach(card=>{
      const cats=(card.dataset.categories||'').split('|');
      const match=(category==='all'||cats.includes(category))&&normalize(card.dataset.searchText||'').includes(q);
      card.hidden=!match;if(match)visible++;
    });
    if(count)count.textContent=`${visible} hizmet gösteriliyor`;
    if(empty)empty.style.display=visible?'none':'block';
    document.querySelectorAll('[data-category-section]').forEach(section=>{
      section.hidden=![...section.querySelectorAll('[data-service-card]')].some(x=>!x.hidden);
    });
  }
  filters.forEach(button=>button.addEventListener('click',()=>{
    category=button.dataset.filter;
    filters.forEach(b=>{b.classList.toggle('is-active',b===button);b.setAttribute('aria-pressed',String(b===button))});
    apply();
  }));
  query?.addEventListener('input',apply);
  if(cards.length)apply();

  const form=document.querySelector('[data-contact-form]');
  form?.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form),kind=data.get('bolum');
    const phone=kind==='Beauty & Wellness'?'905415432598':'902163488881';
    const msg=`Merhaba Kalissa, web sitenizden yazıyorum.\nAd: ${data.get('ad')}\nBölüm: ${kind}\nHizmet: ${data.get('hizmet')||'Belirtilmedi'}\nMesaj: ${data.get('mesaj')}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer');
  });
});
