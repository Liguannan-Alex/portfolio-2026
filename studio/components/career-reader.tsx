'use client';
import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Map, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { careerEntries, normalizeCareerIndex } from '@/lib/world/career';

type Props = { container: HTMLDivElement | null; index: number | null; onSelect: (index: number) => void; onClose: () => void; onMap: () => void };
export function CareerReader({ container, index, onSelect, onClose, onMap }: Props) {
  const yearsRef = useRef<HTMLElement>(null);
  useEffect(() => { yearsRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' }); }, [index]);
  const entry = index === null ? null : careerEntries[index];
  return <Dialog open={entry !== null} onOpenChange={open => { if (!open) onClose(); }}>
    {entry && <DialogContent container={container} className="career-reader" showCloseButton={false} onKeyDown={event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); event.stopPropagation(); onSelect(normalizeCareerIndex(entry.index + (event.key === 'ArrowRight' ? 1 : -1)));
      }
    }}>
      <header className="career-reader-top"><span>一段经历 · {String(entry.index + 1).padStart(2, '0')} / {careerEntries.length}</span><div><button onClick={onMap} aria-label="从履历打开地图"><Map size={18} /></button><button onClick={onClose} aria-label="关闭履历，继续驾驶"><X size={20} /></button></div></header>
      <nav ref={yearsRef} className="career-years" aria-label="履历年份">{careerEntries.map(item => <button key={item.id} data-career-index={item.index} aria-current={item.index === entry.index ? 'step' : undefined} onClick={() => onSelect(item.index)} aria-label={`阅读${item.year}：${item.title}`}>{item.year.replace(/\s/g, '')}</button>)}</nav>
      <div className="career-reader-body" key={entry.id}>
        <span className="career-period">{entry.year}</span>
        <DialogTitle className="career-reader-title">{entry.headline}</DialogTitle>
        <p className="career-place">{entry.place}</p>
        <div className="career-role"><span>我的角色</span><strong>{entry.role}</strong></div>
        <div className="career-result"><span>{entry.index === 9 ? '正在探索' : '这段经历留下了什么'}</span><DialogDescription>{entry.result}</DialogDescription></div>
        <details className="career-story"><summary>展开这段经历</summary><ol>{entry.details.map((line, i) => <li key={i}>{line}</li>)}</ol></details>
      </div>
      <footer className="career-reader-footer"><div><button onClick={() => onSelect(normalizeCareerIndex(entry.index - 1))} aria-label="上一段经历"><ArrowLeft size={18} /> 上一段</button><button onClick={() => onSelect(normalizeCareerIndex(entry.index + 1))} aria-label="下一段经历">下一段 <ArrowRight size={18} /></button></div><button className="career-return" onClick={onClose}>继续驾驶</button></footer>
    </DialogContent>}
  </Dialog>;
}
