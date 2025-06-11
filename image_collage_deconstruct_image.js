let images = [];
let placingImage = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
  background(255);

  select("#imgUpload").changed(handleImageUpload);
  select("#saveBtn").mousePressed(() => saveCanvas("collage", "png"));
  select("#clearBtn").mousePressed(() => {
    images = [];
    placingImage = null;
    background(255);
  });
}

function draw() {
  background(255);

  for (let imgObj of images) {
    image(imgObj.img, imgObj.x, imgObj.y, imgObj.w, imgObj.h);
  }

  if (placingImage) {
    image(placingImage.img, mouseX - placingImage.w / 2, mouseY - placingImage.h / 2, placingImage.w, placingImage.h);
  }
}

function mousePressed() {
  if (placingImage) {
    placingImage.x = mouseX - placingImage.w / 2;
    placingImage.y = mouseY - placingImage.h / 2;
    images.push(placingImage);
    placingImage = null;
  } else {
    for (let imgObj of images) {
      if (
        mouseX > imgObj.x &&
        mouseX < imgObj.x + imgObj.w &&
        mouseY > imgObj.y &&
        mouseY < imgObj.y + imgObj.h
      ) {
        processImage(imgObj); // scramble + cutout
        break;
      }
    }
  }
}

function handleImageUpload() {
  let file = select("#imgUpload").elt.files[0];
  if (file && file.type === "image/png") {
    let reader = new FileReader();
    reader.onload = (e) => {
      loadImage(e.target.result, (img) => {
        let scaledW = img.width / 4;
        let scaledH = img.height / 4;
        placingImage = {
          img,
          x: null,
          y: null,
          w: scaledW,
          h: scaledH
        };
      });
    };
    reader.readAsDataURL(file);
  }
}

function processImage(imgObj) {
  let g = createGraphics(imgObj.w, imgObj.h);
  g.image(imgObj.img, 0, 0, imgObj.w, imgObj.h);
  g.loadPixels();

  // Scramble blocks
  let blockSize = 10;
  let blocks = [];
  for (let y = 0; y < g.height; y += blockSize) {
    for (let x = 0; x < g.width; x += blockSize) {
      let block = g.get(x, y, blockSize, blockSize);
      blocks.push({ block, x, y });
    }
  }
  shuffle(blocks, true);
  for (let i = 0; i < blocks.length; i++) {
    let targetX = blocks[i].x;
    let targetY = blocks[i].y;
    let srcBlock = blocks[(i + floor(random(blocks.length))) % blocks.length].block;
    g.image(srcBlock, targetX, targetY);
  }

  // Apply transparent cutouts
  let mask = createGraphics(imgObj.w, imgObj.h);
  mask.clear();
  for (let i = 0; i < 10; i++) {
    let cx = random(imgObj.w);
    let cy = random(imgObj.h);
    let r = random(30, 80);
    drawBlobbyMask(mask, cx, cy, r);
  }

  let scrambled = g.get();
  scrambled.mask(mask);
  imgObj.img = scrambled;
}

// Draw noisy roundish shape
function drawBlobbyMask(pg, x, y, radius) {
  pg.noStroke();
  pg.fill(0);
  pg.beginShape();
  let noiseScale = 0.5;
  for (let a = 0; a < TWO_PI; a += 0.1) {
    let offset = noise(x * noiseScale + cos(a), y * noiseScale + sin(a));
    let r = radius * 0.5 + offset * radius;
    let sx = x + cos(a) * r;
    let sy = y + sin(a) * r;
    pg.vertex(sx, sy);
  }
  pg.endShape(CLOSE);
}
