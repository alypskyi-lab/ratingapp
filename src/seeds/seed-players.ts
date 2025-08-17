import 'reflect-metadata';

import { Player } from '@app/api/player/player.entity';
import type { Repository } from 'typeorm';

import { AppDataSource } from '../data-source';

const TARGET_COUNT = 100;
const BATCH_SIZE = 50;

function makePlayer(index: number): Partial<Player> {
  const now = Date.now();
  return {
    username: `player_${now}_${index}`,
    displayName: `Player ${index + 1}`,
  } as Partial<Player>;
}

async function ensureMinimumPlayers(repo: Repository<Player>) {
  const current = await repo.count();
  if (current >= TARGET_COUNT) {
    console.log(`[seed:players] Already have ${current} players (>= ${TARGET_COUNT}). Nothing to do.`);
    return;
  }

  const missing = TARGET_COUNT - current;
  console.log(`[seed:players] Seeding ${missing} players to reach ${TARGET_COUNT}...`);

  const toInsert: Partial<Player>[] = Array.from({ length: missing }, (_, i) => makePlayer(current + i));

  for (let start = 0; start < toInsert.length; start += BATCH_SIZE) {
    const chunk = toInsert.slice(start, start + BATCH_SIZE);
    await repo.save(repo.create(chunk));
    console.log(`[seed:players] Inserted ${Math.min(start + BATCH_SIZE, toInsert.length)}/${toInsert.length}`);
  }

  console.log('[seed:players] Done.');
}

async function main() {
  await AppDataSource.initialize();
  try {
    const repo = AppDataSource.getRepository(Player);
    await ensureMinimumPlayers(repo);
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error('[seed:players] Failed:', err);
  process.exit(1);
});
