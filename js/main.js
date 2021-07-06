var game;
window.onload = function () {
  var config = {
    type: Phaser.AUTO,
    width: 938,
    height: 527,
    parent: "phaser-game",
    scene: [TranscriptionMinigameScene],
  };
  game = new Phaser.Game(config);
};
