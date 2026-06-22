import { UserService } from '../firebase/database.js';
import { awardXP } from './xp.js';
import { emit, EVENTS } from '../events.js';

export async function trackAlgorithmOpen(uid, algoName) {
  if (!uid) return;
  await UserService.addToRecent(uid, algoName);
  await awardXP(uid, 'algoView', false);
  emit(EVENTS.ALGO_OPEN, { algoName });
}
