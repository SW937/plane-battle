import { getPierceStats, consumeShield } from './powerup.js';

export function createPlayer(canvasWidth, canvasHeight) {
  return {
    x: canvasWidth / 2,
    y: canvasHeight - 60,
    width: 36,
    height: 40,
    speed: 5,
    lives: 3,
    maxLives: 8,
    baseFireRate: 55,
    fireRate: 55,
    bulletCount: 1,
    invincible: 0,
    shieldCharges: 0,
    combo: 0,
    lastKillTime: 0,
    activeBuffs: {},
    buffStacks: { fireRate: 0, multiShot: 0, pierce: 0, magnet: 0, scoreBoost: 0 },
    lastShot: 0,
  };
}

export function drawPlayer(ctx, player) {
  const blink = player.invincible > 0 && Math.floor(player.invincible / 100) % 2 === 0;

  ctx.save();
  ctx.translate(player.x, player.y);

  if (player.shieldCharges > 0) {
    ctx.strokeStyle = `rgba(6, 182, 212, ${0.35 + player.shieldCharges * 0.15})`;
    ctx.lineWidth = 2 + player.shieldCharges;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (blink) {
    ctx.restore();
    return;
  }

  ctx.fillStyle = '#60a5fa';
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(-16, 16);
  ctx.lineTo(0, 10);
  ctx.lineTo(16, 16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(-20, 4, 8, 12);
  ctx.fillRect(12, 4, 8, 12);

  ctx.fillStyle = '#93c5fd';
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(-4, 8);
  ctx.lineTo(4, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function updatePlayer(player, keys, canvasWidth) {
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;

  const half = player.width / 2;
  player.x = Math.max(half, Math.min(canvasWidth - half, player.x));

  if (player.invincible > 0) player.invincible -= 16;
}

export function shoot(player, bullets, now) {
  if (now - player.lastShot < player.fireRate) return;
  player.lastShot = now;

  const count = player.bulletCount;
  const spread = 18;
  const pierceStats = getPierceStats(player);

  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spread;
    bullets.push({
      x: player.x + offset,
      y: player.y - 20,
      vy: -9,
      radius: pierceStats.radius,
      damage: pierceStats.damage,
      pierce: pierceStats.active,
      hitSet: pierceStats.active ? new Set() : null,
    });
  }
}

export function hitPlayer(player) {
  if (player.invincible > 0) return false;
  if (consumeShield(player)) return false;
  player.lives--;
  player.invincible = 2000;
  player.combo = 0;
  return true;
}
