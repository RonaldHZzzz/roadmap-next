'use client';
import { useEffect, useState, useRef } from 'react';
import Sortable from 'sortablejs';

function escHtml(str: any) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function Roadmap() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState('personal');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('tab') || 'personal';
    setTab(t);
    loadData(t);
  }, []);

  const loadData = async (t: string) => {
    const res = await fetch(`/api/data?tab=${t}`);
    const d = await res.json();
    setData(d);
  };

  const toast = () => {
    const t = document.getElementById('toast');
    if (t) {
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 1500);
    }
  };

  const apiCall = async (url: string, method: string, body?: any) => {
    await fetch(url + `?tab=${tab}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body && { body: JSON.stringify(body) })
    });
    toast();
    if (method !== 'PUT' || url.includes('reorder')) {
      await loadData(tab);
    }
  };

  const updateHeader = () => {
    const isPersonal = tab === 'personal';
    document.title = isPersonal ? "Roadmap Personal" : "Roadmap Digitalización";
    return (
      <header className="text-center mb-6 pb-4 border-b-2 border-border shrink-0">
        <p className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1">Siemens S.A. El Salvador · Digitalización RC-SV DI</p>
        <h1 className="text-xl font-black text-primary tracking-wide mb-0.5">
          {isPersonal ? "ROADMAP DE CRECIMIENTO PERSONAL" : "ROADMAP DE DIGITALIZACIÓN"}
        </h1>
        <p className="text-xs text-muted-foreground mb-4">Ronald Hernández Ramírez &nbsp;·&nbsp; Octubre 2026 – Octubre 2027</p>
        <div className="flex justify-center gap-4 mb-2 mt-2">
          <button onClick={() => { setTab('personal'); window.history.pushState({}, '', '?tab=personal'); loadData('personal'); }} className={`px-6 py-2 rounded-full text-[11px] uppercase tracking-widest font-black border-2 transition-all ${isPersonal ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary'}`}>👨‍💻 Crecimiento Personal</button>
          <button onClick={() => { setTab('digital'); window.history.pushState({}, '', '?tab=digital'); loadData('digital'); }} className={`px-6 py-2 rounded-full text-[11px] uppercase tracking-widest font-black border-2 transition-all ${!isPersonal ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary'}`}>🏭 Área de Digitalización</button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">💡 Haz clic para editar textos y fechas · Arrastra tarjetas para reordenar en cualquier dirección</p>
      </header>
    );
  };

  useEffect(() => {
    if (!data) return;
    const instances: any[] = [];
    document.querySelectorAll('.phase-items').forEach(container => {
      instances.push(new Sortable(container as HTMLElement, {
        group: 'shared',
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        handle: '.item',
        onEnd: async () => {
          const updates: any[] = [];
          document.querySelectorAll('.phase-items').forEach(phaseContainer => {
            const phaseId = (phaseContainer as HTMLElement).dataset.phaseId;
            phaseContainer.querySelectorAll('.item').forEach((itemEl, idx) => {
              updates.push({ id: (itemEl as HTMLElement).dataset.itemId, phase_id: phaseId, order_num: idx });
            });
          });
          await apiCall('/api/items/reorder', 'PUT', updates);
        }
      }));
    });

    const phasesContainer = document.getElementById('phases-container');
    if (phasesContainer) {
      instances.push(new Sortable(phasesContainer, {
        animation: 150,
        handle: '.phase-header',
        ghostClass: 'sortable-ghost',
        direction: 'horizontal',
        onEnd: async () => {
          const updates: any[] = [];
          document.querySelectorAll('.phase-col').forEach((col, idx) => {
            updates.push({ id: (col as HTMLElement).dataset.colId, order_num: idx });
          });
          await apiCall('/api/phases/reorder', 'PUT', updates);
        }
      }));
    }

    return () => instances.forEach(i => i.destroy());
  }, [data]);

  const Editable = ({ value, onSave, className, field }: { value: string, onSave: (v: string) => void, className: string, field?: string }) => {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value);
    return editing ? (
      <input autoFocus className={`editable-text bg-background text-foreground ring-1 ring-primary px-1 rounded-sm w-full outline-none ${className}`} value={val} onChange={e => setVal(e.target.value)} onBlur={() => { setEditing(false); if(val !== value) onSave(val); }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if(e.key === 'Escape') setEditing(false); }} />
    ) : (
      <div onClick={() => setEditing(true)} className={`cursor-text border border-transparent hover:border-border/50 px-1 rounded ${className}`}>{val}</div>
    );
  };

  if (!data) return <div className="p-4 mx-auto font-sans min-h-screen text-white bg-[#0a0a1a]">Cargando...</div>;

  return (
    <div className="p-4 mx-auto w-full overflow-x-hidden font-sans flex flex-col min-h-screen max-w-[1800px] bg-[#0a0a1a] text-white">
      {updateHeader()}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-4 mb-2">
          <button className="flex items-center gap-1 px-3 py-1 border border-dashed border-border rounded text-muted-foreground text-[10px] hover:text-primary hover:border-primary hover:bg-primary/5 transition-all" onClick={() => apiCall('/api/phases', 'POST', {})}>+ Agregar Fase (Columna)</button>
        </div>
        <div id="phases-container" className="flex gap-3 mb-16 items-stretch w-full shrink-0 h-[580px] overflow-x-auto snap-x pb-2">
          {data.phases?.map((p: any, isLast: boolean) => (
            <div key={p.id} data-col-id={p.id} className={`phase-col min-w-[280px] flex-1 rounded-lg p-2.5 flex flex-col relative transition-colors shadow-sm snap-center group ${p.name === 'META' ? 'border-primary border bg-primary/5' : 'border border-border bg-card'}`}>
              <button className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded px-1.5 py-0.5 text-[10px] transition-colors opacity-0 group-hover:opacity-100 z-10" onClick={() => confirm('¿Eliminar fase?') && apiCall(`/api/phases/${p.id}`, 'DELETE')}>✕</button>
              <div className="mb-2.5 phase-header cursor-grab active:cursor-grabbing hover:bg-white/5 rounded px-1 -mx-1 transition-colors pb-1 border-b border-transparent hover:border-border/50">
                <Editable value={p.name} onSave={(v) => apiCall(`/api/phases/${p.id}`, 'PUT', {name:v})} className="text-[11px] font-black tracking-wider text-primary mb-0.5 leading-none" />
                <Editable value={p.period} onSave={(v) => apiCall(`/api/phases/${p.id}`, 'PUT', {period:v})} className="text-[12px] font-bold text-foreground leading-tight" />
                <Editable value={p.subtitle || ''} onSave={(v) => apiCall(`/api/phases/${p.id}`, 'PUT', {subtitle:v})} className="text-[10px] font-semibold text-muted-foreground mt-0.5 leading-none" />
              </div>
              <div className="phase-items flex-1 overflow-y-auto pr-1 -mr-1 min-h-[50px]" data-phase-id={p.id}>
                {p.items?.map((i: any) => (
                  <div key={i.id} data-item-id={i.id} className={`item flex items-start gap-1.5 p-1.5 mb-1.5 rounded border-l-2 hover:bg-muted/30 cursor-grab active:cursor-grabbing ${i.category==='course'?'border-primary bg-primary/5':i.category==='gap'?'border-destructive bg-destructive/10':'border-muted bg-background/20'}`}>
                    <select className="cat-select text-[9px] w-4 h-4 mt-0.5 bg-background border border-border text-muted-foreground rounded cursor-pointer shrink-0 outline-none" value={i.category} onChange={e => apiCall(`/api/items/${i.id}`, 'PUT', {category:e.target.value})}>
                      <option value="activity">●</option>
                      <option value="course">C</option>
                      <option value="gap">!</option>
                    </select>
                    <div className="flex-1 text-[11.5px] leading-snug break-words">
                      <Editable value={i.text} onSave={(v) => apiCall(`/api/items/${i.id}`, 'PUT', {text:v})} className={i.category==='course'?'text-primary font-medium':i.category==='gap'?'text-destructive font-medium':'text-foreground'} />
                    </div>
                    <button className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[10px] px-1 rounded shrink-0 transition-colors" onClick={() => confirm('¿Eliminar?') && apiCall(`/api/items/${i.id}`, 'DELETE')}>✕</button>
                  </div>
                ))}
              </div>
              <button className="mt-2 flex items-center justify-center w-full gap-1 py-1.5 border border-dashed border-border rounded text-[10px] text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all" onClick={() => apiCall('/api/items', 'POST', {phase_id: p.id, text: 'Nueva actividad', category: 'activity'})}>+ Agregar ítem</button>
            </div>
          ))}
        </div>

        <div className="mb-16 mt-0 shrink-0">
          <div className="text-[10px] font-bold tracking-widest uppercase text-primary mb-2 leading-none">Hitos Clave</div>
          <div className="relative pt-2 w-full overflow-x-auto pb-2">
            <div className="flex items-start justify-between relative min-w-max px-8 gap-12">
              <div className="absolute top-[10px] left-8 right-8 h-[2px] bg-gradient-to-r from-primary to-primary/20 opacity-50 z-0"></div>
              {data.milestones?.map((m: any, i: number) => (
                <div key={m.id} className="flex flex-col items-center relative w-[140px] px-1 shrink-0">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-primary-foreground z-10 cursor-pointer shadow-[0_0_0_2px_var(--primary)] border-2 border-background hover:scale-110 transition-transform shrink-0">{i+1}</div>
                  <div className="text-center mt-2 w-full">
                    <Editable value={m.date} onSave={(v) => apiCall(`/api/milestones/${m.id}`, 'PUT', {date:v})} className="text-[11px] font-bold text-foreground mb-0.5" />
                    <Editable value={m.title} onSave={(v) => apiCall(`/api/milestones/${m.id}`, 'PUT', {title:v})} className="text-[10px] text-primary/80 font-medium leading-tight" />
                    <Editable value={m.description} onSave={(v) => apiCall(`/api/milestones/${m.id}`, 'PUT', {description:v})} className="text-[9px] text-muted-foreground mt-0.5 leading-tight" />
                    <button className="text-[9px] text-muted-foreground hover:text-destructive px-1 rounded mt-1" onClick={() => confirm('¿Eliminar?') && apiCall(`/api/milestones/${m.id}`, 'DELETE')}>✕ hito</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-3">
            <button className="flex items-center gap-1 px-3 py-1 border border-dashed border-border rounded text-muted-foreground text-[10px] hover:text-primary hover:border-primary hover:bg-primary/5 transition-all" onClick={() => apiCall('/api/milestones', 'POST', {title:'Nuevo Hito'})}>+ Agregar Hito</button>
          </div>
        </div>
      </div>
      <div className="toast fixed bottom-6 right-6 bg-primary text-primary-foreground px-5 py-2.5 rounded text-sm font-bold shadow-xl z-50 opacity-0 transition-opacity" id="toast">Guardado ✓</div>
    </div>
  );
}
