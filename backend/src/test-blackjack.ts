import { startGame, hit, stand, getBlackjackGameById } from './services/blackjack-service';

const g = startGame(6, 50);
console.log('started', g);

if (g) {
  const h = hit(g.id);
  console.log('after hit', h);
  const s = stand(g.id);
  console.log('after stand', s);
}
