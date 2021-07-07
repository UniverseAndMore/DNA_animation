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
    this.cameras.main.setBackgroundColor("#f0fffe");

    this.isRNApolyLockedIn = false;
    this.DNAopen = false;
    this.DNAposY = 0.35 * game.config.height;
    this.promoterX = 0.141 * game.config.width;

    this.loadWebFonts();
    this.createAnimations();

    this.createDNA();
    this.createRNAPoly();
    this.createPromoterBox();
    this.createDragListeners();

    this.createZoomBox();
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

  createDNA() {
    this.DNAcontainer = this.add.container();
    this.DNAcontainer.y = this.DNAposY;
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
      this.DNAposY - 0.5 * promoterHeight,
      promoterWidth,
      promoterHeight
    );
  }

  update(time, delta) {
    if (this.isRNApolyLockedIn) {
      if (this.DNAopen) {
        this.updateDNAframes();
      }
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

  /**************ZOOM BOX**************/
  createZoomBox() {
    this.smallBoxWidth = 0.05 * game.config.width;
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
        this.DNAposY - 0.5 * this.smallBoxHeight,
        0,
        0,
        this.smallBoxWidth,
        0,
        0x44336a
      )
      .setOrigin(0)
      .setRotation((20.4 * Math.PI) / 180)
      .setScale(0, 1);

    this.smallBoxLineTR = this.add
      .line(
        this.promoterX + 0.5 * this.smallBoxWidth,
        this.DNAposY - 0.5 * this.smallBoxHeight,
        0,
        0,
        this.smallBoxWidth,
        0,
        0x44336a
      )
      .setOrigin(0)
      .setRotation((4.8 * Math.PI) / 180)
      .setScale(0, 1);

    this.smallBoxLineBL = this.add
      .line(
        this.promoterX - 0.5 * this.smallBoxWidth,
        this.DNAposY + 0.5 * this.smallBoxHeight,
        0,
        0,
        this.smallBoxWidth,
        0,
        0x44336a
      )
      .setOrigin(0)
      .setRotation((72.1 * Math.PI) / 180)
      .setScale(0, 1);

    this.smallBoxLineBR = this.add
      .line(
        this.promoterX + 0.5 * this.smallBoxWidth,
        this.DNAposY + 0.5 * this.smallBoxHeight,
        0,
        0,
        this.smallBoxWidth,
        0,
        0x44336a
      )
      .setOrigin(0)
      .setRotation((35 * Math.PI) / 180)
      .setScale(0, 1);

    this.smallBoxLineTL.setLineWidth(1.5, 3);
    this.smallBoxLineTR.setLineWidth(1.5, 3);
    this.smallBoxLineBL.setLineWidth(1.5, 3);
    this.smallBoxLineBR.setLineWidth(1.5, 3);

    this.smallBoxContainer.add(this.smallBoxBorder);

    this.smallBoxContainer.setVisible(false);

    this.smallBoxContainer.x = this.promoterX;
    this.smallBoxContainer.y = this.DNAposY;

    this.zoomBoxContainer = this.add.container();

    this.zoomBoxBG = this.add.graphics();
    this.zoomBoxBG.fillStyle(0xafcfd8);
    this.zoomBoxBG.fillRect(
      -0.5 * this.smallBoxWidth,
      -0.5 * this.smallBoxHeight,
      this.smallBoxWidth,
      this.smallBoxHeight
    );

    this.zoomBoxBG.setAlpha(0);

    this.zoomBoxBorder = this.add.graphics();
    this.zoomBoxBorder.lineStyle(0.7, 0x44336a);
    this.zoomBoxBorder.strokeRect(
      -0.5 * this.smallBoxWidth,
      -0.5 * this.smallBoxHeight,
      this.smallBoxWidth,
      this.smallBoxHeight
    );

    this.zoomBoxContainer.add(this.zoomBoxBG);
    this.zoomBoxContainer.add(this.zoomBoxBorder);

    this.zoomBoxContainer.setVisible(false);

    this.zoomBoxContainer.x = this.promoterX;
    this.zoomBoxContainer.y = this.DNAposY;
  }

  showSmallBox() {
    this.smallBoxContainer.setVisible(true);
    this.smallBoxContainer.setAlpha(0);

    this.tweens.add({
      targets: this.smallBoxContainer,
      alpha: 1,
      duration: 800,
      onComplete: this.expandZoomBox,
      onCompleteScope: this,
    });
  }

  expandZoomBox() {
    this.zoomBoxContainer.setVisible(true);

    this.tweens.add({
      targets: this.zoomBoxContainer,
      x: 0.5 * game.config.width,
      y: 0.61 * game.config.height,
      scale: 10,
      duration: 800,
    });

    this.tweens.add({
      targets: this.RNApoly,
      y: 0.2 * game.config.height,
      duration: 800,
    });

    this.tweens.add({
      targets: this.DNAcontainer,
      y: 0.2 * game.config.height,
      duration: 800,
    });

    this.tweens.add({
      targets: this.smallBoxContainer,
      y: 0.2 * game.config.height,
      duration: 800,
    });

    this.tweens.add({
      targets: this.zoomBoxBG,
      alpha: 1,
      duration: 800,
    });

    this.tweens.add({
      targets: this.smallBoxLineTL,
      y: 0.2 * game.config.height - 0.5 * this.smallBoxHeight,
      scaleX: 3,
      duration: 800,
    });

    this.tweens.add({
      targets: this.smallBoxLineTR,
      y: 0.2 * game.config.height - 0.5 * this.smallBoxHeight,
      scaleX: 11.75,
      duration: 800,
    });

    this.tweens.add({
      targets: this.smallBoxLineBL,
      y: 0.2 * game.config.height + 0.5 * this.smallBoxHeight,
      scaleX: 8.65,
      duration: 800,
    });

    this.tweens.add({
      targets: this.smallBoxLineBR,
      y: 0.2 * game.config.height + 0.5 * this.smallBoxHeight,
      scaleX: 14,
      duration: 800,
    });
  }
}
