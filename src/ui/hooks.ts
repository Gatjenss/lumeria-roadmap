import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { countCards, computeStreak, dayKey } from '../domain/stats/stats';
import { buildQueue, practiceDays } from '../db/repo';

export function useHomeData() {
  return useLiveQuery(async () => {
    const now = Date.now();
    const [queue, cards, days] = await Promise.all([buildQueue(db, now), db.cards.toArray(), practiceDays(db)]);
    return {
      dueCount: queue.due.length,
      freshCount: queue.fresh.length,
      classified: cards.length > 0,
      counts: countCards(cards.map((c) => c.srs)),
      streak: computeStreak(days, dayKey(now)),
      practicedToday: days.has(dayKey(now)),
    };
  }, []);
}
