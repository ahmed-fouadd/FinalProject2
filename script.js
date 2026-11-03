const layers = ['Wall1.png', 'Wall2.png', 'Wall3.png', 'FinalWall.png'];
const ticket = document.getElementById('ticket');
const envelope = document.getElementById('envelope');
const assetError = document.getElementById('asset-error');
const introScreen = document.getElementById('intro-screen');
const beginButton = document.getElementById('begin-button');
const phoneScreen = document.getElementById('phone-screen');
const caption = document.getElementById('caption');
const restartButton = document.getElementById('restart-button');
const residentialOverlay = document.getElementById('residential-overlay');
const canvasWidth = 1366;
const canvasHeight = 768;
let current = 0;
let canScratch = false;
let step = 'intro';
let captionIndex = 0;
let suppressNextClick = false;
let draggedPointer = false;
let pointerOrigin = null;
let activeScratchPointer = null;
const wallImages = [];

const wallCaptions = [
  [
    { text: 'Huh, this paint job seems fresh.' },
    { text: 'I see a tiny crack, and it looks like it is peeling away pretty quickly.' },
    { text: 'Start peeling away at the paint!', centered: true }
  ],
  [
    { text: 'Wow, the outlets were painted over and used to be white.' }
  ],
  [
    { text: 'There seems to be something else painted over in the middle of the wall...' }
  ]
];

const canvases = layers.map(function (layer, i) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.className = 'layer-canvas';
  canvas.style.zIndex = String(layers.length - i);
  ticket.appendChild(canvas);
  const context = canvas.getContext('2d', { willReadFrequently: true });

  const image = new Image();
  wallImages[i] = image;
  image.onload = function () {
    context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
  };
  image.onerror = function () {
    assetError.textContent = `Unable to load ${layer}. Check that the image is in the project folder.`;
    assetError.hidden = false;
  };
  image.src = layer;
  return canvas;
});

function showCaption(index) {
  const captions = wallCaptions[index];
  captionIndex = 0;
  caption.hidden = false;
  caption.classList.remove('centered');
  caption.classList.remove('final-caption');
  setCaption(captions[captionIndex]);
  canScratch = false;
}

function setCaption(item) {
  caption.textContent = item.text;
  caption.classList.toggle('centered', Boolean(item.centered));
}

function advanceCaption() {
  if (current >= wallCaptions.length) return;

  const captions = wallCaptions[current];
  captionIndex++;

  if (captionIndex < captions.length) {
    setCaption(captions[captionIndex]);
    return;
  }

  caption.hidden = true;
  canScratch = true;
  step = 'scratching';
}

function showResidentialAgreement() {
  step = 'agreement';
  residentialOverlay.classList.add('visible');
  residentialOverlay.setAttribute('aria-hidden', 'false');
}

function closeResidentialAgreement() {
  residentialOverlay.classList.remove('visible');
  residentialOverlay.setAttribute('aria-hidden', 'true');
  envelope.hidden = true;
  step = 'final-inflation';
  caption.textContent = 'Rent in Boston, after adjusting for inflation, has gone up almost 3 times for apartments with minimal renovations.';
  caption.hidden = false;
  caption.classList.remove('centered');
  caption.classList.add('final-caption');
}

function beginStory() {
  if (step !== 'intro') return;
  step = 'phone';
  introScreen.hidden = true;
  phoneScreen.hidden = false;
}

beginButton.addEventListener('click', beginStory);
introScreen.addEventListener('click', beginStory);
introScreen.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    beginStory();
  }
});

phoneScreen.addEventListener('click', function (event) {
  if (step !== 'phone') return;
  step = 'wall1-caption';
  phoneScreen.hidden = true;
  showCaption(0);
  event.stopPropagation();
});

document.querySelector('.phone-card').addEventListener('click', function (event) {
  event.stopPropagation();
});

