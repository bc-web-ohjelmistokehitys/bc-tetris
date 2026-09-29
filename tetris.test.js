import test from "node:test";
import assert from "node:assert/strict";
import { Tetris } from "./tetris.js";
import { Builder, By } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

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

test("high score säilyy selaimen sulkemisen jälkeen", async () => {
  const server = http.createServer((req, res) => {
    let filePath = req.url === "/" ? "/index.html" : req.url;

    filePath = path.join(process.cwd(), filePath);

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      let contentType = "text/html";

      if (filePath.endsWith(".js")) {
        contentType = "text/javascript";
      } else if (filePath.endsWith(".css")) {
        contentType = "text/css";
      }

      res.writeHead(200, {
        "Content-Type": contentType,
      });

      res.end(data);
    });
  });

  await new Promise((resolve) => {
    server.listen(8000, "127.0.0.1", resolve);
  });

  const options = new chrome.Options();
  options.addArguments("--user-data-dir=C:\\TetrisTestProfile");

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("http://127.0.0.1:8000/index.html");

    await driver.sleep(500);

    await driver.executeScript(`
      localStorage.setItem("tetrisHighScore", "1000");
    `);

    await driver.navigate().refresh();

    await driver.sleep(500);

    const highScore = await driver.findElement(By.id("highScore")).getText();

    assert.equal(highScore, "1000");
  } finally {
    await driver.quit();
  }

  driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("http://127.0.0.1:8000/index.html");

    await driver.sleep(500);

    const highScore = await driver.findElement(By.id("highScore")).getText();

    assert.equal(highScore, "1000");
  } finally {
    await driver.quit();
    server.close();
  }
});
