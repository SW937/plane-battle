import { createPlayer, drawPlayer, updatePlayer, shoot, hitPlayer } from './player.js';
import { createEnemy, drawEnemy, updateEnemy, enemyShoot } from './enemy.js';
import { LevelManager, LEVELS } from './level.js';
import {
  tryDropPowerup,
  drawPowerup,
  applyPowerup,
  updateBuffs,
  getActiveBuffLabels,
  hasMagnet,
  getMagnetPull,
  getScoreMultiplier,
} from './powerup.js';

export const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_INTRO: 'levelIntro',
  GAME_OVER: 'gameOver',
  VICTORY: 'victory',
};

const LEVEL_INTRO_DURATION = 1800;

export class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.state = GameState.MENU;
    this.keys = { left: false, right: false, shoot: false };
    this.levelManager = new LevelManager();

    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.powerups = [];
    this.score = 0;
    this.bombFlash = 0;
    this.stars = this._createStars();
    this.lastTime = 0;
    this.animationId = null;
    this._introTimer = null;

    this._bindInput();
    this._bindTouchControls();
    this._loop = this._loop.bind(this);
    this.animationId = requestAnimationFrame(this._loop);
  }

  _createStars() {
    return Array.from({ length: 80 }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      speed: 0.5 + Math.random() * 2,
      size: Math.random() * 2 + 0.5,
    }));
  }

  _bindInput() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.keys.shoot = true;
      }
      if (e.code === 'KeyP' && this.state === GameState.PLAYING) {
        this.state = GameState.PAUSED;
        this.onPause?.();
      } else if (e.code === 'KeyP' && this.state === GameState.PAUSED) {
        this.state = GameState.PLAYING;
        this.onResume?.();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
      if (e.code === 'Space') this.keys.shoot = false;
    });
  }

  _bindTouchControls() {
    const panel = document.getElementById('touch-controls');
    const leftBtn = document.getElementById('touch-left');
    const rightBtn = document.getElementById('touch-right');
    const shootBtn = document.getElementById('touch-shoot');

    if (!panel || !leftBtn || !rightBtn || !shootBtn) return;

    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || matchMedia('(hover: none)').matches;

    if (!isTouchDevice) return;

    panel.classList.remove('hidden');
    panel.setAttribute('aria-hidden', 'false');

    const bindButton = (button, key) => {
      const press = (e) => {
        e.preventDefault();
        this.keys[key] = true;
        button.classList.add('active');
      };
      const release = (e) => {
        e.preventDefault();
        this.keys[key] = false;
        button.classList.remove('active');
      };

      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointerleave', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('contextmenu', (e) => e.preventDefault());
    };

    bindButton(leftBtn, 'left');
    bindButton(rightBtn, 'right');
    bindButton(shootBtn, 'shoot');
  }

  start() {
    this.player = createPlayer(this.width, this.height);
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.powerups = [];
    this.score = 0;
    this.bombFlash = 0;
    this.levelManager.reset();
    this._beginLevelIntro(0);
  }

  _beginLevelIntro(levelIndex) {
    if (this._introTimer) {
      clearTimeout(this._introTimer);
      this._introTimer = null;
    }

    this.state = GameState.LEVEL_INTRO;
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.powerups = [];
    this._clearKeys();

    this.onLevelStart?.(LEVELS[levelIndex]);

    this._introTimer = setTimeout(() => {
      this._introTimer = null;
      if (this.state !== GameState.LEVEL_INTRO) return;
      this.levelManager.startLevel(levelIndex);
      this.state = GameState.PLAYING;
      this.onLevelIntroEnd?.();
    }, LEVEL_INTRO_DURATION);
  }

  _clearKeys() {
    this.keys.left = false;
    this.keys.right = false;
    this.keys.shoot = false;
  }

  _loop(timestamp) {
    const dt = this.lastTime ? timestamp - this.lastTime : 16;
    this.lastTime = timestamp;

    if (this.state === GameState.PLAYING) {
      this._update(dt, timestamp);
    }
    this._draw(timestamp);
    this.animationId = requestAnimationFrame(this._loop);
  }

  _update(dt, now) {
    updatePlayer(this.player, this.keys, this.width);
    updateBuffs(this.player);

    if (this.keys.shoot) shoot(this.player, this.bullets, now);

    const spawnBatch = this.levelManager.update(dt, this.enemies.length);
    for (let i = 0; i < spawnBatch.length; i++) {
      this.enemies.push(createEnemy(spawnBatch[i], this.width, i * 45));
    }

    for (const enemy of this.enemies) {
      updateEnemy(enemy, dt, this.width);
      enemyShoot(enemy, now, this.enemyBullets);
      if (enemy.y > this.height + enemy.height) {
        enemy.y = -enemy.height;
        enemy.x = enemy.width / 2 + Math.random() * (this.width - enemy.width);
      }
    }

    for (const bullet of this.bullets) bullet.y += bullet.vy;
    for (const bullet of this.enemyBullets) bullet.y += bullet.vy;
    for (const powerup of this.powerups) {
      powerup.y += powerup.vy;
      if (hasMagnet(this.player)) {
        const dx = this.player.x - powerup.x;
        const dy = this.player.y - powerup.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pull = Math.min(getMagnetPull(this.player), 120 / dist);
        powerup.x += (dx / dist) * pull;
        powerup.y += (dy / dist) * pull;
      }
    }

    if (this.bombFlash > 0) this.bombFlash -= dt;

    this._checkCollisions();

    this.bullets = this.bullets.filter((b) => b.y > -10);
    this.enemyBullets = this.enemyBullets.filter((b) => b.y < this.height + 10);
    this.powerups = this.powerups.filter((p) => p.y < this.height + 20);

    if (this.levelManager.isLevelComplete()) {
      this._advanceLevel();
    }

    if (this.player.lives <= 0) {
      this.state = GameState.GAME_OVER;
      this.onGameOver?.(this.score);
    }
  }

  _advanceLevel() {
    this.levelManager.beginTransition();

    if (this.levelManager.isLastLevel()) {
      this.state = GameState.VICTORY;
      this.onVictory?.(this.score);
      return;
    }

    this._beginLevelIntro(this.levelManager.currentLevel + 1);
  }

  _checkCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      let bulletRemoved = false;

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (bullet.pierce && bullet.hitSet?.has(enemy)) continue;
        if (this._circleHit(bullet, enemy, bullet.radius, enemy.width / 2)) {
          if (bullet.pierce) bullet.hitSet.add(enemy);
          enemy.hp -= bullet.damage;
          this.onBulletHit?.();
          if (!bullet.pierce) {
            this.bullets.splice(i, 1);
            bulletRemoved = true;
          }
          if (enemy.hp > 0) {
            enemy.hitFlash = 120;
          } else if (enemy.hp <= 0) {
            this._onEnemyKilled(enemy);
            const drop = tryDropPowerup(enemy);
            if (drop) this.powerups.push(drop);
            this.enemies.splice(j, 1);
          }
          if (bulletRemoved) break;
        }
      }
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      if (this._circleHit(powerup, this.player, powerup.radius, this.player.width / 2)) {
        const effect = applyPowerup(this.player, powerup.type);
        if (effect?.bomb) this._triggerBomb();
        this.powerups.splice(i, 1);
      }
    }

    for (const enemy of this.enemies) {
      if (this._circleHit(enemy, this.player, enemy.width / 2, this.player.width / 2)) {
        if (hitPlayer(this.player)) {
          this.onPlayerCrash?.();
          this.enemies.splice(this.enemies.indexOf(enemy), 1);
        }
        break;
      }
    }

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      if (this._circleHit(bullet, this.player, bullet.radius, this.player.width / 2)) {
        this.enemyBullets.splice(i, 1);
        hitPlayer(this.player);
      }
    }
  }

  _onEnemyKilled(enemy, now = Date.now()) {
    if (now - this.player.lastKillTime <= 2000) {
      this.player.combo++;
    } else {
      this.player.combo = 1;
    }
    this.player.lastKillTime = now;

    const points = Math.round(enemy.score * getScoreMultiplier(this.player));
    this.score += points;
    this.levelManager.onEnemyKilled();
  }

  _triggerBomb() {
    this.bombFlash = 350;
    this.enemyBullets = [];

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.isBoss) {
        enemy.hp = Math.max(1, Math.floor(enemy.hp / 2));
        enemy.hitFlash = 200;
      } else {
        this._onEnemyKilled(enemy);
        this.enemies.splice(i, 1);
      }
    }
  }

  _circleHit(a, b, rA, rB) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy < (rA + rB) ** 2;
  }

  _draw(now) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this._drawBackground(ctx);

    if (this.state === GameState.MENU) return;

    for (const bullet of this.bullets) {
      ctx.fillStyle = bullet.pierce ? '#fbbf24' : '#fde047';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const bullet of this.enemyBullets) {
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const enemy of this.enemies) drawEnemy(ctx, enemy);
    for (const powerup of this.powerups) drawPowerup(ctx, powerup);

    if (this.player) drawPlayer(ctx, this.player);

    if (this.bombFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.bombFlash / 350 * 0.45})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    this._drawHUD(ctx);
  }

  _drawBackground(ctx) {
    for (const star of this.stars) {
      star.y += star.speed;
      if (star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
      ctx.fillStyle = `rgba(255,255,255,${star.size / 3})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  _drawHUD(ctx) {
    if (!this.player) return;

    ctx.fillStyle = '#e0e1dd';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`得分: ${this.score}`, 10, 24);

    const hearts = '❤'.repeat(this.player.lives);
    ctx.fillText(`生命: ${hearts}`, 10, 48);

    if (this.player.combo >= 3) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`连击 x${this.player.combo}`, 10, 72);
      ctx.fillStyle = '#e0e1dd';
    }

    const levelInfo = this.levelManager.getLevelInfo();
    if (levelInfo) {
      ctx.textAlign = 'center';
      ctx.fillText(levelInfo.name, this.width / 2, 24);
      if (this.levelManager.levelActive) {
        const remaining = this.levelManager.getRemainingTime();
        ctx.font = '13px sans-serif';
        ctx.fillStyle = '#adb5bd';
        ctx.fillText(`剩余时间: ${remaining}s`, this.width / 2, 44);
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#e0e1dd';
      }
    }

    const buffs = getActiveBuffLabels(this.player);
    ctx.textAlign = 'right';
    buffs.forEach((buff, i) => {
      ctx.fillStyle = buff.color;
      ctx.fillText(buff.text, this.width - 10, 24 + i * 22);
    });
  }
}
