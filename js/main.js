const canvas = document.getElementById("canvas");

const slideDeck = document.querySelector(".slide-group");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");

const camera = new THREE.Camera();
const scene = new THREE.Scene();
const geometry = new THREE.PlaneBufferGeometry(2, 2);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
let mesh = new THREE.Mesh(geometry, shaderMaterials[0]);

const numberOfSlides = 13;
let slideNumber = 0;

let wideScreen = false;

function onClick(event) {
  hideButton();
  if (event.target === prevButton) {
    changeSlide(false);
  } else if (event.target === nextButton) {
    changeSlide(true);
  }
}

function onTransitionEnd(event) {
  showButton();
}

function changeSlide(next) {
  slideNumber = next ? slideNumber + 1 : slideNumber - 1;
  slideNumber = slideNumber < 0 ? 0 : slideNumber;
  slideNumber =
    slideNumber == numberOfSlides ? numberOfSlides - 1 : slideNumber;
  slideDeck.style.transform = wideScreen
    ? `translateX(calc(-${100 * slideNumber}vw)`
    : `translateY(calc(-${100 * slideNumber}vh)`;
  mesh.material = shaderMaterials[slideNumber];
  uniforms[slideNumber].u_resolution.value.x = renderer.domElement.width;
  uniforms[slideNumber].u_resolution.value.y = renderer.domElement.height;
}

function hideButton() {
  prevButton.style.display = "none";
  nextButton.style.display = "none";
}

function showButton() {
  prevButton.style.display = slideNumber > 0 ? "flex" : "none";
  nextButton.style.display = slideNumber < numberOfSlides - 1 ? "flex" : "none";
}

function onResize(event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.setAttribute("width", window.innerWidth);
  canvas.setAttribute("height", window.innerHeight);
  wideScreen = window.innerWidth > window.innerHeight;
  slideDeck.style.transform = wideScreen
    ? `translateX(calc(-${100 * slideNumber}vw)`
    : `translateY(calc(-${100 * slideNumber}vh)`;
  // rePaint();
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms[slideNumber].u_resolution.value.x = renderer.domElement.width;
  uniforms[slideNumber].u_resolution.value.y = renderer.domElement.height;
}

function render() {
  requestAnimationFrame(render);
  uniforms[slideNumber].u_time.value += 0.05;
  renderer.render(scene, camera);
}

function onCreate(event) {
  for (let i = 0; i < numberOfSlides; i++) {
    inputs[i].forEach((input, index) => {
      input.addEventListener("input", () => {
        values[i][index].textContent = input.value;
        changeListeners[i][index](input.value);
      });
    });
  }

  camera.position.z = 1;
  scene.add(mesh);
  window.addEventListener("resize", onResize);
  prevButton.addEventListener("click", onClick);
  nextButton.addEventListener("click", onClick);
  slideDeck.addEventListener("transitionend", onTransitionEnd);

  onResize();
  showButton();
  render();
}

onCreate();
