import test from "node:test";
import assert from "node:assert/strict";
import { Tetris } from "./tetris.js";

function createTetris() {
  const tetris = Object.create(Tetris.prototype);

  tetris.BOARD_WIDTH = 10;
  tetris.BOARD_HEIGHT = 20;
  tetris.score = 0;
  tetris.lines = 0;
  tetris.level = 1;
  tetris.updateDisplay = () => {};

  tetris.initBoard();

  return tetris;
}

test("2 riviä antaa 300 pistettä", () => {
  const tetris = createTetris();

  tetris.board[18].fill("#fff");
  tetris.board[19].fill("#fff");

  tetris.clearLines();

  assert.equal(tetris.lines, 2);
  assert.equal(tetris.score, 300);
});

test("3 riviä antaa 500 pistettä", () => {
  const tetris = createTetris();

  tetris.board[17].fill("#fff");
  tetris.board[18].fill("#fff");
  tetris.board[19].fill("#fff");

  tetris.clearLines();

  assert.equal(tetris.lines, 3);
  assert.equal(tetris.score, 500);
});

test("4 riviä antaa 800 pistettä", () => {
  const tetris = createTetris();

  tetris.board[16].fill("#fff");
  tetris.board[17].fill("#fff");
  tetris.board[18].fill("#fff");
  tetris.board[19].fill("#fff");

  tetris.clearLines();

  assert.equal(tetris.lines, 4);
  assert.equal(tetris.score, 800);
});
