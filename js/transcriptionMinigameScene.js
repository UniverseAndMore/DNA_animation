class TranscriptionMinigameScene extends Phaser.Scene {
  constructor() {
    super("TranscriptionMinigameScene");
  }

  preload() {
    this.load.image("RNA_polymerase", "./images/RNA_polymerase.png");

    this.load.multiatlas(
      "DNA_animation",
      "./images/spritesheets/DNA_animation.json",
      "./images/spritesheets"
    );
  }

  create() {
    this.cameras.main.setBackgroundColor("#eeffff");

    this.DNA_strand = [];

    const numDNApieces = 25;

    for (var i = 0; i < numDNApieces; i++) {
      const DNApiece = this.add
        .sprite(0, 0, "DNA_animation")
        .setOrigin(0.44, 0.5);
      DNApiece.setFrame("open_left_10001.png");
      DNApiece.x = i * DNApiece.width * 0.68;
      DNApiece.y = 240;
      this.DNA_strand.push(DNApiece);
      DNApiece.startingX = DNApiece.x;
      DNApiece.startingY = DNApiece.y;
    }

    this.DNApieceWidth = this.DNA_strand[0].width * 0.68;

    this.RNApolymerase = this.add
      .sprite(0.2 * game.config.width, 235, "RNA_polymerase")
      .setScale(0.8)
      .setAlpha(0.6)
      .setInteractive();

    this.input.setDraggable(this.RNApolymerase);

    //  The pointer has to move 16 pixels before it's considered as a drag
    // this.input.dragDistanceThreshold = 16;

    this.input.on("dragstart", function (pointer, gameObject) {
      //   gameObject.setTint(0xff0000);
    });

    this.input.on("drag", function (pointer, gameObject, dragX, dragY) {
      gameObject.x = Math.min(Math.max(0, dragX), game.config.width);
      //   gameObject.y = dragY;
    });

    this.input.on("dragend", function (pointer, gameObject) {
      //   gameObject.clearTint();
    });
  }

  update() {
    let indexForSmallestDeltaX = 0;
    let smallestDeltaXfromRNAtoDNA;

    for (var i = 0; i < this.DNA_strand.length; i++) {
      const DNAsection = this.DNA_strand[i];
      const deltaX = this.RNApolymerase.x - DNAsection.startingX;

      if (i === 0) {
        smallestDeltaXfromRNAtoDNA = deltaX;
      } else if (Math.abs(deltaX) < Math.abs(smallestDeltaXfromRNAtoDNA)) {
        indexForSmallestDeltaX = i;
        smallestDeltaXfromRNAtoDNA = deltaX;
      }

      DNAsection.setFrame("open_left_10001.png");
      DNAsection.x = DNAsection.startingX;
      DNAsection.y = DNAsection.startingY;
    }

    const closestDNAsection = this.DNA_strand[indexForSmallestDeltaX];

    const leftOfClosest =
      indexForSmallestDeltaX > 0
        ? this.DNA_strand[indexForSmallestDeltaX - 1]
        : null;
    const rightOfClosest =
      indexForSmallestDeltaX < this.DNA_strand.length - 1
        ? this.DNA_strand[indexForSmallestDeltaX + 1]
        : null;

    const twoLeftOfClosest =
      indexForSmallestDeltaX > 1
        ? this.DNA_strand[indexForSmallestDeltaX - 2]
        : null;
    const twoRightOfClosest =
      indexForSmallestDeltaX < this.DNA_strand.length - 2
        ? this.DNA_strand[indexForSmallestDeltaX + 2]
        : null;

    closestDNAsection.setFrame("open_right_20030.png");
    closestDNAsection.x =
      closestDNAsection.startingX - 0.22 * this.DNApieceWidth;
    closestDNAsection.y =
      closestDNAsection.startingY - 0.19 * this.DNApieceWidth;

    const frameForLeft = Math.max(
      Math.ceil((-30 * smallestDeltaXfromRNAtoDNA) / this.DNApieceWidth + 15),
      1
    );
    const inverseFrame = 31 - frameForLeft;

    const zeroPadding = frameForLeft > 9 ? "00" : "000";
    const inverseZeroPadding = inverseFrame > 9 ? "00" : "000";

    if (leftOfClosest) {
      leftOfClosest.setFrame(
        "open_right_2" + zeroPadding + String(frameForLeft) + ".png"
      );
      leftOfClosest.x = leftOfClosest.startingX - 0.22 * this.DNApieceWidth;
      leftOfClosest.y = leftOfClosest.startingY - 0.19 * this.DNApieceWidth;

      if (twoLeftOfClosest) {
        twoLeftOfClosest.setFrame(
          "open_right_1" + zeroPadding + String(frameForLeft) + ".png"
        );
        twoLeftOfClosest.x =
          twoLeftOfClosest.startingX - 0.157 * this.DNApieceWidth;
        twoLeftOfClosest.y =
          twoLeftOfClosest.startingY - 0.02 * this.DNApieceWidth;
      }
    }

    if (rightOfClosest) {
      rightOfClosest.setFrame(
        "open_left_2" + inverseZeroPadding + String(inverseFrame) + ".png"
      );
      rightOfClosest.x = rightOfClosest.startingX - 0.26 * this.DNApieceWidth;
      rightOfClosest.y = rightOfClosest.startingY - 0.043 * this.DNApieceWidth;

      if (twoRightOfClosest) {
        twoRightOfClosest.setFrame(
          "open_left_1" + inverseZeroPadding + String(inverseFrame) + ".png"
        );
        twoRightOfClosest.x = twoRightOfClosest.startingX; //- 0.0 * this.DNApieceWidth;
        twoRightOfClosest.y = twoRightOfClosest.startingY; //- 0.0 * this.DNApieceWidth;
      }
    }
  }
}
