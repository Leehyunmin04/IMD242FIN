// 종횡비를 고정하고 싶을 경우: 아래 두 변수를 0이 아닌 원하는 종, 횡 비율값으로 설정.
// 종횡비를 고정하고 싶지 않을 경우: 아래 두 변수 중 어느 하나라도 0으로 설정.
const aspectW = 3;
const aspectH = 2;
// html에서 클래스명이 container-canvas인 첫 엘리먼트: 컨테이너 가져오기.
const container = document.body.querySelector('.container-canvas');
// 필요에 따라 이하에 변수 생성.

// 카메라
let handPose;
let video;
const videoW = 640;
const videoH = 480;
let hands = [];
let snowflakeImg, icecubeImg;
let topImage;

let particles = [];

// 카메라
// Callback function for when handPose outputs data
function gotHands(results) {
  hands = results;
}
// 카메라

// function videoScale() {
//   return width / height > videoW / videoH ? width / videoW : height / videoH;
// }

// function preload() {
//   // Load the handPose model
//   handPose = ml5.handPose({
//     maxHands: 6,
//     flipped: true,
//   });
// }

class Particle {
  constructor(x, y, shape) {
    this.x = x;
    this.y = y;
    this.size = random(0.5, 10);
    this.life = 500;
    this.shape = shape;
    this.vx = random(-1, 1);
    this.vy = random(-4, -0.5);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 5;
  }

  display() {
    noStroke();
    if (this.shape === 'circle' && random() < 0.7) {
      ellipse(this.x, this.y, this.size);
      if (this.size < 1) {
        image(icecubeImg, this.x, this.y, this.size * 50, this.size * 50);
      }
    } else if (this.shape === 'rect' && random() < 0.7) {
      rect(this.x, this.y, this.size, this.size);
      if (this.size < 1) {
        image(snowflakeImg, this.x, this.y, this.size * 70, this.size * 70);
      }
    }
  }

  isDead() {
    return this.life <= 0;
  }
}

function preload() {
  handPose = ml5.handPose({
    maxHands: 6,
    flipped: true,
  });
  snowflakeImg = loadImage('assets/ic.png');
  icecubeImg = loadImage('assets/snow.png');
  topImage = loadImage('assets/screen.png');
}

// 카메라

function setup() {
  // 카메라
  video = createCapture(VIDEO, { flipped: true });
  video.size(videoW, videoH);
  video.hide();
  // start detecting hands from the webcam video
  handPose.detectStart(video, gotHands);
  // 카메라

  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();
  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  if (aspectW === 0 || aspectH === 0) {
    createCanvas(containerW, containerH).parent(container);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else if (containerW / containerH > aspectW / aspectH) {
    createCanvas((containerH * aspectW) / aspectH, containerH).parent(
      container
    );
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스를 생성하고, 컨테이너의 자녀로 설정.
  else {
    createCanvas(containerW, (containerW * aspectH) / aspectW).parent(
      container
    );
  }
  init();
  // createCanvas를 제외한 나머지 구문을 여기 혹은 init()에 작성.
}

// windowResized()에서 setup()에 준하는 구문을 실행해야할 경우를 대비해 init이라는 명칭의 함수를 만들어 둠.
function init() {}

function draw() {
  // 카메라
  // Draw the webcam video
  tint(170, 190, 230);

  image(video, 0, 0, width, height);
  noTint();

  image(topImage, 0, 0, width, height);

  const scaleX = width / videoW;
  const scaleY = height / videoH;

  // Draw all the tracked hand points
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];

    const palm = hand.keypoints[9];
    const palmM = hand.keypoints[0];
    // const handT = hand.keypoints[12];

    const minX = min(palm.x, palmM.x) * scaleX;
    const maxX = max(palm.x, palmM.x) * scaleX;
    const minY = min(palm.y, palmM.y) * scaleY;
    const maxY = max(palm.y, palmM.y) * scaleY;

    for (let j = 0; j < 10; j++) {
      const x = random(minX, maxX);
      const y = random(minY, maxY);

      if (hands.length === 2) {
        const otherPalm = hands[(i + 1) % 2].keypoints[9];
        const otherX = otherPalm.x * scaleX;
        const otherY = otherPalm.y * scaleY;
        const distance = dist(x, y, otherX, otherY);

        if (distance < 500) {
          fill(190, 220, 255, 200);
          particles.push(new Particle(x, y, 'rect'));
          image(snowflakeImg, this.x, this.y, this.size, this.size);
        } else {
          fill(255, 255, 255, 200);
          particles.push(new Particle(x, y, 'circle'));
        }
      } else {
        particles.push(new Particle(x, y, 'circle'));
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  //카메라

  // background('white');
  // circle(mouseX, mouseY, 50);
}

function windowResized() {
  // 컨테이너의 현재 위치, 크기 등의 정보 가져와서 객체구조분해할당을 통해 너비, 높이 정보를 변수로 추출.
  const { width: containerW, height: containerH } =
    container.getBoundingClientRect();
  // 종횡비가 설정되지 않은 경우:
  // 컨테이너의 크기와 일치하도록 캔버스 크기를 조정.
  if (aspectW === 0 || aspectH === 0) {
    resizeCanvas(containerW, containerH);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 클 경우:
  // 컨테이너의 세로길이에 맞춰 종횡비대로 캔버스 크기를 조정.
  else if (containerW / containerH > aspectW / aspectH) {
    resizeCanvas((containerH * aspectW) / aspectH, containerH);
  }
  // 컨테이너의 가로 비율이 설정한 종횡비의 가로 비율보다 작거나 같을 경우:
  // 컨테이너의 가로길이에 맞춰 종횡비대로 캔버스 크기를 조정.
  else {
    resizeCanvas(containerW, (containerW * aspectH) / aspectW);
  }
  // 위 과정을 통해 캔버스 크기가 조정된 경우, 다시 처음부터 그려야할 수도 있다.
  // 이런 경우 setup()의 일부 구문을 init()에 작성해서 여기서 실행하는게 편리하다.
  // init();
  init();
  // Body.setPosition(walls[0], Vector.create(width * 0.5, -0.5 * wallThickness));
  // Body.setPosition(
  //   walls[1],
  //   Vector.create(width + 0.5 * wallThickness, height * 0.5)
  // );
  // Body.setPosition(
  //   walls[2],
  //   Vector.create(width * 0.5, height + 0.5 * wallThickness)
  // );
  // Body.setPosition(walls[3], Vector.create(-0.5 * wallThickness, height * 0.5));
}
