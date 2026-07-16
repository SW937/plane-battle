export const POWERUP_TYPES = {
  FIRE_RATE: 'fireRate',
  EXTRA_LIFE: 'extraLife',
  MULTI_SHOT: 'multiShot',
  SHIELD: 'shield',
  PIERCE: 'pierce',
  BOMB: 'bomb',
  MAGNET: 'magnet',
  SCORE_BOOST: 'scoreBoost',
};

export const POWERUP_DURATION = 10000;
export const DROP_CHANCE = 0.25;

const POWERUP_CONFIG = {
  [POWERUP_TYPES.FIRE_RATE]: {
    label: '攻速↑',
    color: '#ef4444',
    symbol: '⚡',
    weight: 18,
  },
  [POWERUP_TYPES.EXTRA_LIFE]: {
    label: '+1命',
    color: '#22c55e',
    symbol: '♥',
    weight: 8,
  },
  [POWERUP_TYPES.MULTI_SHOT]: {
    label: '连发↑',
    color: '#3b82f6',
    symbol: '✦',
    weight: 18,
  },
  [POWERUP_TYPES.SHIELD]: {
    label: '护盾',
    color: '#06b6d4',
    symbol: '◉',
    weight: 14,
  },
  [POWERUP_TYPES.PIERCE]: {
    label: '穿透',
    color: '#eab308',
    symbol: '→',
    weight: 14,
  },
  [POWERUP_TYPES.BOMB]: {
    label: '清屏',
    color: '#f97316',
    symbol: '💥',
    weight: 6,
  },
  [POWERUP_TYPES.MAGNET]: {
    label: '磁力',
    color: '#a855f7',
    symbol: '◎',
    weight: 12,
  },
  [POWERUP_TYPES.SCORE_BOOST]: {
    label: '双倍分',
    color: '#ec4899',
    symbol: '★',
    weight: 10,
  },
};

const MAX_FIRE_RATE_STACKS = 6;
const MAX_MULTI_SHOT_STACKS = 6;
const MAX_SHIELD_CHARGES = 6;
const MAX_PIERCE_STACKS = 6;
const MAX_MAGNET_STACKS = 6;
const MAX_SCORE_BOOST_STACKS = 6;

function extendBuffDuration(player, buffKey, now) {
  const current = player.activeBuffs[buffKey] || now;
  player.activeBuffs[buffKey] = Math.max(current, now) + POWERUP_DURATION;
}

function addStack(player, stackKey, maxStacks) {
  player.buffStacks[stackKey] = Math.min(player.buffStacks[stackKey] + 1, maxStacks);
}

function recalcFireRate(player) {
  const stacks = player.buffStacks.fireRate;
  player.fireRate = Math.max(25, player.baseFireRate * Math.pow(0.72, stacks));
}

function recalcBulletCount(player) {
  player.bulletCount = Math.min(1 + player.buffStacks.multiShot, 1 + MAX_MULTI_SHOT_STACKS);
}

function pickRandomPowerupType() {
  const entries = Object.values(POWERUP_TYPES);
  const totalWeight = entries.reduce((sum, type) => sum + (POWERUP_CONFIG[type]?.weight ?? 1), 0);
  let roll = Math.random() * totalWeight;

  for (const type of entries) {
    roll -= POWERUP_CONFIG[type]?.weight ?? 1;
    if (roll <= 0) return type;
  }

  return entries[entries.length - 1];
}

export function tryDropPowerup(enemy) {
  if (Math.random() >= DROP_CHANCE) return null;

  const type = pickRandomPowerupType();
  return {
    x: enemy.x,
    y: enemy.y,
    type,
    vy: 2,
    radius: 14,
    ...POWERUP_CONFIG[type],
  };
}

