// tetris.t.js

document.addEventListener("DOMContentLoaded", () => {
  const game = new Tetris();

  const testCases = [
    { linesToFill: 2, expectedScoreMultiplier: 300 }, // dbl line
    { linesToFill: 3, expectedScoreMultiplier: 500 }, // tri line
    { linesToFill: 4, expectedScoreMultiplier: 800 }, // quad line
  ];

  testCases.forEach((test, index) => {
    // Reset board and score
    game.initBoard();
    game.score = 0;

    // Fill the bottom lines
    for (let i = 0; i < test.linesToFill; i++) {
      const row = game.BOARD_HEIGHT - 1 - i;
      game.board[row] = new Array(game.BOARD_WIDTH).fill(1);
    }

    // Call clearLines
    game.clearLines();

    const expectedScore = test.expectedScoreMultiplier * game.level;
    const passed = game.score === expectedScore;

    console.log(
      `Test ${index + 1} (${test.linesToFill} lines): ${
        passed ? "PASSED" : "FAILED"
      }`
    );
    console.log(`Score: ${game.score}, Expected: ${expectedScore}`);
  });
});
