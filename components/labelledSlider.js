const slider = document.getElementById("slider");
const valueBox = document.getElementById("slider-value");

slider.addEventListener("input", event => {
  valueBox.textContent = slider.value;
});
