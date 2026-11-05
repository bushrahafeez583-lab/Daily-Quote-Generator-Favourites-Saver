const quoteText = document.getElementById("quoteText");
const quoteAuthor = document.getElementById("quoteAuthor");
const quoteCard = document.getElementById("quoteCard");

const newQuoteBtn = document.getElementById("newQuoteBtn");
const favoriteBtn = document.getElementById("favoriteBtn");
const copyBtn = document.getElementById("copyBtn");
const shareBtn = document.getElementById("shareBtn");

const soundToggle = document.getElementById("soundToggle");
const themeToggle = document.getElementById("themeToggle");

const homeBtn = document.getElementById("homeBtn");
const favoritesBtn = document.getElementById("favoritesBtn");

const homeSection = document.getElementById("homeSection");
const favoritesSection = document.getElementById("favoritesSection");

const favoritesGrid = document.getElementById("favoritesGrid");
const favoriteCount = document.getElementById("favoriteCount");
const emptyState = document.getElementById("emptyState");

const whatsappBtn = document.getElementById("whatsappBtn");
const twitterBtn = document.getElementById("twitterBtn");
const exploreBtn = document.getElementById("exploreBtn");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

let currentQuote = null;
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

let soundEnabled = localStorage.getItem("soundEnabled") !== "false";
let currentTemplate = 0;

let toastTimer;

const templates = [
    "template-purple",
    "template-yellow",
    "template-pink",
    "template-green",
    "template-blue"
];

const templateNames = [
    "Purple",
    "Yellow",
    "Pink",
    "Green",
    "Blue"
];

const API_URL = "https://dummyjson.com/quotes/random";


function playSound(type = "click") {
    if (!soundEnabled) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const sounds = {
        click: [500, 0.06],
        success: [750, 0.15],
        favorite: [900, 0.18],
        remove: [300, 0.12],
        error: [180, 0.2],
        change: [650, 0.1]
    };

    const sound = sounds[type] || sounds.click;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = sound[0];
    oscillator.type = "sine";

    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + sound[1]
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + sound[1]);

    oscillator.onended = () => {
        audioContext.close();
    };
}


function showToast(message, type = "success") {
    toastMessage.textContent = message;

    const icon = toast.querySelector("i");

    if (type === "error") {
        icon.className = "fa-solid fa-circle-exclamation";
    } else {
        icon.className = "fa-solid fa-circle-check";
    }

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


function updateFavoriteCount() {
    favoriteCount.textContent = favorites.length;
}


function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(favorites));
    updateFavoriteCount();
    displayFavorites();
}


function updateFavoriteButton() {
    if (!currentQuote) return;

    const isFavorite = favorites.some(
        quote => quote.id === currentQuote.id
    );

    if (isFavorite) {
        favoriteBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
        favoriteBtn.classList.add("liked");
    } else {
        favoriteBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
        favoriteBtn.classList.remove("liked");
    }
}


async function getNewQuote() {
    newQuoteBtn.disabled = true;
    newQuoteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch quote");
        }

        const data = await response.json();

        currentQuote = {
            id: data.id,
            text: data.quote,
            author: data.author
        };

        quoteText.textContent = currentQuote.text;
        quoteAuthor.textContent = currentQuote.author;

        updateFavoriteButton();
        changeQuoteAnimation();

        playSound("success");

    } catch (error) {
        showToast("Unable to load quote. Try again!", "error");
        playSound("error");

    } finally {
        newQuoteBtn.disabled = false;
        newQuoteBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate New Quote';
    }
}


function changeQuoteAnimation() {
    quoteCard.classList.remove("quote-animation");

    void quoteCard.offsetWidth;

    quoteCard.classList.add("quote-animation");
}


function toggleFavorite() {
    if (!currentQuote) return;

    const existingIndex = favorites.findIndex(
        quote => quote.id === currentQuote.id
    );

    if (existingIndex !== -1) {
        favorites.splice(existingIndex, 1);

        playSound("remove");
        showToast("Removed from favorites!");

    } else {
        favorites.push(currentQuote);

        playSound("favorite");
        showToast("Added to favorites!");
    }

    saveFavorites();
    updateFavoriteButton();
}


