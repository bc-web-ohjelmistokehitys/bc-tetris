
(function(global){
  class TetrisEngine {
    constructor({width=12, height=20, blockSize=25} = {}) {
      this.BOARD_WIDTH = width;
      this.BOARD_HEIGHT = height;
      this.BLOCK_SIZE = blockSize;

      this.board = [];
      this.pieces = this._initPieces();
      this.pieceTypes = Object.keys(this.pieces);

      this.currentPiece = null;
      this.nextPiece = null;

      this.score = 0;
      this.lines = 0;
      this.level = 1;

      this.initBoard();
    }

    initBoard(){
      this.board = Array.from({length: this.BOARD_HEIGHT}, () => Array(this.BOARD_WIDTH).fill(0));
    }

    _initPieces(){
      return {
        I:{ shape:[[1,1,1,1]], color:'#00f5ff' },
        O:{ shape:[[1,1],[1,1]], color:'#ffff00' },
        T:{ shape:[[0,1,0],[1,1,1]], color:'#a000f0' },
        S:{ shape:[[0,1,1],[1,1,0]], color:'#00f000' },
        Z:{ shape:[[1,1,0],[0,1,1]], color:'#f00000' },
        J:{ shape:[[1,0,0],[1,1,1]], color:'#0000f0' },
        L:{ shape:[[0,0,1],[1,1,1]], color:'#f0a000' }
      };
    }

    createPiece(type){
      const piece = this.pieces[type];
      return {
        type,
        shape: piece.shape.map(r=>r.slice()),
        color: piece.color,
        x: Math.floor(this.BOARD_WIDTH/2) - Math.floor(piece.shape[0].length/2),
        y: 0
      };
    }

    getRandomPiece(){
      const idx = Math.floor(Math.random() * this.pieceTypes.length);
      return this.createPiece(this.pieceTypes[idx]);
    }

    rotateMatrix(matrix){
      const rows = matrix.length, cols = matrix[0].length;
      const out = Array.from({length: cols}, ()=>Array(rows).fill(0));
      for(let i=0;i<cols;i++){
        for(let j=0;j<rows;j++){
          out[i][j] = matrix[rows-1-j][i];
        }
      }
      return out;
    }

    isValidMove(shape, x, y){
      for(let r=0;r<shape.length;r++){
        for(let c=0;c<shape[r].length;c++){
          if(!shape[r][c]) continue;
          const nx = x + c;
          const ny = y + r;
          if (nx < 0 || nx >= this.BOARD_WIDTH || ny >= this.BOARD_HEIGHT) return false;
          if (ny >= 0 && this.board[ny][nx]) return false;
        }
      }
      return true;
    }

    move(dx, dy){
      const nx = this.currentPiece.x + dx;
      const ny = this.currentPiece.y + dy;
      if (this.isValidMove(this.currentPiece.shape, nx, ny)){
        this.currentPiece.x = nx;
        this.currentPiece.y = ny;
        return true;
      }
      return false;
    }

    rotate(){
      const rotated = this.rotateMatrix(this.currentPiece.shape);
      if (this.isValidMove(rotated, this.currentPiece.x, this.currentPiece.y)){
        this.currentPiece.shape = rotated;
      }
    }

    hardDropStepPoints(){ return 2; } 

    hardDrop(){
      let steps = 0;
      while(this.move(0,1)){ steps++; this.score += this.hardDropStepPoints(); }
      if (typeof this.onScoreChange === 'function') this.onScoreChange(this.score);
      return steps;
    }

    lockPiece(){
      const {shape, x: px, y: py, color} = this.currentPiece;
      for(let r=0;r<shape.length;r++){
        for(let c=0;c<shape[r].length;c++){
          if(!shape[r][c]) continue;
          const x = px + c, y = py + r;
          if (y >= 0) this.board[y][x] = color;
        }
      }
    }

    isLineFull(y){ return this.board[y].every(cell => cell !== 0); }

    removeLine(y){
      this.board.splice(y,1);
      this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
    }


    clearLinesAndScore(){
      let cleared = 0;
      for(let y=this.BOARD_HEIGHT-1; y>=0; y--){
        if (this.isLineFull(y)){
          this.removeLine(y);
          cleared++;
          y++; 
        }
      }
      let pointsAdded = 0;
      if (cleared > 0){
        this.lines += cleared;
        this.level = Math.floor(this.lines / 10) + 1;
        const mult = [0, 1, 3, 5, 8][cleared] || 0;
        pointsAdded = (this.level * 100) * mult;
        this.score += pointsAdded;
      }
      return { cleared, pointsAdded };
    }
  }

  class Tetris extends TetrisEngine {
    constructor(){
      super({ width:12, height:20, blockSize:25 });

     
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.nextCanvas = document.getElementById('nextCanvas');
      this.nextCtx = this.nextCanvas.getContext('2d');

      this.canvas.width  = this.BOARD_WIDTH * this.BLOCK_SIZE;  
      this.canvas.height = this.BOARD_HEIGHT * this.BLOCK_SIZE; 


      this.gameRunning = false;
      this.gamePaused = false;
      this.gameOver = false;

      this.highScore = parseInt(sessionStorage.getItem('tetrisHighScore')) || 0;

      this.bindEvents();
      this.updateDisplay();
      this.onScoreChange = () => this.updateDisplay();
    }

    bindEvents(){
      document.getElementById('startBtn').addEventListener('click', () => this.startGame());
      document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());

     
      document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyP'){ e.preventDefault(); this.togglePause(); return; }
        if (!this.gameRunning || this.gamePaused) return;

        switch(e.code){
          case 'ArrowLeft': e.preventDefault(); this.move(-1,0); this.draw(); break;
          case 'ArrowRight': e.preventDefault(); this.move(1,0); this.draw(); break;
          case 'ArrowDown': e.preventDefault(); if(this.move(0,1)) this.draw(); break;
          case 'ArrowUp': e.preventDefault(); this.rotate(); this.draw(); break;
          case 'Space':
            e.preventDefault();
            this.hardDrop();
          
            this.lockPiece();
            const res = this.clearLinesAndScore();
            if (res.cleared > 0) this.updateDisplay();
            this.spawnNewPiece();
            if (this.isGameOverNow()) this.endGame();
            this.draw();
            break;
        }
      });
    }

    startGame(){
      this.initBoard();
      this.score = 0; this.lines = 0; this.level = 1;
      this.gameRunning = true; this.gamePaused = false; this.gameOver = false;

      this.currentPiece = this.getRandomPiece();
      this.nextPiece = this.getRandomPiece();

      document.getElementById('startBtn').disabled = true;
      const pauseBtn = document.getElementById('pauseBtn');
      pauseBtn.disabled = false;
      pauseBtn.textContent = 'Pausoi';

      document.getElementById('gameOverlay').classList.remove('active');
      this.updateDisplay();
      this.loopTick();
    }

    togglePause(){
      if (!this.gameRunning) return;
      this.gamePaused = !this.gamePaused;
      document.getElementById('pauseBtn').textContent = this.gamePaused ? 'Jatka' : 'Pausoi';
      if (!this.gamePaused) this.loopTick();
    }

    loopTick(){
      if (!this.gameRunning || this.gamePaused) return;

   
      if (!this.move(0,1)){
        this.lockPiece();
        const res = this.clearLinesAndScore();
        if (res.cleared > 0) this.updateDisplay();
        this.spawnNewPiece();
        if (this.isGameOverNow()){ this.endGame(); return; }
      }

      this.draw();
      setTimeout(()=>{ if(this.gameRunning && !this.gamePaused) this.loopTick(); }, this.dropSpeedMs());
    }

    dropSpeedMs(){ return Math.max(50, 1000 - (this.level - 1) * 100); }

    spawnNewPiece(){
      this.currentPiece = this.nextPiece;
      this.nextPiece = this.getRandomPiece();
    }

    isGameOverNow(){
      return !this.isValidMove(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y);
    }

    endGame(){
      this.gameRunning = false; this.gameOver = true;
      if (this.score > this.highScore){
        this.highScore = this.score;
        sessionStorage.setItem('tetrisHighScore', String(this.highScore));
      }
      document.getElementById('startBtn').disabled = false;
      const pauseBtn = document.getElementById('pauseBtn');
      pauseBtn.disabled = true;
      pauseBtn.textContent = 'Pausoi';

      document.getElementById('overlayTitle').textContent = 'Game Over!';
      document.getElementById('overlayMessage').innerHTML = `Final Score: ${this.score}<br>Press Start or P to play again`;
      document.getElementById('gameOverlay').classList.add('active');
      this.updateDisplay();
    }

    draw(){
      const ctx = this.ctx;
      ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

      
      for(let y=0;y<this.BOARD_HEIGHT;y++){
        for(let x=0;x<this.BOARD_WIDTH;x++){
          const cell = this.board[y][x];
          if (cell) this.drawBlock(ctx, x, y, cell);
        }
      }
      
      if (this.currentPiece) this.drawPiece(ctx, this.currentPiece);
     
      this.drawNext();
    }

    drawBlock(ctx, x, y, color){
      const px = x * this.BLOCK_SIZE;
      const py = y * this.BLOCK_SIZE;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, this.BLOCK_SIZE, this.BLOCK_SIZE);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, this.BLOCK_SIZE, this.BLOCK_SIZE);
     
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(px+2, py+2, this.BLOCK_SIZE-4, 4);
      ctx.fillRect(px+2, py+2, 4, this.BLOCK_SIZE-4);
    }

    drawPiece(ctx, piece){
      for(let r=0;r<piece.shape.length;r++){
        for(let c=0;c<piece.shape[r].length;c++){
          if(!piece.shape[r][c]) continue;
          const x = piece.x + c;
          const y = piece.y + r;
          if (y >= 0) this.drawBlock(ctx, x, y, piece.color);
        }
      }
    }

    drawNext(){
      const nctx = this.nextCtx;
      const ncv = this.nextCanvas;
      nctx.clearRect(0,0,ncv.width,ncv.height);
      const block = 22;
      if (!this.nextPiece) return;
      const w = this.nextPiece.shape[0].length * block;
      const h = this.nextPiece.shape.length * block;
      const offX = Math.floor((ncv.width - w)/2);
      const offY = Math.floor((ncv.height - h)/2);
      for(let r=0;r<this.nextPiece.shape.length;r++){
        for(let c=0;c<this.nextPiece.shape[r].length;c++){
          if (!this.nextPiece.shape[r][c]) continue;
          const x = offX + c*block;
          const y = offY + r*block;
          nctx.fillStyle = this.nextPiece.color;
          nctx.fillRect(x,y,block,block);
          nctx.strokeStyle = '#333';
          nctx.lineWidth = 1;
          nctx.strokeRect(x,y,block,block);
        }
      }
    }

    updateDisplay(){
      document.getElementById('score').textContent = this.score;
      document.getElementById('lines').textContent = this.lines;
      document.getElementById('level').textContent = this.level;
      document.getElementById('highScore').textContent = this.highScore;
    }
  }

 
  if (typeof document !== 'undefined'){
    document.addEventListener('DOMContentLoaded', () => {
      new Tetris();
    });
  }


  global.TetrisEngine = TetrisEngine;
  if (typeof module !== 'undefined' && module.exports){
    module.exports = { TetrisEngine };
  }
})(typeof window !== 'undefined' ? window : globalThis);
