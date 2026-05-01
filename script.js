const DATA_URL = "data/site-data.json";

const page = document.body.dataset.page;
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

document.getElementById("year").textContent = new Date().getFullYear();

document.querySelectorAll(".site-nav a").forEach((link) => {
  const currentFile = window.location.pathname.split("/").pop() || "index.html";
  if (link.getAttribute("href") === currentFile) {
    link.classList.add("active");
  }
});

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

async function loadData() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("Could not load JSON data");
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sampleItems(items, count) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

function renderEmpty(container, message) {
  container.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderHome(data) {
  const factsContainer = document.getElementById("randomFacts");
  const topicsContainer = document.getElementById("mysteryTopics");
  const shuffleButton = document.getElementById("shuffleFacts");

  const drawFacts = () => {
    const randomFacts = sampleItems(data.facts, 3);
    factsContainer.innerHTML = randomFacts.map((item) => `
      <article class="fact-card">
        <img class="card-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
        <span class="tag">${escapeHtml(item.category)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.fact)}</p>
      </article>
    `).join("");
  };

  drawFacts();
  shuffleButton.addEventListener("click", drawFacts);

  topicsContainer.innerHTML = data.mysteryTopics.map((topic) => `
    <article class="topic-card">
      <img class="card-image" src="${escapeHtml(topic.image)}" alt="${escapeHtml(topic.title)}" loading="lazy">
      <h3>${escapeHtml(topic.title)}</h3>
      <p>${escapeHtml(topic.description)}</p>
    </article>
  `).join("");
}

function renderFacts(data) {
  const gallery = document.getElementById("factsGallery");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const imageFacts = data.factImages || data.facts;

  const drawGallery = (category) => {
    const facts = category === "all"
      ? imageFacts
      : imageFacts.filter((item) => item.category === category);

    if (!facts.length) {
      renderEmpty(gallery, "No facts found for this category yet.");
      return;
    }

    gallery.innerHTML = facts.map((item) => `
      <article class="image-card">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy">
        <div class="image-actions">
          <a class="image-action" href="${escapeHtml(item.image)}" download target="_blank" rel="noopener">Download</a>
          <button class="image-action" type="button" data-share-url="${escapeHtml(item.image)}" data-share-title="${escapeHtml(item.title)}">Share</button>
        </div>
      </article>
    `).join("");
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      drawGallery(button.dataset.filter);
    });
  });

  drawGallery("all");

  gallery.addEventListener("click", async (event) => {
    const shareButton = event.target.closest("[data-share-url]");
    if (!shareButton) return;

    const shareUrl = shareButton.dataset.shareUrl;
    const shareTitle = shareButton.dataset.shareTitle;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: "Check out this fact image from Mr Informative.",
          url: shareUrl
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      shareButton.textContent = "Copied";
      setTimeout(() => {
        shareButton.textContent = "Share";
      }, 1600);
    } catch (error) {
      console.error(error);
    }
  });
}

function getYouTubeId(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "");
    }
    if (parsedUrl.pathname.includes("/shorts/")) {
      return parsedUrl.pathname.split("/shorts/")[1].split("/")[0];
    }
    return parsedUrl.searchParams.get("v");
  } catch {
    return url;
  }
}

function videoCard(item, isShort = false) {
  const id = getYouTubeId(item.url);
  return `
    <article class="${isShort ? "short-card" : "video-card"}">
      <span class="video-badge">${isShort ? "Short" : "Video"}</span>
      <iframe
        class="video-frame"
        src="https://www.youtube.com/embed/${escapeHtml(id)}"
        title="${escapeHtml(item.title)}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
      <h3>${escapeHtml(item.title)}</h3>
    </article>
  `;
}

function renderVideos(data) {
  const mixedVideoList = document.getElementById("mixedVideoList");
  const videos = data.videos.map((item) => ({ ...item, isShort: false }));
  const shorts = data.shorts.map((item) => ({ ...item, isShort: true }));
  const maxItems = Math.max(videos.length, shorts.length);
  const mixedItems = [];

  for (let index = 0; index < maxItems; index += 1) {
    if (videos[index]) mixedItems.push(videos[index]);
    if (shorts[index]) mixedItems.push(shorts[index]);
  }

  mixedVideoList.innerHTML = mixedItems.length
    ? mixedItems.map((item) => videoCard(item, item.isShort)).join("")
    : "";

  if (!mixedItems.length) {
    renderEmpty(mixedVideoList, "Add your YouTube video and Shorts links in data/site-data.json.");
  }
}

function renderProducts(data) {
  const productsList = document.getElementById("productsList");

  productsList.innerHTML = data.products.map((product) => `
    <article class="product-card">
      <img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
      <h3>${escapeHtml(product.name)}</h3>
      <p>${escapeHtml(product.description)}</p>
      <div class="price">${escapeHtml(product.price)}</div>
      <a class="button secondary" href="${escapeHtml(product.link)}">BUY NOW</a>
    </article>
  `).join("");
}

function renderBinaural(data) {
  const featureList = document.getElementById("appFeatures");
  const downloadLink = document.getElementById("appDownloadLink");
  const sessionTitle = document.getElementById("sessionTitle");
  const frequencyValue = document.getElementById("frequencyValue");
  const typeLabel = document.querySelector(".frequency-readout small");
  let index = 0;

  downloadLink.href = data.app.downloadLink;
  featureList.innerHTML = data.app.features.map((feature) => `
    <article class="feature-card">
      <h3>${escapeHtml(feature.title)}</h3>
      <p>${escapeHtml(feature.description)}</p>
    </article>
  `).join("");

  const rotateSession = () => {
    const session = data.app.sessions[index % data.app.sessions.length];
    sessionTitle.textContent = session.title;
    frequencyValue.textContent = session.frequency;
    typeLabel.textContent = session.type;
    index += 1;
  };

  rotateSession();
  setInterval(rotateSession, 3200);
}

loadData().then((data) => {
  if (!data) {
    document.querySelector("main").insertAdjacentHTML(
      "afterbegin",
      '<div class="empty-state">The site data could not be loaded. Run this website from a local server so JSON fetch works.</div>'
    );
    return;
  }

  if (page === "home") renderHome(data);
  if (page === "facts") renderFacts(data);
  if (page === "videos") renderVideos(data);
  if (page === "products") renderProducts(data);
  if (page === "binaural") renderBinaural(data);
});
