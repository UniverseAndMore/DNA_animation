class TranscriptionMinigameScene extends Phaser.Scene {
  constructor() {
    super("TranscriptionMinigameScene");
  }

  preload() {
    this.load.image("RNA_polymerase", "./images/RNA_polymerase.png");
    this.load.image("arrow", "./images/arrow.png");

    this.load.multiatlas(
      "DNA_animation",
      "./images/spritesheets/DNA_animation.json",
      "./images/spritesheets"
    );

    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );
  }

  create() {
    this.isRNApolyLockedIn = false;
    this.DNAposY = 0.35 * game.config.height;
    this.promoterX = 0.141 * game.config.width;

    // this.createAnimations();

    this.cameras.main.setBackgroundColor("#f0fffe");

    this.createInstructionBox();
    this.createDNA();
    this.createRNAPoly();
    this.createPromoterBox();
    this.createDragListeners();
  }

  createAnimations() {
    const openBothFrames = [];
    const openLeftFramesClosest = [];
    const openRightFramesClosest = [];
    const openLeftFramesNextClosest = [];
    const openRightFramesNextClosest = [];

    for (var i = 1; i <= 30; i++) {
      let frameNameBoth = "open_both";
      let frameNameLeft = "open_left_1";
      let frameNameRight = "open_right_1";
      if (i < 10) {
        frameNameBoth += "000";
        frameNameLeft += "000";
        frameNameRight += "000";
      } else {
        frameNameBoth += "00";
        frameNameLeft += "00";
        frameNameRight += "00";
      }

      frameNameBoth += String(i) + ".png";
      frameNameLeft += String(i) + ".png";
      frameNameRight += String(i) + ".png";

      openBothFrames.push({ key: "DNA_animation", frame: frameNameBoth });
      openLeftFramesClosest.push({
        key: "DNA_animation",
        frame: frameNameLeft,
      });
      openRightFramesClosest.push({
        key: "DNA_animation",
        frame: frameNameRight,
      });
      openLeftFramesNextClosest.push({
        key: "DNA_animation",
        frame: "open_left_10001.png",
      });
      openRightFramesNextClosest.push({
        key: "DNA_animation",
        frame: "open_left_10001.png",
      });
    }

    for (var i = 1; i <= 15; i++) {
      let frameNameLeftClosest = "open_left_2";
      let frameNameRightClosest = "open_right_2";
      let frameNameLeftNextClosest = "open_left_1";
      let frameNameRightNextClosest = "open_right_1";
      if (i < 10) {
        frameNameLeftClosest += "000";
        frameNameRightClosest += "000";
        frameNameLeftNextClosest += "000";
        frameNameRightNextClosest += "000";
      } else {
        frameNameLeftClosest += "00";
        frameNameRightClosest += "00";
        frameNameLeftNextClosest += "00";
        frameNameRightNextClosest += "00";
      }

      frameNameLeftClosest += String(i) + ".png";
      frameNameRightClosest += String(i) + ".png";
      frameNameLeftNextClosest += String(i) + ".png";
      frameNameRightNextClosest += String(i) + ".png";

      openLeftFramesClosest.push({
        key: "DNA_animation",
        frame: frameNameLeftClosest,
      });
      openRightFramesClosest.push({
        key: "DNA_animation",
        frame: frameNameRightClosest,
      });
      openLeftFramesNextClosest.push({
        key: "DNA_animation",
        frame: frameNameLeftNextClosest,
      });
      openRightFramesNextClosest.push({
        key: "DNA_animation",
        frame: frameNameRightNextClosest,
      });
    }

    this.anims.create({
      key: "open_both",
      frames: openBothFrames,
      frameRate: 60,
    });

    this.anims.create({
      key: "open_left_closest",
      frames: openLeftFramesClosest,
      frameRate: 60,
    });

    this.anims.create({
      key: "open_right_closest",
      frames: openRightFramesClosest,
      frameRate: 60,
    });

    this.anims.create({
      key: "open_left_next_closest",
      frames: openLeftFramesNextClosest,
      frameRate: 60,
    });

    this.anims.create({
      key: "open_right_next_closest",
      frames: openRightFramesNextClosest,
      frameRate: 60,
    });
  }

  createDNA() {
    this.DNA_strand = [];

    const numDNApieces = 25;

    for (var i = 0; i < numDNApieces; i++) {
      const DNApiece = this.add
        .sprite(0, 0, "DNA_animation")
        .setOrigin(0.44, 0.5);
      DNApiece.setFrame("open_left_10001.png");
      DNApiece.x = i * DNApiece.width * 0.68;
      DNApiece.y = this.DNAposY;
      this.DNA_strand.push(DNApiece);
      DNApiece.startingX = DNApiece.x;
      DNApiece.startingY = DNApiece.y;
    }

    this.DNApieceWidth = this.DNA_strand[0].width * 0.68;
  }

  createRNAPoly() {
    this.RNApoly = this.add
      .sprite(
        0.5 * game.config.width,
        0.7 * game.config.height,
        "RNA_polymerase"
      )
      .setScale(0.8)
      .setOrigin(0.5, 0.53)
      .setAlpha(0.6)
      .setInteractive();

    this.RNApoly.vx = 0;
    this.RNApoly.vy = 0;
    this.dragCoeff = 0.09;
    this.brownianMotionCoeff = 0.044;

    this.maxRNAPX =
      game.config.width - 0.5 * this.RNApoly.width * this.RNApoly.scaleX;
    this.maxRNAPY =
      game.config.height - 0.5 * this.RNApoly.height * this.RNApoly.scaleY;

    this.input.setDraggable(this.RNApoly);
  }

  createDragListeners() {
    this.input.on("dragstart", function (pointer, gameObject) {
      gameObject.vx = 0;
      gameObject.vy = 0;
      gameObject.isDragging = true;
    });

    this.RNApolyDragListener = this.input.on("drag", function (
      pointer,
      gameObject,
      dragX,
      dragY
    ) {
      if (gameObject.isDragging) {
        const objWidth = gameObject.width * gameObject.scaleX;
        const objHeight = gameObject.height * gameObject.scaleY;

        const clampedDragX = Math.min(
          Math.max(0.5 * objWidth, dragX),
          game.config.width - 0.5 * objWidth
        );

        const clampedDragY = Math.min(
          Math.max(0.5 * objHeight, dragY),
          game.config.height - 0.5 * objHeight
        );

        gameObject.vx = clampedDragX - gameObject.x;
        gameObject.vy = clampedDragY - gameObject.y;

        gameObject.x = clampedDragX;
        gameObject.y = clampedDragY;
      }
    });

    this.input.on("dragend", function (pointer, gameObject) {
      gameObject.isDragging = false;
    });
  }

  createInstructionBox() {
    const instructionBoxGraphicsX = 0.053 * game.config.width;
    const instructionBoxGraphicsY = 0.59 * game.config.height;
    const instructionBoxGraphicsWidth = 0.256 * game.config.width;
    const instructionBoxGraphicsHeight = 0.16 * game.config.height;

    this.instructionBoxGroup = this.add.group();

    this.instructionBoxGroup.add(
      this.add
        .sprite(
          instructionBoxGraphicsX + 0.53 * instructionBoxGraphicsWidth,
          instructionBoxGraphicsY + 0.55 * instructionBoxGraphicsHeight,
          "arrow"
        )
        .setOrigin(0.5, 1)
        .setScale(0.5)
        .setRotation((-15 * Math.PI) / 180)
    );

    const instructionBoxGraphics = this.add.graphics();

    instructionBoxGraphics.fillStyle(0x1ab5b5);
    instructionBoxGraphics.fillRoundedRect(
      instructionBoxGraphicsX,
      instructionBoxGraphicsY,
      instructionBoxGraphicsWidth,
      instructionBoxGraphicsHeight,
      16
    );

    this.instructionBoxGroup.add(instructionBoxGraphics);

    var add = this.add;

    WebFont.load({
      google: {
        families: ["Lato"],
      },
      active: function () {
        add.text(
          instructionBoxGraphicsX + 16,
          instructionBoxGraphicsY + 14,
          "Move the RNA polymerase\nonto the promoter region\nto begin transcription",
          {
            fontFamily: "Lato",
            fontSize: 18,
            color: "#ffffff",
            align: "center",
          }
        );
      },
    });
  }

  createPromoterBox() {
    const promoterWidth = 0.19 * game.config.width;
    const promoterHeight = 0.1 * game.config.height;
    this.promoterBox = this.add.graphics();
    this.promoterBox.setDepth(-1);
    this.promoterBox.fillStyle(0xdad5e6);
    this.promoterBox.fillRect(
      this.promoterX - 0.5 * promoterWidth,
      this.DNAposY - 0.5 * promoterHeight,
      promoterWidth,
      promoterHeight
    );
  }

  update(time, delta) {
    if (this.isRNApolyLockedIn) {
      this.updateDNAframes();
    } else {
      if (this.RNApoly.isDragging) {
      } else {
        const timeFactor = (delta * 60) / 1000;
        this.updateRNApolyKinematics(timeFactor);
        this.checkRNApolyBoundaries();
      }

      this.checkIfRNApolyLockedIn();
    }
  }

  updateRNApolyKinematics(timeFactor) {
    this.RNApoly.vx *= 1 - this.dragCoeff * timeFactor;
    this.RNApoly.vy *= 1 - this.dragCoeff * timeFactor;
    this.RNApoly.x += this.RNApoly.vx * timeFactor;
    this.RNApoly.y += this.RNApoly.vy * timeFactor;
    this.RNApoly.vx +=
      timeFactor *
      (-this.brownianMotionCoeff +
        2 * this.brownianMotionCoeff * Math.random());
    this.RNApoly.vy +=
      timeFactor *
      (-this.brownianMotionCoeff +
        2 * this.brownianMotionCoeff * Math.random());
  }

  checkRNApolyBoundaries() {
    if (this.RNApoly.x > this.maxRNAPX) {
      this.RNApoly.x -= 2 * (this.RNApoly.x - this.maxRNAPX);
      this.RNApoly.vx *= -1;
    } else if (
      this.RNApoly.x <
      0.5 * this.RNApoly.width * this.RNApoly.scaleX
    ) {
      this.RNApoly.x -=
        2 * this.RNApoly.x - this.RNApoly.width * this.RNApoly.scaleX;
      this.RNApoly.vx *= -1;
    }

    if (this.RNApoly.y > this.maxRNAPY) {
      this.RNApoly.y -= 2 * (this.RNApoly.y - this.maxRNAPY);
      this.RNApoly.vy *= -1;
    } else if (
      this.RNApoly.y <
      0.5 * this.RNApoly.height * this.RNApoly.scaleY
    ) {
      this.RNApoly.y -=
        2 * this.RNApoly.y - this.RNApoly.height * this.RNApoly.scaleY;
      this.RNApoly.vy *= -1;
    }
  }

  checkIfRNApolyLockedIn() {
    const deltaX = this.RNApoly.x - this.promoterX;
    const deltaY = this.RNApoly.y - this.DNAposY;
    const distance = Math.pow(deltaX * deltaX + deltaY * deltaY, 0.5);

    if (distance < 0.025 * game.config.width) {
      this.snapInRNApoly();
    }
  }

  snapInRNApoly() {
    this.isRNApolyLockedIn = true;
    this.input.disable(this.RNApoly);

    this.RNApoly.isDragging = false;

    this.tweens.add({
      targets: this.RNApoly,
      x: this.promoterX,
      y: this.DNAposY,
      duration: 250,
      ease: "Sine.easeOut",
    });

    this.promoterBox.setVisible(false);
    this.instructionBoxGroup.clear(true);

    // this.playDNAopeningAnim();
  }

  playDNAopeningAnim() {
    this.DNA_strand[1].play("open_right_next_closest");
    this.DNA_strand[2].play("open_right_closest");
    this.DNA_strand[3].play("open_both");
    this.DNA_strand[4].play("open_left_closest");
    this.DNA_strand[5].play("open_left_next_closest");
  }

  updateDNAframes() {
    let indexForSmallestDeltaX = 0;
    let smallestDeltaXfromRNAtoDNA;

    for (var i = 0; i < this.DNA_strand.length; i++) {
      const DNAsection = this.DNA_strand[i];
      const deltaX = this.RNApoly.x - DNAsection.startingX;

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
