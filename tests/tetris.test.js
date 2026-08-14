const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function createGame() {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'http://localhost',
    pretendToBeVisual: true,
    runScripts: 'dangerously'
  });

  const { window } = dom;

  window.HTMLCanvasElement.prototype.getContext = function () {
    return {
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      fillText() {},
      beginPath() {},
      arc() {},
      moveTo() {},
      lineTo() {},
      closePath() {},
      stroke() {},
      fill() {}
    };
  };

  window.__tetrisInitialized = true;

  const script = fs.readFileSync(path.join(__dirname, '../tetris.js'), 'utf8');
  window.eval(script);

  const game = window.eval('new Tetris()');
  return { window, document: window.document, game };
}

describe('Tetris gameplay behavior', () => {
  test('hard drop awards points for each cell dropped and locks the piece', () => {
    const { game } = createGame();
    game.currentPiece = {
      type: 'O',
      shape: [[1, 1], [1, 1]],
      color: '#ffff00',
      x: 4,
      y: 0
    };

    game.hardDrop();

    expect(game.score).toBe(36);
    expect(game.board[18][4]).toBe('#ffff00');
    expect(game.board[18][5]).toBe('#ffff00');
    expect(game.board[19][4]).toBe('#ffff00');
    expect(game.board[19][5]).toBe('#ffff00');
  });

  test('line clear scores use the current level multiplier', () => {
    const { game } = createGame();
    game.level = 2;
    game.score = 0;
    game.lines = 10;
    game.board = Array.from({ length: 20 }, () => Array(10).fill(0));

    for (let x = 0; x < 10; x++) {
      game.board[19][x] = '#123456';
      game.board[18][x] = '#123456';
    }

    game.clearLines();

    expect(game.score).toBe(300 * 2);
    expect(game.lines).toBe(12);
  });

  test('high score is stored in localStorage and survives a new game session', () => {
    const { game, window } = createGame();
    game.score = 150;
    game.highScore = 100;
    game.gameRunning = true;
    game.endGame();

    expect(window.localStorage.getItem('tetrisHighScore')).toBe('150');
    expect(game.highScore).toBe(150);
  });

  test('pause overlay shows a paused state and can be resumed with the keyboard', () => {
    const { game, document, window } = createGame();
    game.gameRunning = true;
    game.gamePaused = false;
    game.togglePause();

    expect(document.getElementById('gameOverlay').classList.contains('active')).toBe(true);
    expect(document.getElementById('overlayTitle').textContent.toLowerCase()).toContain('paused');

    const event = new window.KeyboardEvent('keydown', { code: 'KeyP' });
    document.dispatchEvent(event);

    expect(game.gamePaused).toBe(false);
    expect(document.getElementById('gameOverlay').classList.contains('active')).toBe(false);
  });
});
