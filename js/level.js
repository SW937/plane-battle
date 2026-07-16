export const LEVEL_DURATION = 20000;

export const LEVELS = [
  {
    name: '第1关 - 初战',
    desc: '侦察机成群来袭，坚持 20 秒',
    waves: [{ type: 'SCOUT', count: 8 }],
    spawnInterval: 550,
    batchMin: 2,
    batchMax: 4,
  },
  {
    name: '第2关 - 增援',
    desc: '战斗机加入战斗，坚持 20 秒',
    waves: [
      { type: 'SCOUT', count: 5 },
      { type: 'FIGHTER', count: 5 },
    ],
    spawnInterval: 500,
    batchMin: 2,
    batchMax: 4,
  },
  {
    name: '第3关 - 轰炸',
    desc: '轰炸机出动，坚持 20 秒',
    waves: [
      { type: 'FIGHTER', count: 5 },
      { type: 'BOMBER', count: 4 },
    ],
    spawnInterval: 500,
    batchMin: 2,
    batchMax: 4,
  },
  {
    name: '第4关 - 精英',
    desc: '精英机开始射击，坚持 20 秒',
    waves: [
      { type: 'ELITE', count: 4 },
      { type: 'FIGHTER', count: 5 },
    ],
    spawnInterval: 450,
    batchMin: 2,
    batchMax: 4,
  },
  {
    name: '第5关 - Boss',
    desc: 'Boss 登场，坚持 20 秒',
    waves: [
      { type: 'SCOUT', count: 4 },
      { type: 'FIGHTER', count: 3 },
      { type: 'BOSS', count: 1 },
    ],
    spawnInterval: 450,
    batchMin: 2,
    batchMax: 4,
  },
  {
    name: '第6关 - 混合',
    desc: '多种敌机混合进攻，坚持 20 秒',
    waves: [
      { type: 'SCOUT', count: 4 },
      { type: 'FIGHTER', count: 4 },
      { type: 'BOMBER', count: 3 },
      { type: 'ELITE', count: 3 },
    ],
    spawnInterval: 420,
    batchMin: 2,
    batchMax: 4,
  },
  {
    name: '第7关 - 狂潮',
    desc: '敌机攻势加剧，坚持 20 秒',
    waves: [
      { type: 'FIGHTER', count: 6 },
      { type: 'BOMBER', count: 4 },
      { type: 'ELITE', count: 4 },
    ],
    spawnInterval: 400,
    batchMin: 3,
    batchMax: 5,
  },
  {
    name: '第8关 - 双Boss',
    desc: '两个 Boss 同时出现，坚持 20 秒',
    waves: [
      { type: 'ELITE', count: 4 },
      { type: 'FIGHTER', count: 4 },
      { type: 'BOSS', count: 2 },
    ],
    spawnInterval: 400,
    batchMin: 3,
    batchMax: 5,
  },
];

const MIN_ACTIVE_ENEMIES = 3;

export class LevelManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentLevel = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.levelTimer = 0;
    this.enemiesKilled = 0;
    this.enemiesSpawned = 0;
    this.totalEnemies = 0;
    this.levelActive = false;
    this.transitioning = false;
  }

  startLevel(levelIndex) {
    this.currentLevel = levelIndex;
    this.spawnQueue = [];
    this.enemiesKilled = 0;
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
    this.levelTimer = 0;
    this.levelActive = true;
    this.transitioning = false;

    const level = LEVELS[levelIndex];
    for (const wave of level.waves) {
      for (let i = 0; i < wave.count; i++) {
        this.spawnQueue.push(wave.type);
      }
    }
    this.totalEnemies = this.spawnQueue.length;
    this.shuffleQueue();
  }

  shuffleQueue() {
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }
  }

  _refillQueue() {
    const level = LEVELS[this.currentLevel];
    for (const wave of level.waves) {
      const refillCount = Math.max(1, Math.ceil(wave.count / 2));
      for (let i = 0; i < refillCount; i++) {
        this.spawnQueue.push(wave.type);
      }
    }
    this.shuffleQueue();
  }

  getLevelInfo() {
    return LEVELS[this.currentLevel];
  }

  isLastLevel() {
    return this.currentLevel >= LEVELS.length - 1;
  }

  _randomBatchSize(level) {
    const min = level.batchMin ?? 2;
    const max = level.batchMax ?? 4;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  update(dt, activeEnemyCount = 0) {
    if (!this.levelActive) return [];

    this.levelTimer += dt;

    if (this.levelTimer >= LEVEL_DURATION) {
      return [];
    }

    if (this.spawnQueue.length === 0) {
      this._refillQueue();
    }

    if (activeEnemyCount < MIN_ACTIVE_ENEMIES) {
      this.spawnTimer = Math.min(this.spawnTimer, 80);
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return [];

    const level = LEVELS[this.currentLevel];
    const batchSize = Math.min(this.spawnQueue.length, this._randomBatchSize(level));
    const batch = [];

    for (let i = 0; i < batchSize; i++) {
      batch.push(this.spawnQueue.shift());
      this.enemiesSpawned++;
    }

    this.spawnTimer = level.spawnInterval;
    return batch;
  }

  getRemainingTime() {
    return Math.max(0, Math.ceil((LEVEL_DURATION - this.levelTimer) / 1000));
  }

  onEnemyKilled() {
    this.enemiesKilled++;
  }

  isLevelComplete() {
    return (
      this.levelActive &&
      !this.transitioning &&
      this.levelTimer >= LEVEL_DURATION
    );
  }

  beginTransition() {
    this.levelActive = false;
    this.transitioning = true;
  }
}
