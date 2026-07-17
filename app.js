window.StudyHub = {
    async loadJson(path) {
        const response = await fetch(path);

        if (!response.ok) {
            throw new Error(
                `Could not load ${path}. HTTP status: ${response.status}`
            );
        }

        return response.json();
    },

    escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    },

    getAudioType(file) {
        const cleanFile = String(file ?? "")
            .split("?")[0]
            .split("#")[0]
            .toLowerCase();

        if (cleanFile.endsWith(".wav")) {
            return "audio/wav";
        }

        if (cleanFile.endsWith(".ogg")) {
            return "audio/ogg";
        }

        if (
            cleanFile.endsWith(".m4a") ||
            cleanFile.endsWith(".mp4")
        ) {
            return "audio/mp4";
        }

        return "audio/mpeg";
    },

    async renderMaterials() {
        const container =
            document.getElementById("materials-grid");

        if (!container) {
            return;
        }

        container.innerHTML =
            '<p class="empty">Loading study materials...</p>';

        try {
            const materials =
                await this.loadJson("data/materials.json");

            if (!Array.isArray(materials)) {
                throw new Error(
                    "materials.json must contain a JSON array."
                );
            }

            container.innerHTML = "";

            if (materials.length === 0) {
                container.innerHTML = `
                    <p class="empty">
                        No study materials have been added yet.
                    </p>
                `;
                return;
            }

            materials.forEach((material) => {
                const title =
                    this.escapeHtml(
                        material.title || "Untitled Material"
                    );

                const description =
                    this.escapeHtml(
                        material.description || ""
                    );

                const file =
                    String(material.file || "").trim();

                const type =
                    String(material.type || "pdf")
                        .toLowerCase();

                if (!file) {
                    return;
                }

                const item =
                    document.createElement("a");

                item.className = "material";
                item.href = file;
                item.target = "_blank";
                item.rel = "noopener noreferrer";

                let icon = "📄";

                if (type === "link") {
                    icon = "🔗";
                } else if (type === "image") {
                    icon = "🖼️";
                } else if (
                    type === "document" ||
                    type === "docx"
                ) {
                    icon = "📝";
                } else if (
                    type === "presentation" ||
                    type === "pptx" ||
                    type === "slides"
                ) {
                    icon = "📊";
                }

                item.innerHTML = `
                    <span class="type" aria-hidden="true">
                        ${icon}
                    </span>

                    <h3>${title}</h3>

                    <p>${description}</p>
                `;

                container.appendChild(item);
            });

            if (container.children.length === 0) {
                container.innerHTML = `
                    <p class="empty">
                        No valid material entries were found.
                    </p>
                `;
            }
        } catch (error) {
            container.innerHTML = `
                <p class="error">
                    Error loading materials:
                    ${this.escapeHtml(error.message)}
                </p>
            `;

            console.error("Materials error:", error);
        }
    },

    async renderAudio() {
        const languagePicker =
            document.getElementById(
                "audio-language-picker"
            );

        const container =
            document.getElementById("audio-list");

        if (!container) {
            return;
        }

        container.innerHTML = `
            <p class="empty">
                Loading audio lessons...
            </p>
        `;

        try {
            const audioGroups =
                await this.loadJson(
                    "data/audio.json"
                );

            if (!Array.isArray(audioGroups)) {
                throw new Error(
                    "audio.json must contain an array."
                );
            }

            if (audioGroups.length === 0) {
                container.innerHTML = `
                    <p class="empty">
                        No audio lessons have been added.
                    </p>
                `;
                return;
            }

            if (languagePicker) {
                languagePicker.innerHTML = "";
            }

            const showAudioGroup = (groupIndex) => {
                const selectedGroup =
                    audioGroups[groupIndex];

                container.innerHTML = "";

                if (
                    !selectedGroup.items ||
                    !Array.isArray(
                        selectedGroup.items
                    ) ||
                    selectedGroup.items.length === 0
                ) {
                    container.innerHTML = `
                        <p class="empty">
                            No audio lessons are available
                            in this category.
                        </p>
                    `;
                    return;
                }

                selectedGroup.items.forEach(
                    (item) => {
                        const title =
                            this.escapeHtml(
                                item.title ||
                                "Untitled Audio"
                            );

                        const description =
                            this.escapeHtml(
                                item.description || ""
                            );

                        const file =
                            String(
                                item.file || ""
                            ).trim();

                        if (!file) {
                            return;
                        }

                        const audioCard =
                            document.createElement(
                                "article"
                            );

                        audioCard.className =
                            "audio-item";

                        const audioType =
                        this.getAudioType(file);

                        audioCard.innerHTML = `
                            <h3>${title}</h3>

                            <p>${description}</p>

                            <audio
                                controls
                                preload="metadata"
                            >
                                <source
                                    src="${this.escapeHtml(file)}"
                                    type="${audioType}"
                                >

                                Your browser does not support
                                audio playback.
                            </audio>
                        `;

                        container.appendChild(
                            audioCard
                        );
                    }
                );
            };

            audioGroups.forEach(
                (group, index) => {
                    if (!languagePicker) {
                        return;
                    }

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type = "button";
                    button.className = "deck-btn";

                    button.textContent =
                        group.name ||
                        `Audio ${index + 1}`;

                    if (index === 0) {
                        button.classList.add(
                            "active"
                        );
                    }

                    button.addEventListener(
                        "click",
                        () => {
                            languagePicker
                                .querySelectorAll(
                                    ".deck-btn"
                                )
                                .forEach(
                                    (audioButton) => {
                                        audioButton
                                            .classList
                                            .remove(
                                                "active"
                                            );
                                    }
                                );

                            button.classList.add(
                                "active"
                            );

                            showAudioGroup(index);
                        }
                    );

                    languagePicker.appendChild(
                        button
                    );
                }
            );

            showAudioGroup(0);

        } catch (error) {
            container.innerHTML = `
                <p class="error">
                    Error loading audio:
                    ${this.escapeHtml(error.message)}
                </p>
            `;

            console.error(
                "Audio error:",
                error
            );
        }
    },
    async renderFlashcards() {
        const deckPicker =
            document.getElementById("deck-picker");

        const container =
            document.getElementById("flashcard-grid");

        if (!container) {
            return;
        }

        container.innerHTML = `
            <p class="empty">
                Loading flashcards...
            </p>
        `;

        try {
            const decks =
                await this.loadJson(
                    "data/flashcards.json"
                );

            if (!Array.isArray(decks)) {
                throw new Error(
                    "flashcards.json must contain an array."
                );
            }

            if (decks.length === 0) {
                container.innerHTML = `
                    <p class="empty">
                        No flashcard decks have been added.
                    </p>
                `;

                return;
            }

            if (deckPicker) {
                deckPicker.innerHTML = "";
            }

            const showDeck = (deckIndex) => {
                const selectedDeck =
                    decks[deckIndex];

                container.innerHTML = "";

                if (
                    !selectedDeck.cards ||
                    !Array.isArray(selectedDeck.cards) ||
                    selectedDeck.cards.length === 0
                ) {
                    container.innerHTML = `
                        <p class="empty">
                            This deck has no flashcards.
                        </p>
                    `;

                    return;
                }

                selectedDeck.cards.forEach((card) => {
                    const front =
                        this.escapeHtml(
                            card.front || "Question"
                        );

                    const back =
                        this.escapeHtml(
                            card.back || "No answer provided."
                        );

                    const flashcard =
                        document.createElement(
                            "article"
                        );

                    flashcard.className =
                        "flashcard";

                    flashcard.tabIndex = 0;

                    flashcard.setAttribute(
                        "role",
                        "button"
                    );

                    flashcard.setAttribute(
                        "aria-label",
                        "Flip flashcard"
                    );

                    flashcard.innerHTML = `
                        <div class="flashcard-inner">

                            <div class="
                                flashcard-face
                                flashcard-front
                            ">
                                <span>${front}</span>

                                <span class="hint">
                                    Click to show answer
                                </span>
                            </div>

                            <div class="
                                flashcard-face
                                flashcard-back
                            ">
                                <span>${back}</span>

                                <span class="hint">
                                    Click to show question
                                </span>
                            </div>

                        </div>
                    `;

                    const flipCard = () => {
                        flashcard.classList.toggle(
                            "flipped"
                        );
                    };

                    flashcard.addEventListener(
                        "click",
                        flipCard
                    );

                    flashcard.addEventListener(
                        "keydown",
                        (event) => {
                            if (
                                event.key === "Enter" ||
                                event.key === " "
                            ) {
                                event.preventDefault();
                                flipCard();
                            }
                        }
                    );

                    container.appendChild(
                        flashcard
                    );
                });
            };

            decks.forEach((deck, index) => {
                if (!deckPicker) {
                    return;
                }

                const button =
                    document.createElement("button");

                button.type = "button";
                button.className = "deck-btn";

                button.textContent =
                    deck.name ||
                    `Deck ${index + 1}`;

                if (index === 0) {
                    button.classList.add(
                        "active"
                    );
                }

                button.addEventListener(
                    "click",
                    () => {
                        document
                            .querySelectorAll(
                                ".deck-btn"
                            )
                            .forEach((deckButton) => {
                                deckButton.classList.remove(
                                    "active"
                                );
                            });

                        button.classList.add(
                            "active"
                        );

                        showDeck(index);
                    }
                );

                deckPicker.appendChild(button);
            });

            showDeck(0);

        } catch (error) {
            container.innerHTML = `
                <p class="error">
                    Error loading flashcards:
                    ${this.escapeHtml(error.message)}
                </p>
            `;

            console.error(
                "Flashcards error:",
                error
            );
        }
    },

    async renderCounts() {
        const sources = {
            flashcards: "data/flashcards.json",
            audio: "data/audio.json",
            materials: "data/materials.json"
        };

        const jobs = Object.entries(sources).map(
            async ([name, path]) => {
                const countElement =
                    document.querySelector(
                        `[data-count="${name}"]`
                    );

                if (!countElement) {
                    return;
                }

                try {
                    const data =
                        await this.loadJson(path);

                    countElement.textContent =
                        Array.isArray(data)
                            ? data.length
                            : 0;
                } catch (error) {
                    countElement.textContent = "0";
                    console.error(
                        `${name} count error:`,
                        error
                    );
                }
            }
        );

        await Promise.all(jobs);
    }
};