function displayFavorites() {
    favoritesGrid.innerHTML = "";

    emptyState.hidden = favorites.length !== 0;
    favoritesGrid.hidden = favorites.length === 0;

    favorites.forEach(quote => {
        const card = document.createElement("div");

        card.className = "favorite-card";

        const text = document.createElement("p");
        text.className = "favorite-quote";
        text.textContent = `"${quote.text}"`;

        const author = document.createElement("span");
        author.className = "favorite-author";
        author.textContent = `— ${quote.author}`;

        const actions = document.createElement("div");
        actions.className = "favorite-card-actions";

        const copyButton = document.createElement("button");
        copyButton.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';

        copyButton.addEventListener("click", () => {
            copyText(`"${quote.text}" — ${quote.author}`);
        });

        const shareButton = document.createElement("button");
        shareButton.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Share';

        shareButton.addEventListener("click", () => {
            shareQuote(quote);
        });

        const removeButton = document.createElement("button");
        removeButton.innerHTML = '<i class="fa-solid fa-trash"></i> Remove';

        removeButton.addEventListener("click", () => {
            favorites = favorites.filter(
                item => item.id !== quote.id
            );

            playSound("remove");
            saveFavorites();
            updateFavoriteButton();

            showToast("Favorite removed!");
        });

        actions.append(copyButton, shareButton, removeButton);

        card.append(text, author, actions);

        favoritesGrid.appendChild(card);
    });

    updateFavoriteCount();
}


async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);

        showToast("Quote copied successfully!");
        playSound("success");

    } catch (error) {
        showToast("Copy failed. Use HTTPS or localhost.", "error");
        playSound("error");
    }
}


function shareQuote(quote) {
    const text = `"${quote.text}" — ${quote.author}`;

    const shareURL = `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(shareURL, "_blank");

    playSound("click");
}


function shareOnTwitter() {
    if (!currentQuote) return;

    const text = `"${currentQuote.text}" — ${currentQuote.author}`;

    const twitterURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

    window.open(twitterURL, "_blank");

    playSound("click");
}


function shareOnWhatsApp() {
    if (!currentQuote) return;

    shareQuote(currentQuote);
}


function changeTheme() {
    document.body.classList.toggle("dark-theme");
    document.body.classList.toggle("light-theme");

    const isDark = document.body.classList.contains("dark-theme");

    localStorage.setItem("theme", isDark ? "dark" : "light");

    themeToggle.innerHTML = isDark
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';

    playSound("change");
}


function loadTheme() {
    const savedTheme = localStorage.getItem("theme");

    document.body.classList.remove("dark-theme", "light-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-theme");

        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';

    } else {
        document.body.classList.add("light-theme");

        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
}


function toggleSound() {
    soundEnabled = !soundEnabled;

    localStorage.setItem("soundEnabled", soundEnabled);

    updateSoundButton();

    if (soundEnabled) {
        playSound("change");
        showToast("Sound enabled!");
    } else {
        showToast("Sound disabled!");
    }
}


function updateSoundButton() {
    soundToggle.innerHTML = soundEnabled
        ? '<i class="fa-solid fa-volume-high"></i>'
        : '<i class="fa-solid fa-volume-xmark"></i>';
}


function changeTemplate() {
    currentTemplate++;

    if (currentTemplate >= templates.length) {
        currentTemplate = 0;
    }

    quoteCard.classList.remove(...templates);

    quoteCard.classList.add(templates[currentTemplate]);

    playSound("change");

    showToast(`${templateNames[currentTemplate]} template selected!`);
}


function createTemplateButton() {
    const templateArea = document.createElement("div");

    templateArea.className = "template-area";

    templateArea.innerHTML = `
        <span>Choose Quote Template</span>
        <button id="changeTemplateBtn">
            <i class="fa-solid fa-palette"></i>
            Change Template
        </button>
    `;

    document.querySelector(".quote-section").insertBefore(
        templateArea,
        document.querySelector(".quote-card")
    );

    document.getElementById("changeTemplateBtn").addEventListener(
        "click",
        changeTemplate
    );
}


function showHome() {
    homeSection.hidden = false;
    favoritesSection.hidden = true;

    homeBtn.classList.add("active");
    favoritesBtn.classList.remove("active");

    playSound("click");
}


function showFavorites() {
    homeSection.hidden = true;
    favoritesSection.hidden = false;

    homeBtn.classList.remove("active");
    favoritesBtn.classList.add("active");

    displayFavorites();

    playSound("click");
}


newQuoteBtn.addEventListener("click", () => {
    playSound("click");
    getNewQuote();
});

favoriteBtn.addEventListener("click", toggleFavorite);

copyBtn.addEventListener("click", () => {
    if (currentQuote) {
        copyText(`"${currentQuote.text}" — ${currentQuote.author}`);
    }
});

shareBtn.addEventListener("click", () => {
    if (currentQuote) {
        shareQuote(currentQuote);
    }
});

whatsappBtn.addEventListener("click", shareOnWhatsApp);

twitterBtn.addEventListener("click", shareOnTwitter);

soundToggle.addEventListener("click", toggleSound);

themeToggle.addEventListener("click", changeTheme);

homeBtn.addEventListener("click", showHome);

favoritesBtn.addEventListener("click", showFavorites);

exploreBtn.addEventListener("click", showHome);


function initializeApp() {
    loadTheme();

    updateSoundButton();

    updateFavoriteCount();

    displayFavorites();

    createTemplateButton();

    quoteCard.classList.add(templates[currentTemplate]);

    getNewQuote();
}


initializeApp();