document.addEventListener('click', function () {
  if (suppressNextClick) {
    suppressNextClick = false;
    return;
  }

  if (step.endsWith('-caption')) {
    advanceCaption();
  } else if (step === 'final-inflation') {
    step = 'final-restart';
    caption.hidden = true;
    restartButton.hidden = false;
  }
});

document.addEventListener('pointerdown', function (event) {
  suppressNextClick = false;
  draggedPointer = false;
  pointerOrigin = { x: event.clientX, y: event.clientY };
});

document.addEventListener('pointermove', function (event) {
  if (!pointerOrigin || event.buttons === 0) return;
  const deltaX = event.clientX - pointerOrigin.x;
  const deltaY = event.clientY - pointerOrigin.y;
  if (deltaX * deltaX + deltaY * deltaY > 25) {
    draggedPointer = true;
  }
});

document.addEventListener('pointerup', function () {
  if (draggedPointer) {
    suppressNextClick = true;
  }
  pointerOrigin = null;
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && residentialOverlay.classList.contains('visible')) {
    closeResidentialAgreement();
  }
});

residentialOverlay.addEventListener('click', function (event) {
  closeResidentialAgreement();
  event.stopPropagation();
});

residentialOverlay.querySelector('img').addEventListener('click', function (event) {
  event.stopPropagation();
});

restartButton.addEventListener('click', function () {
  current = 0;
  canScratch = false;
  captionIndex = 0;
  step = 'intro';
  introScreen.hidden = false;
  phoneScreen.hidden = true;
  caption.hidden = true;
  caption.classList.remove('centered', 'final-caption');
  restartButton.hidden = true;
  envelope.hidden = true;
  ticket.classList.remove('final-wall');

  canvases.forEach(function (canvas, index) {
    const context = canvas.getContext('2d');
    context.globalCompositeOperation = 'source-over';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(wallImages[index], 0, 0, canvasWidth, canvasHeight);
    ticket.appendChild(canvas);
  });

});

function scratchAt(event) {
  const rect = ticket.getBoundingClientRect();
  const canvas = canvases[current];
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const x = (event.clientX - rect.left) * canvas.width / rect.width;
  const y = (event.clientY - rect.top) * canvas.height / rect.height;

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  const radius = canvas.width * 0.075;
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

ticket.addEventListener('pointerdown', function (event) {
  if (step !== 'scratching' || !canScratch || current >= layers.length - 1) {
    return;
  }

  event.preventDefault();
  activeScratchPointer = event.pointerId;
  ticket.setPointerCapture(event.pointerId);
  scratchAt(event);
});

ticket.addEventListener('pointermove', function (event) {
  if (activeScratchPointer !== event.pointerId || event.buttons === 0) {
    return;
  }

  scratchAt(event);
});

ticket.addEventListener('pointerup', function (event) {
  if (activeScratchPointer !== event.pointerId) return;
  activeScratchPointer = null;

  if (step !== 'scratching' || !canScratch || current >= layers.length - 1) {
    return;
  }

  const canvas = canvases[current];
  const data = canvas.getContext('2d')
    .getImageData(0, 0, canvas.width, canvas.height).data;
  let remainingPixels = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) remainingPixels++;
  }

  if (remainingPixels < canvas.width * canvas.height * 0.01) {
    canvas.remove();
    current++;

    if (current === 1 || current === 2) {
      step = `wall${current + 1}-caption`;
      showCaption(current);
    } else if (current === layers.length - 1) {
      step = 'final';
      ticket.classList.add('final-wall');
      envelope.hidden = false;
      caption.hidden = false;
      caption.classList.remove('centered');
      caption.classList.add('final-caption');
      caption.textContent = 'An envelope?!';
      canScratch = false;
    } else {
      step = 'scratching';
    }
  }
});

ticket.addEventListener('pointercancel', function (event) {
  if (activeScratchPointer === event.pointerId) {
    activeScratchPointer = null;
  }
});

envelope.addEventListener('click', function () {
  showResidentialAgreement();
});