export function drawPowerup(ctx, powerup) {
  ctx.save();
  ctx.translate(powerup.x, powerup.y);

  ctx.fillStyle = powerup.color;
  ctx.beginPath();
  ctx.arc(0, 0, powerup.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(powerup.symbol, 0, 1);

  ctx.restore();
}

export function applyPowerup(player, type) {
  const now = Date.now();

  switch (type) {
    case POWERUP_TYPES.FIRE_RATE:
      addStack(player, 'fireRate', MAX_FIRE_RATE_STACKS);
      extendBuffDuration(player, 'fireRate', now);
      recalcFireRate(player);
      break;

    case POWERUP_TYPES.EXTRA_LIFE:
      player.lives = Math.min(player.lives + 1, player.maxLives);
      break;

    case POWERUP_TYPES.MULTI_SHOT:
      addStack(player, 'multiShot', MAX_MULTI_SHOT_STACKS);
      extendBuffDuration(player, 'multiShot', now);
      recalcBulletCount(player);
      break;

    case POWERUP_TYPES.SHIELD:
      player.shieldCharges = Math.min(player.shieldCharges + 1, MAX_SHIELD_CHARGES);
      break;

    case POWERUP_TYPES.PIERCE:
      addStack(player, 'pierce', MAX_PIERCE_STACKS);
      extendBuffDuration(player, 'pierce', now);
      break;

    case POWERUP_TYPES.BOMB:
      return { bomb: true };

    case POWERUP_TYPES.MAGNET:
      addStack(player, 'magnet', MAX_MAGNET_STACKS);
      extendBuffDuration(player, 'magnet', now);
      break;

    case POWERUP_TYPES.SCORE_BOOST:
      addStack(player, 'scoreBoost', MAX_SCORE_BOOST_STACKS);
      extendBuffDuration(player, 'scoreBoost', now);
      break;
  }

  return null;
}

export function consumeShield(player) {
  if (player.shieldCharges <= 0) return false;
  player.shieldCharges--;
  player.invincible = Math.max(player.invincible, 800);
  return true;
}

export function hasPierce(player) {
  return player.buffStacks.pierce > 0 && Boolean(player.activeBuffs.pierce && Date.now() <= player.activeBuffs.pierce);
}

export function getPierceStats(player) {
  if (!hasPierce(player)) {
    return { active: false, damage: 1, radius: 4 };
  }

  const stacks = player.buffStacks.pierce;
  return {
    active: true,
    damage: stacks,
    radius: 3 + stacks,
  };
}

export function hasMagnet(player) {
  return player.buffStacks.magnet > 0 && Boolean(player.activeBuffs.magnet && Date.now() <= player.activeBuffs.magnet);
}

export function getMagnetPull(player) {
  if (!hasMagnet(player)) return 0;
  return 4 + player.buffStacks.magnet * 2;
}

export function getScoreMultiplier(player) {
  const now = Date.now();
  let multiplier = 1;

  if (player.activeBuffs.scoreBoost && now <= player.activeBuffs.scoreBoost && player.buffStacks.scoreBoost > 0) {
    multiplier *= 1 + player.buffStacks.scoreBoost;
  }

  if (player.combo >= 3) {
    multiplier *= 1 + Math.min(player.combo - 2, 8) * 0.1;
  }

  return multiplier;
}

export function updateBuffs(player) {
  const now = Date.now();

  if (player.activeBuffs.fireRate && now > player.activeBuffs.fireRate) {
    player.buffStacks.fireRate = 0;
    player.fireRate = player.baseFireRate;
    delete player.activeBuffs.fireRate;
  }

  if (player.activeBuffs.multiShot && now > player.activeBuffs.multiShot) {
    player.buffStacks.multiShot = 0;
    player.bulletCount = 1;
    delete player.activeBuffs.multiShot;
  }

  if (player.activeBuffs.pierce && now > player.activeBuffs.pierce) {
    player.buffStacks.pierce = 0;
    delete player.activeBuffs.pierce;
  }

  if (player.activeBuffs.magnet && now > player.activeBuffs.magnet) {
    player.buffStacks.magnet = 0;
    delete player.activeBuffs.magnet;
  }

  if (player.activeBuffs.scoreBoost && now > player.activeBuffs.scoreBoost) {
    player.buffStacks.scoreBoost = 0;
    delete player.activeBuffs.scoreBoost;
  }
}

export function getActiveBuffLabels(player) {
  const now = Date.now();
  const labels = [];

  if (player.activeBuffs.fireRate) {
    const sec = Math.ceil((player.activeBuffs.fireRate - now) / 1000);
    const stacks = player.buffStacks.fireRate;
    if (sec > 0) {
      labels.push({
        text: stacks > 1 ? `攻速 x${stacks} ${sec}s` : `攻速 ${sec}s`,
        color: '#ef4444',
      });
    }
  }
  if (player.activeBuffs.multiShot) {
    const sec = Math.ceil((player.activeBuffs.multiShot - now) / 1000);
    const stacks = player.buffStacks.multiShot;
    if (sec > 0) {
      labels.push({
        text: stacks > 1 ? `连发 x${stacks} ${sec}s` : `连发 ${sec}s`,
        color: '#3b82f6',
      });
    }
  }

  if (player.shieldCharges > 0) {
    labels.push({
      text: `护盾 x${player.shieldCharges}`,
      color: '#06b6d4',
    });
  }

  if (player.activeBuffs.pierce) {
    const sec = Math.ceil((player.activeBuffs.pierce - now) / 1000);
    const stacks = player.buffStacks.pierce;
    if (sec > 0) {
      labels.push({
        text: stacks > 1 ? `穿透 x${stacks} ${sec}s` : `穿透 ${sec}s`,
        color: '#eab308',
      });
    }
  }

  if (player.activeBuffs.magnet) {
    const sec = Math.ceil((player.activeBuffs.magnet - now) / 1000);
    const stacks = player.buffStacks.magnet;
    if (sec > 0) {
      labels.push({
        text: stacks > 1 ? `磁力 x${stacks} ${sec}s` : `磁力 ${sec}s`,
        color: '#a855f7',
      });
    }
  }

  if (player.activeBuffs.scoreBoost) {
    const sec = Math.ceil((player.activeBuffs.scoreBoost - now) / 1000);
    const stacks = player.buffStacks.scoreBoost;
    if (sec > 0) {
      labels.push({
        text: stacks > 1 ? `${1 + stacks}倍分 ${sec}s` : `双倍分 ${sec}s`,
        color: '#ec4899',
      });
    }
  }

  return labels;
}

export function getPowerupLabel(type) {
  return POWERUP_CONFIG[type]?.label ?? type;
}
