document.addEventListener("DOMContentLoaded", () => {
  console.log("TETRIS-8: Highscore works");

  localStorage.removeItem("tetrisHighScore");

  const game = new Tetris();

  game.score = 100;
  game.endGame();
  const savedHighScore = parseInt(localStorage.getItem("tetrisHighScore"), 10);

  if (savedHighScore === 100) {
    console.log("highscore saved correctly.");
  } else {
    console.error(
      "high score did nott saved correctly. Found:",
      savedHighScore
    );
  }

  const newGame = new Tetris();
  if (newGame.highScore === 100) {
    console.log("highcore works on new game instance");
  } else {
    console.error("highscore didnt persist. Found:", newGame.highScore);
    localStorage.removeItem("tetrisHighScore"); 
  }
});
