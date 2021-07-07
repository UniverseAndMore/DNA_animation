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

    this.load.multiatlas(
      "transcription_graphics",
      "./images/spritesheets/transcriptionGraphics.json",
      "./images/spritesheets"
    );

    this.load.script(
      "webfont",
      "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
    );
  }

  create() {
    this.cameras.main.setBackgroundColor("#f0fffe");

    this.DNAposY1 = 0.35 * game.config.height;
    this.DNAposY2 = 0.14 * game.config.height;

    this.promoterX = 0.141 * game.config.width;

    this.topDNAnucleotides = ["A", "T", "C", "G", "T"];
    this.bottomDNAnucleotides = this.createBottomDNAnucleotides(
      this.topDNAnucleotides
    );

    this.isRNApolyLockedIn = false;
    this.DNAopen = false;

    this.loadWebFonts();
    this.createAnimations();

    this.createDNAStrand();
    this.createRNAPoly();
    this.createPromoterBox();

    this.createSmallBox();
    this.createGameBox();

    this.createDragListeners();

    this.createFreeNucleotides();
  }

  update(time, delta) {
    const timeFactor = (delta * 60) / 1000;
    if (this.isRNApolyLockedIn) {
      if (this.DNAopen) {
        this.updateDNAframes();
      }
    } else {
      if (this.RNApoly.isDragging) {
      } else {
        this.updateRNApolyKinematics(timeFactor);
        this.checkRNAPolyBoundaries();
      }

      this.checkIfRNAPolyLockedIn();
    }

    this.updateNucleotideKinematics(timeFactor);
  }

  loadWebFonts() {
    this.events.on("WEBFONT_LOADED", this.createInstructionBox, this);

    var scene = this;

    WebFont.load({
      google: {
        families: ["Lato"],
      },
      active: function () {
        scene.events.emit("WEBFONT_LOADED");
      },
    });
  }

  createBottomDNAnucleotides(topDNAnucleotides) {
    const retVal = [];

    for (var i = 0; i < topDNAnucleotides.length; i++) {
      let bottomNucleotide;
      switch (topDNAnucleotides[i]) {
        case "A":
          bottomNucleotide = "T";
          break;

        case "T":
          bottomNucleotide = "A";
          break;

        case "G":
          bottomNucleotide = "C";
          break;

        case "C":
          bottomNucleotide = "G";
          break;

        default:
          break;
      }

      retVal.push(bottomNucleotide);
    }

    return retVal;
  }

  createAnimations() {
    const openBothFrames = [];
    const openLeft1Frames = [];
    const openRight1Frames = [];
    const openLeft2Frames = [];
    const openRight2Frames = [];

    for (var i = 1; i <= 30; i++) {
      let frameNameBoth = "open_both";
      let frameNameLeft1 = "open_left_1";
      let frameNameRight1 = "open_right_1";
      let frameNameLeft2 = "open_left_2";
      let frameNameRight2 = "open_right_2";
      if (i < 10) {
        frameNameBoth += "000" + String(i) + ".png";
        frameNameLeft1 += "000" + String(i) + ".png";
        frameNameRight1 += "000" + String(i) + ".png";
        frameNameLeft2 += "000" + String(i) + ".png";
        frameNameRight2 += "000" + String(i) + ".png";
      } else {
        frameNameBoth += "00" + String(i) + ".png";
        frameNameLeft1 += "00" + String(i) + ".png";
        frameNameRight1 += "00" + String(i) + ".png";
        frameNameLeft2 += "00" + String(i) + ".png";
        frameNameRight2 += "00" + String(i) + ".png";
      }

      openBothFrames.push({ key: "DNA_animation", frame: frameNameBoth });
      openLeft1Frames.push({
        key: "DNA_animation",
        frame: frameNameLeft1,
      });
      openRight1Frames.push({
        key: "DNA_animation",
        frame: frameNameRight1,
      });
      openLeft2Frames.push({
        key: "DNA_animation",
        frame: frameNameLeft2,
      });
      openRight2Frames.push({
        key: "DNA_animation",
        frame: frameNameRight2,
      });
    }

    const frameRate1 = 60;
    const frameRate2 = 15;

    this.anims.create({
      key: "open_both",
      frames: openBothFrames,
      frameRate: frameRate1,
    });

    this.anims.create({
      key: "open_left_closest_1",
      frames: openLeft1Frames,
      frameRate: frameRate1,
    });

    this.anims.create({
      key: "open_right_closest_1",
      frames: openRight1Frames,
      frameRate: frameRate1,
    });

    this.anims.create({
      key: "open_left_closest_2",
      frames: openLeft2Frames.slice(0, 15),
      frameRate: frameRate2,
    });

    this.anims.create({
      key: "open_right_closest_2",
      frames: openRight2Frames.slice(0, 15),
      frameRate: frameRate2,
    });

    this.anims.create({
      key: "open_left_next_closest_2",
      frames: openLeft1Frames.slice(0, 15),
      frameRate: frameRate2,
    });

    this.anims.create({
      key: "open_right_next_closest_2",
      frames: openRight1Frames.slice(0, 15),
      frameRate: frameRate2,
    });
  }

  createDNAStrand() {
    this.DNAcontainer = this.add.container();
    this.DNAcontainer.y = this.DNAposY1;
    this.DNA_strand = [];

    const numDNApieces = 25;

    for (var i = 0; i < numDNApieces; i++) {
      const DNApiece = this.add
        .sprite(0, 0, "DNA_animation")
        .setOrigin(0.44, 0.5);
      DNApiece.setFrame("open_left_10001.png");
      DNApiece.x = i * DNApiece.width * 0.68;
      this.DNA_strand.push(DNApiece);
      DNApiece.startingX = DNApiece.x;
      DNApiece.startingY = DNApiece.y;

      this.DNAcontainer.add(DNApiece);
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

    this.RNApoly.minX = 0.5 * this.RNApoly.width * this.RNApoly.scaleX;
    this.RNApoly.maxX = game.config.width - this.RNApoly.minX;
    this.RNApoly.minY = 0.5 * this.RNApoly.height * this.RNApoly.scaleY;
    this.RNApoly.maxY = game.config.height - this.RNApoly.minY;

    this.RNApoly.startingRotation = 0;

    this.RNApoly.vx = 0;
    this.RNApoly.vy = 0;
    this.RNApoly.brownianMotionCoeff = 0.05;
    this.RNApoly.dragCoeff = 0.09;

    this.RNApoly.sendToStartingPosOnRelease = false;
    this.RNApoly.bringToFrontOnDragStart = false;

    this.maxRNAPX =
      game.config.width - 0.5 * this.RNApoly.width * this.RNApoly.scaleX;
    this.maxRNAPY =
      game.config.height - 0.5 * this.RNApoly.height * this.RNApoly.scaleY;

    this.input.setDraggable(this.RNApoly);
  }

  createDragListeners() {
    var gameBoxContainer = this.gameBoxContainer;

    this.input.on("dragstart", function (pointer, gameObject) {
      if (gameObject.sendBackToStartTween) {
        gameObject.sendBackToStartTween.stop();
        gameObject.sendBackToStartTween = null;
        gameObject.tweenRunning = false;
      }

      gameObject.vx = 0;
      gameObject.vy = 0;
      gameObject.setRotation(0);
      gameObject.isDragging = true;

      if (gameObject.bringToFrontOnDragStart) {
        gameBoxContainer.bringToTop(gameObject);
      }
    });

    this.input.on("drag", function (pointer, gameObject, dragX, dragY) {
      if (gameObject.isDragging) {
        const clampedDragX = Math.min(
          Math.max(gameObject.minX, dragX),
          gameObject.maxX
        );

        const clampedDragY = Math.min(
          Math.max(gameObject.minY, dragY),
          gameObject.maxY
        );

        gameObject.vx = clampedDragX - gameObject.x;
        gameObject.vy = clampedDragY - gameObject.y;

        gameObject.x = clampedDragX;
        gameObject.y = clampedDragY;
      }
    });

    var scene = this;

    this.input.on("dragend", function (pointer, gameObject) {
      gameObject.isDragging = false;

      if (gameObject.sendToStartingPosOnRelease) {
        scene.sendBackToStartingPos(gameObject);
      }
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

    this.instructionBoxGroup.add(
      this.add.text(
        instructionBoxGraphicsX + 16,
        instructionBoxGraphicsY + 14,
        "Move the RNA polymerase\nonto the promoter region\nto begin transcription",
        {
          fontFamily: "Lato",
          fontSize: 18,
          color: "#ffffff",
          align: "center",
        }
      )
    );

    this.instructionBoxGroup.setDepth(-2);
  }

  createPromoterBox() {
    const promoterWidth = 0.19 * game.config.width;
    const promoterHeight = 0.1 * game.config.height;
    this.promoterBox = this.add.graphics();
    this.promoterBox.setDepth(-1);
    this.promoterBox.fillStyle(0xdad5e6);
    this.promoterBox.fillRect(
      this.promoterX - 0.5 * promoterWidth,
      this.DNAposY1 - 0.5 * promoterHeight,
      promoterWidth,
      promoterHeight
    );
  }

  updateRNApolyKinematics(timeFactor) {
    this.RNApoly.vx *= 1 - this.RNApoly.dragCoeff * timeFactor;
    this.RNApoly.vy *= 1 - this.RNApoly.dragCoeff * timeFactor;
    this.RNApoly.x += this.RNApoly.vx * timeFactor;
    this.RNApoly.y += this.RNApoly.vy * timeFactor;
    this.RNApoly.vx +=
      timeFactor *
      (-this.RNApoly.brownianMotionCoeff +
        2 * this.RNApoly.brownianMotionCoeff * Math.random());
    this.RNApoly.vy +=
      timeFactor *
      (-this.RNApoly.brownianMotionCoeff +
        2 * this.RNApoly.brownianMotionCoeff * Math.random());
  }

  updateNucleotideKinematics(timeFactor) {
    this.freeNucleotides.forEach((nucleotide) => {
      if (!nucleotide.tweenRunning && !nucleotide.isDragging) {
        nucleotide.vx *= 1 - nucleotide.dragCoeff * timeFactor;
        nucleotide.vy *= 1 - nucleotide.dragCoeff * timeFactor;

        nucleotide.x += nucleotide.vx * timeFactor;
        nucleotide.y += nucleotide.vy * timeFactor;

        if (nucleotide.x > nucleotide.maxStartingX) {
          nucleotide.x = nucleotide.maxStartingX;
          nucleotide.vx *= -1;
        } else if (nucleotide.x < nucleotide.minStartingX) {
          nucleotide.x = nucleotide.minStartingX;
          nucleotide.vx *= -1;
        }

        if (nucleotide.y > nucleotide.maxStartingY) {
          nucleotide.y = nucleotide.maxStartingY;
          nucleotide.vy *= -1;
        } else if (nucleotide.y < nucleotide.minStartingY) {
          nucleotide.y = nucleotide.minStartingY;
          nucleotide.vy *= -1;
        }

        nucleotide.vx +=
          timeFactor *
          (-nucleotide.brownianMotionCoeff +
            2 * nucleotide.brownianMotionCoeff * Math.random());
        nucleotide.vy +=
          timeFactor *
          (-nucleotide.brownianMotionCoeff +
            2 * nucleotide.brownianMotionCoeff * Math.random());
      }
    });
  }

  checkRNAPolyBoundaries() {
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

  checkIfRNAPolyLockedIn() {
    const deltaX = this.RNApoly.x - this.promoterX;
    const deltaY = this.RNApoly.y - this.DNAposY1;
    const distance = Math.pow(deltaX * deltaX + deltaY * deltaY, 0.5);

    if (distance < 0.025 * game.config.width) {
      this.snapInRNAPoly();
    }
  }

  snapInRNAPoly() {
    this.isRNApolyLockedIn = true;
    this.input.disable(this.RNApoly);

    this.RNApoly.isDragging = false;

    this.tweens.add({
      targets: this.RNApoly,
      x: this.promoterX,
      y: this.DNAposY1,
      duration: 250,
      ease: "Sine.easeOut",
    });

    this.promoterBox.setVisible(false);
    this.instructionBoxGroup.clear(true);
    this.instructionBoxGroup = null;

    this.playDNAopeningAnimPart1();
    this.showSmallBox();
  }

  playDNAopeningAnimPart1() {
    this.DNA_strand[2].x =
      this.DNA_strand[2].startingX - 0.157 * this.DNApieceWidth;
    this.DNA_strand[2].y =
      this.DNA_strand[2].startingY - 0.02 * this.DNApieceWidth;

    this.DNA_strand[3].x =
      this.DNA_strand[3].startingX - 0.11 * this.DNApieceWidth;
    this.DNA_strand[3].y =
      this.DNA_strand[3].startingY - 0.02 * this.DNApieceWidth;

    this.DNA_strand[2].play("open_right_closest_1");
    this.DNA_strand[3].play("open_both");
    this.DNA_strand[4].play("open_left_closest_1");

    this.DNA_strand[3].on(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      function () {
        this.playDNAopeningAnimPart2();
      },
      this
    );
  }

  playDNAopeningAnimPart2() {
    this.DNA_strand[1].x =
      this.DNA_strand[1].startingX - 0.157 * this.DNApieceWidth;
    this.DNA_strand[1].y =
      this.DNA_strand[1].startingY - 0.02 * this.DNApieceWidth;

    this.DNA_strand[2].x =
      this.DNA_strand[2].startingX - 0.22 * this.DNApieceWidth;
    this.DNA_strand[2].y =
      this.DNA_strand[2].startingY - 0.19 * this.DNApieceWidth;

    this.DNA_strand[4].x =
      this.DNA_strand[4].startingX - 0.26 * this.DNApieceWidth;
    this.DNA_strand[4].y =
      this.DNA_strand[4].startingY - 0.043 * this.DNApieceWidth;

    this.DNA_strand[1].play("open_right_next_closest_2");
    this.DNA_strand[2].play("open_right_closest_2");
    this.DNA_strand[4].play("open_left_closest_2");
    this.DNA_strand[5].play("open_left_next_closest_2");

    this.DNA_strand[5].on(
      Phaser.Animations.Events.ANIMATION_COMPLETE,
      function () {
        this.DNAopen = true;
      },
      this
    );
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

  /**************GAME BOX**************/
  createSmallBox() {
    this.smallBoxWidth = 0.0517 * game.config.width;
    this.smallBoxHeight = 0.04 * game.config.width;

    this.smallBoxContainer = this.add.container();

    this.smallBoxBorder = this.add.graphics();
    this.smallBoxBorder.lineStyle(3, 0x44336a);
    this.smallBoxBorder.strokeRect(
      -0.5 * this.smallBoxWidth,
      -0.5 * this.smallBoxHeight,
      this.smallBoxWidth,
      this.smallBoxHeight
    );

    this.smallBoxLineTL = this.add
      .line(
        this.promoterX - 0.5 * this.smallBoxWidth,
        this.DNAposY1 - 0.5 * this.smallBoxHeight,
        0,
        0,
        this.smallBoxWidth,
        0,
        0x44336a
      )
      .setOrigin(0)
      .setRotation((33.5 * Math.PI) / 180)
      .setScale(0, 1);

    this.smallBoxLineTR = this.add
      .line(
        this.promoterX + 0.5 * this.smallBoxWidth,
        this.DNAposY1 - 0.5 * this.smallBoxHeight,
        0,
        0,
        this.smallBoxWidth,
        0,
        0x44336a
      )
      .setOrigin(0)
      .setRotation((5.63 * Math.PI) / 180)
      .setScale(0, 1);

    this.smallBoxLineBL = this.add
      .line(
        this.promoterX - 0.5 * this.smallBoxWidth,
        this.DNAposY1 + 0.5 * this.smallBoxHeight,
        0,
        0,
        this.smallBoxWidth,
        0,
        0x44336a
      )
      .setOrigin(0)
      .setRotation((78 * Math.PI) / 180)
      .setScale(0, 1);

    this.smallBoxLineBR = this.add
      .line(
        this.promoterX + 0.5 * this.smallBoxWidth,
        this.DNAposY1 + 0.5 * this.smallBoxHeight,
        0,
        0,
        this.smallBoxWidth,
        0,
        0x44336a
      )
      .setOrigin(0)
      .setRotation((35.3 * Math.PI) / 180)
      .setScale(0, 1);

    this.smallBoxLineTL.setLineWidth(1.5, 2.8);
    this.smallBoxLineTR.setLineWidth(1.5, 2.8);
    this.smallBoxLineBL.setLineWidth(1.5, 2.8);
    this.smallBoxLineBR.setLineWidth(1.5, 2.8);

    this.smallBoxContainer.add(this.smallBoxBorder);

    this.smallBoxContainer.setVisible(false);

    this.smallBoxContainer.x = this.promoterX;
    this.smallBoxContainer.y = this.DNAposY1;
  }

  createGameBox() {
    this.gameBoxWidth = 0.58 * game.config.width;
    this.gameBoxHeight = 0.75 * game.config.height;

    this.gameBoxPosX = 0.5 * game.config.width;
    this.gameBoxPosY = 0.59 * game.config.height;

    this.zoomBoxContainer = this.add
      .container()
      .setScale(this.smallBoxWidth / this.gameBoxWidth);

    this.zoomBoxBorder = this.add.graphics();
    this.zoomBoxBorder.lineStyle(6, 0x44336a);
    this.zoomBoxBorder.strokeRect(
      -0.5 * this.gameBoxWidth,
      -0.5 * this.gameBoxHeight,
      this.gameBoxWidth,
      this.gameBoxHeight
    );

    this.gameBoxContainer = this.add.container();
    this.zoomBoxContainer.add(this.gameBoxContainer);
    this.zoomBoxContainer.add(this.zoomBoxBorder);

    this.gameBoxBG = this.add.graphics();
    this.gameBoxBG.fillStyle(0xafcfd8);
    this.gameBoxBG.fillRect(
      -0.5 * this.gameBoxWidth,
      -0.5 * this.gameBoxHeight,
      this.gameBoxWidth,
      this.gameBoxHeight
    );

    this.gameBoxContainer.setAlpha(0);

    this.gameBoxContainer.add(this.gameBoxBG);

    this.zoomBoxContainer.setVisible(false);

    this.zoomBoxContainer.x = this.promoterX;
    this.zoomBoxContainer.y = this.DNAposY1;

    const DNAstrandHeight = 0.06 * this.gameBoxHeight;
    const DNAstrandOffsetY = 0.44 * this.gameBoxHeight;

    this.DNAtopStrand = this.add.graphics();
    this.DNAtopStrand.fillStyle(0xa295c5);
    this.DNAtopStrand.fillRect(
      -0.5 * this.gameBoxWidth,
      -DNAstrandOffsetY - 0.5 * DNAstrandHeight,
      this.gameBoxWidth,
      DNAstrandHeight
    );

    this.DNAbottomStrand = this.add.graphics();
    this.DNAbottomStrand.fillStyle(0x63568f);
    this.DNAbottomStrand.fillRect(
      -0.5 * this.gameBoxWidth,
      DNAstrandOffsetY - 0.5 * DNAstrandHeight,
      this.gameBoxWidth,
      DNAstrandHeight
    );

    this.gameBoxContainer.add(this.DNAtopStrand);
    this.gameBoxContainer.add(this.DNAbottomStrand);

    this.nucleotideContainer = this.add.container();
    this.gameBoxContainer.add(this.nucleotideContainer);

    //*********CREATE DNA NUCLEOTIDES **********//
    this.DNAnucleotideMargin = 0.13 * this.gameBoxWidth;
    this.DNAnucleotideDeltaX =
      (this.gameBoxWidth - 2 * this.DNAnucleotideMargin) / 4;
    this.nucleotideBaseScale = 0.6;

    this.topDNAnucleotides.forEach((base, index) => {
      var topDNAnucleotide = this.add
        .sprite(
          -0.5 * this.gameBoxWidth +
            this.DNAnucleotideMargin +
            index * this.DNAnucleotideDeltaX,
          -DNAstrandOffsetY + 0.5 * DNAstrandHeight,
          "transcription_graphics",
          base + "top.png"
        )
        .setScale(this.nucleotideBaseScale)
        .setOrigin(0.5, 0.12);
      this.nucleotideContainer.add(topDNAnucleotide);
    });

    this.bottomDNAnucleotides.forEach((base, index) => {
      var bottomDNAnucleotide = this.add
        .sprite(
          -0.5 * this.gameBoxWidth +
            this.DNAnucleotideMargin +
            index * this.DNAnucleotideDeltaX,
          DNAstrandOffsetY - 0.5 * DNAstrandHeight,
          "transcription_graphics",
          base + "bottom.png"
        )
        .setScale(this.nucleotideBaseScale)
        .setOrigin(0.5, 0.88);
      this.nucleotideContainer.add(bottomDNAnucleotide);
    });
  }

  showSmallBox() {
    this.smallBoxContainer.setVisible(true);
    this.smallBoxContainer.setAlpha(0);

    this.tweens.add({
      targets: this.smallBoxContainer,
      alpha: 1,
      duration: 500,
      delay: 400,
      onComplete: this.expandZoomBox,
      onCompleteScope: this,
    });
  }

  expandZoomBox() {
    this.zoomBoxContainer.setVisible(true);

    this.tweens.add({
      targets: this.zoomBoxContainer,
      x: this.gameBoxPosX,
      y: this.gameBoxPosY,
      scale: 1,
      duration: 800,
      ease: "Sine.Out",
      onComplete: this.showFreeNucleotides,
      onCompleteScope: this,
    });

    this.tweens.add({
      targets: this.RNApoly,
      y: this.DNAposY2,
      duration: 800,
      ease: "Sine.Out",
    });

    this.tweens.add({
      targets: this.DNAcontainer,
      y: this.DNAposY2,
      duration: 800,
      ease: "Sine.Out",
    });

    this.tweens.add({
      targets: this.smallBoxContainer,
      y: this.DNAposY2,
      duration: 800,
      ease: "Sine.Out",
    });

    this.tweens.add({
      targets: this.gameBoxContainer,
      alpha: 1,
      duration: 800,
      ease: "Sine.Out",
    });

    this.tweens.add({
      targets: this.smallBoxLineTL,
      y: this.DNAposY2 - 0.5 * this.smallBoxHeight,
      scaleX: 2.36,
      duration: 800,
      ease: "Sine.Out",
    });

    this.tweens.add({
      targets: this.smallBoxLineTR,
      y: this.DNAposY2 - 0.5 * this.smallBoxHeight,
      scaleX: 12.15,
      duration: 800,
      ease: "Sine.Out",
    });

    this.tweens.add({
      targets: this.smallBoxLineBL,
      y: this.DNAposY2 + 0.5 * this.smallBoxHeight,
      scaleX: 8.82,
      duration: 800,
      ease: "Sine.Out",
    });

    this.tweens.add({
      targets: this.smallBoxLineBR,
      y: this.DNAposY2 + 0.5 * this.smallBoxHeight,
      scaleX: 14.8,
      duration: 800,
      ease: "Sine.Out",
    });
  }

  createFreeNucleotides() {
    this.freeNucleotides = [];

    const nucleotidesToCreate = ["A", "T", "G", "C", "U"];
    const nucleotideRotations = [-5, 4, 2, -3, 6];

    this.nucleotideMarginL = 0.15 * this.gameBoxWidth;
    this.nucleotideMarginR = 0.15 * this.gameBoxWidth;
    this.nucleotideDeltaX =
      (this.gameBoxWidth - this.nucleotideMarginL - this.nucleotideMarginR) / 4;

    this.nucleotideOddY = -0.13 * this.gameBoxHeight;
    this.nucleotideEvenY = -0.04 * this.gameBoxHeight;

    nucleotidesToCreate.forEach((base, index) => {
      this.createFreeNucleotide(
        base,
        index,
        -0.5 * this.gameBoxWidth +
          this.nucleotideMarginL +
          index * this.nucleotideDeltaX,
        index % 2 === 0 ? this.nucleotideOddY : this.nucleotideEvenY,
        nucleotideRotations[index]
      );
    });
  }

  createFreeNucleotide(base, index, x, y, rotation) {
    let nucleotide = this.add.container().setScale(0);

    nucleotide.sendToStartingPosOnRelease = true;
    nucleotide.bringToFrontOnDragStart = true;

    nucleotide.x = x;
    nucleotide.y = y;

    nucleotide.vx = 0;
    nucleotide.vy = 0;

    nucleotide.setRotation((rotation * Math.PI) / 180);

    nucleotide.base = base;
    nucleotide.index = index;
    nucleotide.startingX = nucleotide.x;
    nucleotide.startingY = nucleotide.y;
    nucleotide.startingRotation = nucleotide.rotation;

    nucleotide.brownianMotionCoeff = 0.04;
    nucleotide.dragCoeff = 0.1;

    const maxStartingDeltaPos = 0.02 * this.gameBoxWidth;

    nucleotide.minStartingX = nucleotide.x - maxStartingDeltaPos;
    nucleotide.maxStartingX = nucleotide.x + maxStartingDeltaPos;
    nucleotide.minStartingY = nucleotide.y - maxStartingDeltaPos;
    nucleotide.maxStartingY = nucleotide.y + maxStartingDeltaPos;

    const connectorType = base === "T" ? "DNA" : "RNA";

    const graphicsOffsetX = 0.038 * this.gameBoxWidth;
    const graphicsOffsetY = 0.031 * this.gameBoxHeight;

    nucleotide.connectorL = this.add
      .sprite(
        graphicsOffsetX,
        graphicsOffsetY,
        "transcription_graphics",
        connectorType + "connector.png"
      )
      .setOrigin(0.68, 1.85);
    nucleotide.connectorR = this.add
      .sprite(
        graphicsOffsetX,
        graphicsOffsetY,
        "transcription_graphics",
        connectorType + "connector.png"
      )
      .setOrigin(0.68, 1.85);
    nucleotide.baseGraphic = this.add.sprite(
      graphicsOffsetX,
      graphicsOffsetY,
      "transcription_graphics",
      base + "top.png"
    );

    nucleotide.add(nucleotide.connectorL);
    nucleotide.add(nucleotide.connectorR);
    nucleotide.add(nucleotide.baseGraphic);

    nucleotide.setSize(0.23 * this.gameBoxWidth, 0.29 * this.gameBoxHeight);

    nucleotide.minX =
      0.5 * (-this.gameBoxWidth + nucleotide.width * this.nucleotideBaseScale);
    nucleotide.maxX =
      0.5 * (this.gameBoxWidth - nucleotide.width * this.nucleotideBaseScale);
    nucleotide.minY =
      0.5 *
      (-this.gameBoxHeight + nucleotide.height * this.nucleotideBaseScale);
    nucleotide.maxY =
      0.5 * (this.gameBoxHeight - nucleotide.height * this.nucleotideBaseScale);

    this.gameBoxContainer.add(nucleotide);

    this.freeNucleotides.push(nucleotide);
  }

  showFreeNucleotides() {
    this.freeNucleotides.forEach((nucleotide, index) => {
      nucleotide.tweenRunning = true;

      this.tweens.add({
        targets: nucleotide,
        scale: this.nucleotideBaseScale,
        duration: 400,
        delay: index * 200,
        ease: "Back.Out",
        onComplete: this.activateFreeNucleotide,
        onCompleteScope: this,
        onCompleteParams: nucleotide,
      });
    });
  }

  activateFreeNucleotide(tween) {
    const nucleotide = tween.targets[0];

    nucleotide.tweenRunning = false;
    nucleotide.vx = 0;
    nucleotide.vy = 0;

    nucleotide.setInteractive();
    this.input.setDraggable(nucleotide);
  }

  sendBackToStartingPos(nucleotide) {
    const deltaX = nucleotide.x - nucleotide.startingX;
    const deltaY = nucleotide.y - nucleotide.startingY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    nucleotide.sendBackToStartTween = this.tweens.add({
      targets: nucleotide,
      x: nucleotide.startingX,
      y: nucleotide.startingY,
      rotation: nucleotide.startingRotation,
      duration: 3.5 * distance,
      ease: "Quad.easeInOut",
      onComplete: this.nucleotideTweenComplete,
      onCompleteScope: this,
      onCompleteParams: nucleotide,
    });

    nucleotide.tweenRunning = true;
  }

  nucleotideTweenComplete(tween) {
    const nucleotide = tween.targets[0];
    nucleotide.vx = 0;
    nucleotide.vy = 0;
    nucleotide.tweenRunning = false;
  }
}
