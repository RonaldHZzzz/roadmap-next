import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

export async function getDb(tab: string = 'personal') {
  const dbName = tab === 'digital' ? 'roadmap_digital.db' : 'roadmap_personal.db';
  return open({
    filename: path.join(process.cwd(), dbName),
    driver: sqlite3.Database
  });
}

export async function getRoadmapData(tab: string = 'personal') {
  const db = await getDb(tab);
  
  const phases = await db.all('SELECT * FROM phases ORDER BY order_num');
  for (const p of phases) {
    p.items = await db.all('SELECT * FROM items WHERE phase_id = ? ORDER BY order_num', p.id);
  }
  
  const milestones = await db.all('SELECT * FROM milestones ORDER BY order_num');
  
  const bottom_cards = await db.all('SELECT * FROM bottom_cards ORDER BY order_num');
  for (const c of bottom_cards) {
    c.items = await db.all('SELECT * FROM bottom_items WHERE card_id = ? ORDER BY order_num', c.id);
  }

  await db.close();
  return { phases, milestones, bottom_cards };
}
