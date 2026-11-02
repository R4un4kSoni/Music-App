// NeonWave frontend interactions (backend hooks will be connected through PyWebView later)
const navButtons = document.querySelectorAll("[data-page]");
const pageSections = {
  home: document.getElementById("page-home"),
  discover: document.getElementById("page-discover"),
  library: document.getElementById("page-library"),
  liked: document.getElementById("page-liked"),
  playlist: document.getElementById("page-playlist")
};

function showPage(pageName) {
  Object.entries(pageSections).forEach(([name, section]) => {
    section.classList.toggle("hidden", name !== pageName);
  });
  document.getElementById("cover-flow").classList.add("hidden");
  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });
}

navButtons.forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

const coverFlow = document.getElementById("cover-flow");
const homePage = document.getElementById("page-home");

document.getElementById("open-cover-flow").addEventListener("click", () => {
  homePage.classList.add("hidden");
  coverFlow.classList.remove("hidden");
});
document.getElementById("close-cover-flow").addEventListener("click", () => {
  coverFlow.classList.add("hidden");
  homePage.classList.remove("hidden");
});

document.querySelectorAll(".heart-button").forEach(button => {
  button.addEventListener("click", () => {
    button.classList.toggle("liked");
    button.textContent = button.classList.contains("liked") ? "♥" : "♡";
  });
});

document.getElementById("main-play").addEventListener("click", event => {
  const button = event.currentTarget;
  button.textContent = button.textContent.trim() === "▶" ? "Ⅱ" : "▶";
});

// Demo-only buttons. Real playback and playlist creation will be wired to Python later.
document.getElementById("play-featured").addEventListener("click", () => {
  document.getElementById("main-play").textContent = "Ⅱ";
});
document.getElementById("create-playlist").addEventListener("click", () => {
  const name = window.prompt("Name your playlist:");
  if (name && name.trim()) {
    const link = document.createElement("button");
    link.className = "playlist-link";
    link.dataset.page = "playlist";
    link.innerHTML = '<span class="playlist-dot dot-gold"></span>';
    link.append(document.createTextNode(name.trim()));
    document.querySelector(".playlist-nav").append(link);
    link.addEventListener("click", () => showPage("playlist"));
  }
});
document.querySelector(".add-playlist").addEventListener("click", () => {
  showPage("playlist");
  document.getElementById("create-playlist").click();
});

window.addEventListener("pywebviewready", async function () {

    const response = await window.pywebview.api.ping();

    alert(response);

});

window.addEventListener("pywebviewready", async function () {

    const result = await window.pywebview.api.get_song(
        "/home/raunak/Music"
    );

    console.log(result);

});