var game;
window.onload = function () {
  var config = {
    type: Phaser.AUTO,
    width: 1080,
    height: 480,
    parent: "phaser-game",
    scene: [TranscriptionMinigameScene],
  };
  game = new Phaser.Game(config);
};
