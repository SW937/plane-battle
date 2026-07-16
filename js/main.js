import { Game, GameState } from './game.js';
import { BackgroundMusic, SoundEffects } from './audio.js';

const game = new Game('gameCanvas');
const bgm = new BackgroundMusic();
const sfx = new SoundEffects();

const menuScreen = document.getElementById('menu-screen');
const pauseScreen = document.getElementById('pause-screen');
const levelScreen = document.getElementById('level-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const victoryScreen = document.getElementById('victory-screen');

const levelTitle = document.getElementById('level-title');
const levelDesc = document.getElementById('level-desc');
const finalScore = document.getElementById('final-score');
const victoryScore = document.getElementById('victory-score');

function hideAllScreens() {
  [menuScreen, pauseScreen, levelScreen, gameoverScreen, victoryScreen].forEach((el) =>
    el.classList.add('hidden')
  );
}

function showScreen(screen) {
  hideAllScreens();
  screen.classList.remove('hidden');
}

function startGame() {
  hideAllScreens();
  bgm.play();
  game.start();
}

document.getElementById('btn-start').onclick = startGame;

document.getElementById('btn-restart').onclick = startGame;

document.getElementById('btn-menu').onclick = () => {
  bgm.stop();
  game.state = GameState.MENU;
  showScreen(menuScreen);
};

document.getElementById('btn-victory-restart').onclick = startGame;

document.getElementById('btn-victory-menu').onclick = () => {
  bgm.stop();
  game.state = GameState.MENU;
  showScreen(menuScreen);
};

const btnMute = document.getElementById('btn-mute');
btnMute.onclick = () => {
  const enabled = bgm.toggle();
  btnMute.textContent = enabled ? '🔊' : '🔇';
  btnMute.title = enabled ? '关闭音乐' : '开启音乐';
  if (enabled && game.state !== GameState.MENU) {
    bgm.play();
  }
};

game.onPause = () => {
  bgm.pause();
  showScreen(pauseScreen);
};

game.onResume = () => {
  bgm.resume();
  hideAllScreens();
};

game.onBulletHit = () => sfx.playBulletHit();

game.onPlayerCrash = () => sfx.playExplosion();

game.onLevelStart = (level) => {
  levelTitle.textContent = level.name;
  levelDesc.textContent = level.desc;
  showScreen(levelScreen);
};

game.onLevelIntroEnd = () => {
  if (game.state === GameState.PLAYING) {
    levelScreen.classList.add('hidden');
  }
};

game.onGameOver = (score) => {
  bgm.stop();
  finalScore.textContent = score;
  showScreen(gameoverScreen);
};

game.onVictory = (score) => {
  bgm.stop();
  victoryScore.textContent = score;
  showScreen(victoryScreen);
};
