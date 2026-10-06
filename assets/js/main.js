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
  // İletişim formu: bölüm seçilince o bölümün hizmetleri çoklu seçim olarak açılır (6 Eki)
  const hizKut=form?.querySelector('[data-hiz]');
  form?.querySelector('[name="bolum"]')?.addEventListener('change',e=>{
    if(!hizKut)return;const v=e.target.value;hizKut.hidden=!v;
    hizKut.querySelectorAll('[data-bolum]').forEach(g=>{const on=g.dataset.bolum===v;g.hidden=!on;if(!on)g.querySelectorAll('input').forEach(i=>{i.checked=false})});
  });
  // Blog detay: içindekilerden bir başlığa gidilince kapalı bölüm açılır
  document.querySelectorAll('.bl-icd a').forEach(a=>a.addEventListener('click',()=>{const t=document.querySelector(a.getAttribute('href'));if(t&&t.tagName==='DETAILS')t.open=true}));
  form?.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form),kind=data.get('bolum');
    const phone=kind==='Beauty & Wellness'?'905415432598':'902163488881';
    const msg=`Merhaba Kalissa, web sitenizden yazıyorum.\nAd: ${data.get('ad')}\nBölüm: ${kind}\nHizmet: ${data.getAll('hizmet').join(', ')||'Belirtilmedi'}\nMesaj: ${data.get('mesaj')}`;
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
    const mobil=()=>window.innerWidth<900;
    const kapat=()=>{
      sk.forEach(b=>{b.setAttribute('aria-selected','false');b.classList.remove('is-aktif')});
      sk[0].tabIndex=0;pn.forEach(x=>{x.hidden=true});kap.classList.add('is-kapali');
    };
    window.addEventListener('resize',()=>{if(!mobil()&&kap.classList.contains('is-kapali')){kap.classList.remove('is-kapali');sec(0)}});
    sk.forEach((b,i)=>{
      b.addEventListener('click',()=>{
        if(mobil()&&b.classList.contains('is-aktif')){kapat();return}
        kap.classList.remove('is-kapali');sec(i);
      });
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
  // Kategori önerisi A: hizmet kartlarını süz (6 Eki)
  document.querySelectorAll('.ka-filtre').forEach(f=>{
    const bs=[...f.querySelectorAll('[data-filtre]')],ks=[...document.querySelectorAll('.ka-kart')];
    bs.forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.filtre;bs.forEach(x=>x.classList.toggle('is-aktif',x===b));ks.forEach(k=>{k.hidden=!(v==='hepsi'||k.dataset.grup===v)})}));
  });
  // Kategori önerisi B: satırın üzerine gelince soldaki görsel o hizmetinkine geçer
  document.querySelectorAll('.kb-liste').forEach(l=>{
    const g=[...l.querySelectorAll('.kb-sahne-g')],ad=l.querySelector('.kb-sahne-ad');if(g.length<2)return;let on=0;
    l.querySelectorAll('.kb-satir').forEach(r=>{const git=()=>{if(g[on].getAttribute('src')===r.dataset.img)return;const y=1-on;g[y].src=r.dataset.img;g[y].classList.add('is-on');g[on].classList.remove('is-on');on=y;if(ad)ad.textContent=r.dataset.ad};r.addEventListener('mouseenter',git);r.addEventListener('focus',git)});
  });
  // Beauty 4: 3B karusel (6 Eki). Ortadaki kart öne çıkar; ok, nokta, kaydırma, klavye; yandaki karta tıklayınca öne gelir
  document.querySelectorAll('[data-kar]').forEach(k=>{
    const ks=[...k.querySelectorAll('.kar-k')],n=ks.length,nok=[...k.querySelectorAll('.kar-nok button')],say=k.querySelector('.kar-say b');
    let a=0,surukle=false,x0=null;
    const ciz=()=>{
      ks.forEach((el,i)=>{let o=i-a;if(o>n/2)o-=n;if(o<-n/2)o+=n;const m=Math.abs(o);
        el.style.setProperty('--o',o);el.style.setProperty('--m',m);el.style.zIndex=String(20-m);
        el.classList.toggle('is-on',o===0);el.classList.toggle('is-uzak',m>2);el.tabIndex=o===0?0:-1;el.setAttribute('aria-hidden',o===0?'false':'true')});
      nok.forEach((b,i)=>{b.classList.toggle('is-on',i===a);b.setAttribute('aria-current',i===a?'true':'false')});
      if(say)say.textContent=String(a+1).padStart(2,'0');
    };
    const git=i=>{a=(i+n)%n;ciz()};
    k.querySelector('[data-kar-geri]').addEventListener('click',()=>git(a-1));
    k.querySelector('[data-kar-ileri]').addEventListener('click',()=>git(a+1));
    nok.forEach((b,i)=>b.addEventListener('click',()=>git(i)));
    ks.forEach((el,i)=>el.addEventListener('click',e=>{if(surukle){e.preventDefault();surukle=false;return}if(i!==a){e.preventDefault();git(i)}}));
    k.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();git(a-1)}if(e.key==='ArrowRight'){e.preventDefault();git(a+1)}});
    const sahne=k.querySelector('.kar-sahne');
    sahne.addEventListener('pointerdown',e=>{x0=e.clientX;surukle=false});
    sahne.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>40){surukle=true;git(a+(dx<0?1:-1))}});
    sahne.addEventListener('dragstart',e=>e.preventDefault());
    ciz();k.classList.add('is-hazir');
  });
  // Dokunmatik ekranda üzerine gelme yok: kaydırırken ekranın ortasına gelen madde kendiliğinden öne çıkar (6 Eki)
  if(matchMedia('(hover: none)').matches&&'IntersectionObserver' in window){
    document.querySelectorAll('.bt-adim,.ab2-oz,.ab3-oz ul,.p-hk1 .feats,.ka-oz').forEach(g=>{
      const og=[...g.children];
      const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)og.forEach(o=>o.classList.toggle('is-vurgu',o===e.target))})},{rootMargin:'-42% 0px -42% 0px'});
      og.forEach(o=>io.observe(o));
    });
  }
});
