import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'personal';
  const body = await request.json();
  const db = await getDb(tab);

  try {
    if (slug[0] === 'phases') {
      const { name = 'NUEVA FASE', period = 'Mes Año', subtitle = 'Descripción' } = body;
      const result = await db.get('SELECT COALESCE(MAX(order_num),0) as maxOrder FROM phases');
      const maxOrder = result.maxOrder;
      const { lastID } = await db.run('INSERT INTO phases (name, period, subtitle, order_num) VALUES (?,?,?,?)', [name, period, subtitle, maxOrder + 1]);
      return NextResponse.json({ id: lastID });
    }
    
    if (slug[0] === 'items') {
      const { phase_id, text, category = 'activity' } = body;
      const result = await db.get('SELECT COALESCE(MAX(order_num),0) as maxOrder FROM items WHERE phase_id=?', phase_id);
      const maxOrder = result.maxOrder;
      const { lastID } = await db.run('INSERT INTO items (phase_id, category, text, order_num) VALUES (?,?,?,?)', [phase_id, category, text, maxOrder + 1]);
      return NextResponse.json({ id: lastID });
    }

    if (slug[0] === 'milestones') {
      const { date = '', title = '', description = '' } = body;
      const result = await db.get('SELECT COALESCE(MAX(order_num),0) as maxOrder FROM milestones');
      const maxOrder = result.maxOrder;
      const { lastID } = await db.run('INSERT INTO milestones (order_num, date, title, description) VALUES (?,?,?,?)', [maxOrder + 1, date, title, description]);
      return NextResponse.json({ id: lastID });
    }

    if (slug[0] === 'bottom-items') {
      const { card_id, text } = body;
      const result = await db.get('SELECT COALESCE(MAX(order_num),0) as maxOrder FROM bottom_items WHERE card_id=?', card_id);
      const maxOrder = result.maxOrder;
      const { lastID } = await db.run('INSERT INTO bottom_items (card_id, text, order_num) VALUES (?,?,?)', [card_id, text, maxOrder + 1]);
      return NextResponse.json({ id: lastID });
    }
  } finally {
    await db.close();
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'personal';
  const body = await request.json();
  const db = await getDb(tab);

  try {
    if (slug[0] === 'phases' && slug[1] === 'reorder') {
      for (const phase of body) {
        await db.run('UPDATE phases SET order_num=? WHERE id=?', [phase.order_num, phase.id]);
      }
      return NextResponse.json({ ok: true });
    }

    if (slug[0] === 'items' && slug[1] === 'reorder') {
      for (const item of body) {
        await db.run('UPDATE items SET phase_id=?, order_num=? WHERE id=?', [item.phase_id, item.order_num, item.id]);
      }
      return NextResponse.json({ ok: true });
    }

    if (slug[0] === 'phases' && slug[1]) {
      const pid = slug[1];
      for (const field of ['name', 'period', 'subtitle', 'color']) {
        if (body[field] !== undefined) await db.run(`UPDATE phases SET ${field}=? WHERE id=?`, [body[field], pid]);
      }
      return NextResponse.json({ ok: true });
    }

    if (slug[0] === 'items' && slug[1]) {
      const id = slug[1];
      if (body.text !== undefined) await db.run('UPDATE items SET text=? WHERE id=?', [body.text, id]);
      if (body.category !== undefined) await db.run('UPDATE items SET category=? WHERE id=?', [body.category, id]);
      if (body.phase_id !== undefined) await db.run('UPDATE items SET phase_id=? WHERE id=?', [body.phase_id, id]);
      return NextResponse.json({ ok: true });
    }

    if (slug[0] === 'milestones' && slug[1]) {
      const mid = slug[1];
      for (const field of ['date', 'title', 'description']) {
        if (body[field] !== undefined) await db.run(`UPDATE milestones SET ${field}=? WHERE id=?`, [body[field], mid]);
      }
      return NextResponse.json({ ok: true });
    }

    if (slug[0] === 'bottom-items' && slug[1]) {
      const bid = slug[1];
      if (body.text !== undefined) await db.run('UPDATE bottom_items SET text=? WHERE id=?', [body.text, bid]);
      return NextResponse.json({ ok: true });
    }
  } finally {
    await db.close();
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'personal';
  const db = await getDb(tab);

  try {
    if (slug[0] === 'phases' && slug[1]) {
      await db.run('DELETE FROM items WHERE phase_id=?', slug[1]);
      await db.run('DELETE FROM phases WHERE id=?', slug[1]);
      return NextResponse.json({ ok: true });
    }
    if (slug[0] === 'items' && slug[1]) {
      await db.run('DELETE FROM items WHERE id=?', slug[1]);
      return NextResponse.json({ ok: true });
    }
    if (slug[0] === 'milestones' && slug[1]) {
      await db.run('DELETE FROM milestones WHERE id=?', slug[1]);
      return NextResponse.json({ ok: true });
    }
    if (slug[0] === 'bottom-items' && slug[1]) {
      await db.run('DELETE FROM bottom_items WHERE id=?', slug[1]);
      return NextResponse.json({ ok: true });
    }
  } finally {
    await db.close();
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
