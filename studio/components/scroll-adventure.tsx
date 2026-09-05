'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Compass, Pause, Play } from 'lucide-react';
import { clamp, sampleJourney } from '@/lib/adventure';

const stages = [
  { id: 'top', name: '薄暮出发', english: 'SKY ISLAND', image: 'island' },
  { id: 'tools', name: '夜航工坊', english: 'THE WORKSHOP', image: 'workshop' },
  { id: 'work', name: '月下图鉴', english: 'DUSK EXPEDITION', image: 'camp' },
  { id: 'about', name: '星夜营地', english: 'NIGHT CAMP', image: 'camp' },
];

export function ScrollAdventure() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);
  const world = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const progressText = useRef<HTMLOutputElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const restoreStage = useRef<number | null>(null);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let saved: string | null = null;
    try { saved = localStorage.getItem('piguannan-motion'); } catch { /* Storage can be disabled. */ }
    setEnabled(!preference.matches && saved !== 'off');
    setReady(true);
    const onPreference = () => setEnabled(!preference.matches);
    preference.addEventListener('change', onPreference);
    return () => preference.removeEventListener('change', onPreference);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.dataset.adventure = enabled ? 'on' : 'off';
    const sections = ['.hero', '#tools', '#work', '#about'].map(selector => document.querySelector<HTMLElement>(selector));
    let starts = [0, 0, 0, 0], total = 1, height = innerHeight, width = innerWidth;
    let target = scrollY, current = target, lastY = target, lastFrame = 0, frame = 0;
    let lastActive = -1, lastPercent = -1, direction = 1, speed = 0, modalOpen = false;
    let mx = 0, my = 0;
    const layers = world.current?.querySelectorAll<HTMLElement>('.world-layer');
    const ctx = canvas.current?.getContext('2d');
    const measure = () => {
      height = innerHeight; width = innerWidth;
      starts = sections.map(section => section ? section.getBoundingClientRect().top + scrollY : 0);
      total = document.documentElement.scrollHeight;
      if(canvas.current) { canvas.current.width = Math.ceil(width / 3); canvas.current.height = Math.ceil(height / 3); }
      target = scrollY;
    };
    const onScroll = () => { target = scrollY; };
    const onPointer = (event: PointerEvent) => {
      if(event.pointerType !== 'mouse') return;
      mx = (event.clientX / width - 0.5) * 12;
      my = (event.clientY / height - 0.5) * 8;
    };
    const onHash = () => { target = scrollY; current = target; };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) { current = scrollY; target = current; frame = requestAnimationFrame(tick); }
    };
    const particles = Array.from({ length: width < 760 ? 22 : 48 }, (_, i) => ({
      x: ((i * 43.37 + 17.19) % 100) / 100,
      y: ((i * 31.73 + 11.81) % 100) / 100,
      rate: 0.28 + (i % 7) * 0.12,
      size: i % 5 === 0 ? 2 : 1,
    }));
    function tick(time: number) {
      frame = requestAnimationFrame(tick);
      if (document.hidden || modalOpen || time - lastFrame < 30) return;
      lastFrame = time;
      const delta = target - current;
      current = enabled && Math.abs(delta) < height * 2 ? current + delta * 0.2 : target;
      if(Math.abs(target-current)<0.1) current=target;
      const moved = current - lastY;
      if(Math.abs(moved)>0.15) direction=moved>0?1:-1;
      speed += (Math.min(1, Math.abs(moved)/14)-speed)*0.2;
      lastY = current;
      const state=sampleJourney(current,starts,height,total);
      if(state.active!==lastActive) { lastActive=state.active;setActive(state.active);root.dataset.world=String(state.active); }
      const percent=Math.round(state.progress*100);
      if(percent!==lastPercent) {lastPercent=percent;if(progressText.current)progressText.current.textContent=`${String(percent).padStart(2,'0')}%`;}
      hud.current?.style.setProperty('--route-progress', String(state.progress));
      hud.current?.style.setProperty('--direction', String(direction));
      hud.current?.style.setProperty('--stride', `${enabled ? Math.abs(Math.sin(current / 22)) * Math.min(speed * 5, 4) : 0}px`);
      root.style.setProperty('--world-night',state.night.toFixed(3));
      world.current?.style.setProperty('--transition', String(state.transition));
      if(enabled) {
        layers?.forEach((layer,i)=> {
          const local=(current-starts[i])/height;
          const coverage = state.weights.slice(0,i+1).reduce((sum,w)=>sum+w,0);
          layer.style.opacity=String(coverage > 0 ? state.weights[i]/coverage : 0);
          const x = clamp(local,-1,2)* (i===0?-55:40) + mx;
          const y = clamp(local,-1,2)*-55 + my;
          const zoom = 1.05 + clamp(local,-1,2)*0.10;
          layer.style.setProperty('--camera-x',`${x.toFixed(2)}px`);
          layer.style.setProperty('--camera-y',`${y.toFixed(2)}px`);
          layer.style.setProperty('--camera-scale',zoom.toFixed(3));
        });
        world.current?.style.setProperty('--grid-offset',`${(current*0.2)%40}px`);
        sections.forEach((section,i)=>section?.style.setProperty('--scene-progress',String(clamp((current-starts[i]+height*.6)/(section.offsetHeight||1)))));
      }
      if(ctx && canvas.current) {
        const w=canvas.current.width,h=canvas.current.height;
        ctx.clearRect(0,0,w,h);
        if(enabled) {
          particles.forEach((p,i)=> {
            const x=(p.x*w+Math.sin(time*0.00015+p.y*20)*12-current*(0.011+p.rate*.005)+w*10)%w;
            const y=(p.y*h-time*0.003*p.rate-current*0.022+h*100)%h;
            ctx.globalAlpha=(0.26+Math.sin(time*0.001+i)*0.15)*(0.65+state.night*0.5);
            ctx.fillStyle=state.active===0?'#91e4e8':state.active===1?'#ffb768':state.active===2?'#ffc68a':'#91e4e8';
            ctx.fillRect(Math.round(x),Math.round(y),p.size,p.size);
          });
          ctx.globalAlpha=1;
        }
      }
    }
    measure();
    if (restoreStage.current !== null) {
      const section = sections[restoreStage.current];
      if(section) scrollTo({top: section.getBoundingClientRect().top + scrollY - 90, behavior: 'instant'});
      current = scrollY; target = current; lastY = current; restoreStage.current = null;
    }
    const observer = new ResizeObserver(measure);
    sections.forEach(section=>{if(section)observer.observe(section);});
    const modalObserver=new MutationObserver(()=>{modalOpen=!!document.querySelector('[role="dialog"][data-open]');});
    modalObserver.observe(document.body,{childList:true,subtree:true});
    addEventListener('scroll',onScroll,{passive:true});
    addEventListener('resize',measure,{passive:true});
    addEventListener('pointermove',onPointer,{passive:true});
    addEventListener('hashchange',onHash);
    addEventListener('pageshow',onHash);
    document.addEventListener('visibilitychange',onVisibility);
    frame=requestAnimationFrame(tick);
    return ()=> {
      cancelAnimationFrame(frame);observer.disconnect();modalObserver.disconnect();
      removeEventListener('scroll',onScroll);removeEventListener('resize',measure);removeEventListener('pointermove',onPointer);removeEventListener('hashchange',onHash);removeEventListener('pageshow',onHash);document.removeEventListener('visibilitychange',onVisibility);
      delete root.dataset.adventure;delete root.dataset.world;
    };
  },[enabled,ready]);

  const toggle = () => {
    const next = !enabled;
    restoreStage.current = active;
    setEnabled(next);
    try { localStorage.setItem('piguannan-motion', next ? 'on' : 'off'); } catch { /* Optional preference only. */ }
  };
  return <>
    <div className="adventure-world" ref={world} aria-hidden="true">
      {stages.map((stage,index)=><div className={`world-layer world-${index}`} key={stage.id} style={{opacity:index===0?1:0}}><div className="world-camera"><img src={`/images/nightflight/${stage.image}.png`} alt="" width={1536} height={1024}/></div><div className="world-light"/></div>)}
      <div className="world-scanlines"/><div className="world-transition"/><canvas ref={canvas} className="world-particles"/>
      <div className="world-vignette"/>
    </div>
    <aside className={`adventure-hud ${ready?'is-ready':''}`} ref={hud} aria-label="冒险路线">
      <div className="hud-status"><Compass size={17}/><span className="hud-world mono">WORLD 0{active+1}<strong>{stages[active].name}</strong></span><output ref={progressText} className="hud-percent mono" aria-label="页面旅程进度">00%</output></div>
      <nav className="journey-map" aria-label="跳转到冒险关卡"><div className="journey-track"/><span className="map-player" aria-hidden="true"><img src="/images/adventurer.png" alt="" width={1226} height={1283}/></span>{stages.map((stage,index)=><a key={stage.id} href={`#${stage.id}`} aria-label={stage.name} aria-current={active===index?'step':undefined} className={active===index?'current':''}><span className="map-node"/><span>{stage.name}</span></a>)}</nav>
      <button className="motion-toggle" onClick={toggle} aria-pressed={enabled} aria-label={enabled?'关闭场景动态，切换静态阅读':'开启滚动场景动态'}>{enabled?<Pause size={15}/>:<Play size={15}/>}<span>{enabled?'动态已开':'静态阅读'}</span></button>
    </aside>
    <div className="journey-side-note mono" aria-hidden="true"><ArrowDown size={14}/><span>SCROLL TO PLAY</span></div>
  </>;
}
