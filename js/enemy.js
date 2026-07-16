export const ENEMY_TYPES = {
  SCOUT: {
    id: 'scout',
    name: '侦察机',
    width: 28,
    height: 28,
    hp: 1,
    speed: 3,
    score: 100,
    color: '#4ade80',
    shoot: false,
  },
  FIGHTER: {
    id: 'fighter',
    name: '战斗机',
    width: 38,
    height: 38,
    hp: 2,
    speed: 2.5,
    score: 200,
    color: '#f87171',
    shoot: true,
    fireRate: 2800,
  },
  BOMBER: {
    id: 'bomber',
    name: '轰炸机',
    width: 50,
    height: 40,
    hp: 4,
    speed: 1.5,
    score: 400,
    color: '#a78bfa',
    shoot: true,
    fireRate: 3500,
  },
  ELITE: {
    id: 'elite',
    name: '精英机',
    width: 36,
    height: 36,
    hp: 3,
    speed: 3.5,
    score: 350,
    color: '#fbbf24',
    shoot: true,
    fireRate: 2000,
  },
  BOSS: {
    id: 'boss',
    name: 'Boss',
    width: 80,
    height: 60,
    hp: 20,
    maxHp: 20,
    speed: 1,
    score: 2000,
    color: '#ef4444',
    shoot: true,
    fireRate: 800,
    isBoss: true,
  },
};

export function createEnemy(typeKey, canvasWidth, yOffset = 0) {
  const config = ENEMY_TYPES[typeKey];
  const w = config.width;
  return {
    typeKey,
    ...config,
    maxHp: config.maxHp ?? config.hp,
    x: w / 2 + Math.random() * (canvasWidth - w),
    y: -config.height - yOffset,
    hp: config.hp,
    hitFlash: 0,
    lastShot: 0,
    movePhase: Math.random() * Math.PI * 2,
  };
}

export function drawEnemy(ctx, enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  if (enemy.hitFlash > 0) {
    ctx.globalCompositeOperation = 'lighter';
  }

  switch (enemy.id) {
    case 'scout':
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(-12, -10);
      ctx.lineTo(12, -10);
      ctx.closePath();
      ctx.fill();
      break;

    case 'fighter':
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(-18, -12);
      ctx.lineTo(0, -6);
      ctx.lineTo(18, -12);
      ctx.closePath();
      ctx.fill();
      break;

    case 'bomber':
      ctx.fillStyle = enemy.color;
      ctx.fillRect(-25, -12, 50, 24);
      ctx.fillRect(-8, -22, 16, 10);
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-30, -4, 10, 8);
      ctx.fillRect(20, -4, 10, 8);
      break;

    case 'elite':
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(-22, -10);
      ctx.lineTo(0, -16);
      ctx.lineTo(22, -10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-4, -8, 8, 16);
      break;

    case 'boss':
      ctx.fillStyle = enemy.color;
      ctx.fillRect(-40, -25, 80, 50);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-30, -35, 60, 12);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', 0, 5);
      break;
  }

  drawEnemyHpBar(ctx, enemy);
  ctx.restore();
}

function drawEnemyHpBar(ctx, enemy) {
  if (enemy.maxHp <= 1) return;

  const barW = enemy.isBoss ? 70 : Math.min(enemy.width + 4, 40);
  const barH = enemy.isBoss ? 6 : 4;
  const barY = enemy.isBoss ? -42 : -enemy.height / 2 - 10;
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(-barW / 2, barY, barW, barH);
  ctx.fillStyle = ratio > 0.3 ? '#22c55e' : '#ef4444';
  ctx.fillRect(-barW / 2, barY, barW * ratio, barH);

  if (!enemy.isBoss) {
    ctx.fillStyle = '#e0e1dd';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, 0, barY - 2);
  }
}

export function updateEnemy(enemy, dt, canvasWidth) {
  enemy.y += enemy.speed;
  if (enemy.hitFlash > 0) enemy.hitFlash -= dt;
  if (enemy.id === 'elite') {
    enemy.x += Math.sin(enemy.movePhase + enemy.y * 0.02) * 1.5;
    enemy.x = Math.max(enemy.width / 2, Math.min(canvasWidth - enemy.width / 2, enemy.x));
  }
  if (enemy.id === 'boss') {
    enemy.x += Math.sin(enemy.movePhase + enemy.y * 0.01) * 0.8;
    enemy.x = Math.max(enemy.width / 2, Math.min(canvasWidth - enemy.width / 2, enemy.x));
  }
}

export function enemyShoot(enemy, now, enemyBullets) {
  if (!enemy.shoot || now - enemy.lastShot < enemy.fireRate) return;
  enemy.lastShot = now;
  enemyBullets.push({
    x: enemy.x,
    y: enemy.y + enemy.height / 2,
    vy: 5,
    radius: 4,
    damage: 1,
  });
}
