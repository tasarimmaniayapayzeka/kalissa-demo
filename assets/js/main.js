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
  // Fit detay: sayfa içi gezinmede görünen bölümün sekmesi işaretlenir
  const fdnav=document.querySelector('[data-fdnav]');
  if(fdnav){
    const sekmeler=[...fdnav.querySelectorAll('a[href^="#"]')];
    const bolumler=sekmeler.map(a=>document.getElementById(a.getAttribute('href').slice(1)));
    let bekliyor=false;
    const isaretle=()=>{
      bekliyor=false;let aktif=0;const esik=window.innerHeight*.35;
      bolumler.forEach((el,i)=>{if(el&&el.getBoundingClientRect().top<=esik)aktif=i});
      sekmeler.forEach((a,i)=>{a.classList.toggle('is-aktif',i===aktif);if(i===aktif)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});
    };
    window.addEventListener('scroll',()=>{if(!bekliyor){bekliyor=true;requestAnimationFrame(isaretle)}},{passive:true});
    isaretle();
  }
  // Fit detay önerileri: rehber içindekilerinde görünen başlık işaretlenir
  const toc=document.querySelector('[data-toc]');
  if(toc){
    const tl=[...toc.querySelectorAll('a[href^="#"]')];
    const tb=tl.map(a=>document.getElementById(a.getAttribute('href').slice(1)));
    let tbek=false;
    const tisa=()=>{
      tbek=false;let ak=0;const es=window.innerHeight*.4;
      tb.forEach((el,i)=>{if(el&&el.getBoundingClientRect().top<=es)ak=i});
      tl.forEach((a,i)=>a.classList.toggle('is-aktif',i===ak));
    };
    window.addEventListener('scroll',()=>{if(!tbek){tbek=true;requestAnimationFrame(tisa)}},{passive:true});
    tisa();
  }
  // Fit detay önerileri: "Devamını oku" (metin sayfada hep var; kapalıyken yalnız kısaltılmış görünür)
  document.querySelectorAll('[data-devam]').forEach(kap=>{
    const bt=kap.querySelector('.fd-dv-bt'),m=kap.querySelector('.fd-dv-metin');
    if(!bt||!m)return;
    const yazi=bt.querySelector('span');
    bt.addEventListener('click',()=>{
      const ac=!kap.classList.contains('is-acik');
      if(ac){
        m.style.maxHeight=m.scrollHeight+'px';kap.classList.add('is-acik');
        const bitti=e=>{if(e.propertyName==='max-height'){m.style.maxHeight='none';m.removeEventListener('transitionend',bitti)}};
        m.addEventListener('transitionend',bitti);
      }else{
        m.style.maxHeight=m.scrollHeight+'px';void m.offsetHeight;m.style.maxHeight='';kap.classList.remove('is-acik');
        if(kap.getBoundingClientRect().top<0)kap.scrollIntoView({behavior:'smooth',block:'start'});
      }
      bt.setAttribute('aria-expanded',String(ac));
      if(yazi)yazi.textContent=ac?'Daha az göster':'Devamını oku';
    });
  });
  // Fit detay önerisi B1: sekmeli rehber (ok tuşlarıyla da gezilir)
  document.querySelectorAll('[data-sekmeli]').forEach(kap=>{
    const sk=[...kap.querySelectorAll('[role="tab"]')],pn=[...kap.querySelectorAll('[role="tabpanel"]')];
    if(!sk.length)return;
    const sec=(i,odak)=>{
      sk.forEach((b,j)=>{const a=j===i;b.setAttribute('aria-selected',String(a));b.tabIndex=a?0:-1;b.classList.toggle('is-aktif',a)});
      pn.forEach((x,j)=>{x.hidden=j!==i});
      if(odak)sk[i].focus({preventScroll:true});
      if(window.innerWidth<900)sk[i].scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
    };
    sk.forEach((b,i)=>{
      b.addEventListener('click',()=>sec(i));
      b.addEventListener('keydown',e=>{
        const n=sk.length;let j=null;
        if(e.key==='ArrowDown'||e.key==='ArrowRight')j=(i+1)%n;
        if(e.key==='ArrowUp'||e.key==='ArrowLeft')j=(i-1+n)%n;
        if(e.key==='Home')j=0;
        if(e.key==='End')j=n-1;
        if(j!==null){e.preventDefault();sec(j,true)}
      });
    });
    kap.querySelectorAll('[data-sonraki]').forEach(a=>a.addEventListener('click',e=>{
      e.preventDefault();const i=+a.dataset.sonraki;sec(i,true);
      const g=kap.querySelector('.fd-tb-g');
      if(g.getBoundingClientRect().top<0)g.scrollIntoView({behavior:'smooth',block:'start'});
    }));
    pn.forEach((x,j)=>{x.hidden=j!==0});
    kap.classList.add('is-hazir');
  });
});
