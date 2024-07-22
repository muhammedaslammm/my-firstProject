// remove the selected size from the localstorage
document.addEventListener("DOMContentLoaded", function () {
    localStorage.removeItem("selectedSize");
});

// nav
const profileButton = document.querySelector("#profile-button");
const content = document.querySelector(".dropdown-content");

profileButton.addEventListener("click", function (event) {
  event.preventDefault();
  content.style.display =
    content.style.display === "none" ? "block" : "none";
});