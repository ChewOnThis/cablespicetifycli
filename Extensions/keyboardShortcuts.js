/// <reference path="../globals.d.ts" />
console.log("KeyboardShortcuts extension loaded!");

(function KeyboardShortcut() {
    if (!Spicetify.Mousetrap || !Spicetify.Player || !Spicetify.Platform) {
        console.warn("Spicetify dependencies not loaded yet. Retrying...");
        setTimeout(KeyboardShortcut, 1000);
        return;
    }

	

    console.log("Custom Shortcuts Loaded NICE LAD!!!");
    console.log("undo/redo functionality loaded!");
    const NODE_SERVER_URL = "http://localhost:3000"; // Node.js server base URL
    const SERVER_URL = `${NODE_SERVER_URL}/token`; // Token endpoint
    const REFRESH_URL = `${NODE_SERVER_URL}/refresh`; // Refresh token endpoint

    let accessToken = null;



    async function fetchAccessToken() {
        try {
            console.log("Fetching new access token...");
            const response = await fetch(SERVER_URL, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch access token.");
            const data = await response.json();
            accessToken = data.accessToken;
            console.log("Access Token Fetched:", accessToken);
            return accessToken;
        } catch (error) {
            console.error("Error fetching access token:", error);
            Spicetify.showNotification("Error fetching access token. Check your server.");
            return null;
        }
    }

    async function refreshAccessToken() {
        try {
            console.log("Refreshing access token...");
            const response = await fetch(REFRESH_URL, { method: "POST" });
            if (!response.ok) throw new Error("Failed to refresh access token.");
            const data = await response.json();
            accessToken = data.accessToken;
            console.log("Access Token Refreshed:", accessToken);
            return accessToken;
        } catch (error) {
            console.error("Error refreshing access token:", error);
            Spicetify.showNotification("Error refreshing access token.");
            return null;
        }
    }

    async function getAccessToken() {
        if (!accessToken) {
            return await fetchAccessToken();
        }
        return accessToken;
    }

    // Locate "MAIN" Playlist
    async function locateMainPlaylist() {
        const token = await getAccessToken();
        if (!token) return null;

        try {
            const response = await fetch("https://api.spotify.com/v1/me/playlists", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                console.error("Error locating 'MAIN' playlist.");
                return null;
            }

            const data = await response.json();
            const mainPlaylist = data.items.find((playlist) =>
                /MAIN \d{2}\/\d{2}\/\d{2}/.test(playlist.name)
            );

            if (mainPlaylist) {
                console.log(`Located playlist: ${mainPlaylist.name}`);
                return mainPlaylist.id;
            } else {
                console.warn("No 'MAIN' playlist found.");
                return null;
            }
        } catch (error) {
            console.error("Error locating 'MAIN' playlist:", error);
            return null;
        }
    }

    function performAction(action) {
        // Clear the redo stack whenever a new action is performed
        redoStack.length = 0;

        // Push the action to the history
        actionHistory.push(action);

        // Execute the action
        if (typeof action.do === "function") {
            try {
                action.do();
            } catch (error) {
                console.error("Failed to perform action:", error);
            }
        }
    }

    async function addCurrentTrackToMainPlaylist() {
        console.log("addCurrentTrackToMainPlaylist ACTIVATED");
        const playlistId = await locateMainPlaylist();
        if (!playlistId) return;

        const currentTrack = Spicetify.Player?.data?.item || Spicetify.Player.getTrack();
        if (!currentTrack) {
            console.warn("No track is currently playing.");
            Spicetify.showNotification("No track is loaded.");
            return;
        }

        const endpoint = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
        const token = await getAccessToken();

        const action = {
            do: async () => {
                try {
                    const response = await fetch(endpoint, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ uris: [currentTrack.uri] }),
                    });

                    if (!response.ok) {
                        throw new Error("Error adding track to MAIN playlist.");
                    }

                    const data = await response.json();
                    console.log("Track added successfully to 'MAIN'. Snapshot ID:", data.snapshot_id);
                    Spicetify.showNotification("Track added to MAIN playlist.");
                } catch (error) {
                    console.error("Failed to add track to 'MAIN':", error);
                }
            },
            undo: async () => {
                try {
                    const response = await fetch(endpoint, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ tracks: [{ uri: currentTrack.uri }] }),
                    });

                    if (!response.ok) {
                        throw new Error("Error removing track from MAIN playlist.");
                    }

                    const data = await response.json();
                    console.log("Track removed successfully from 'MAIN'. Snapshot ID:", data.snapshot_id);
                    Spicetify.showNotification("Track removed from MAIN playlist.");
                } catch (error) {
                    console.error("Failed to remove track from 'MAIN':", error);
                }
            },
        };

        performAction(action);
    }

    // Remove current track from current playlist
    async function removeCurrentTrackFromCurrentPlaylist() {
        console.log("removeCurrentTrackFromCurrentPlaylist ACTIVATED");
        const currentPlaylistUri = Spicetify.Player?.data?.context?.uri;
        const currentTrack = Spicetify.Player?.data?.item || Spicetify.Player.getTrack();
        if (!currentPlaylistUri || !currentTrack) {
            console.warn("No track or playlist context found.");
            Spicetify.showNotification("No track is loaded.");
            return;
        }

        const playlistId = currentPlaylistUri.split(":").pop();
        const endpoint = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
        const token = await getAccessToken();

        const action = {
            do: async () => {
                try {
                    const response = await fetch(endpoint, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ tracks: [{ uri: currentTrack.uri }] }),
                    });

                    if (!response.ok) {
                        throw new Error("Error removing track from current playlist.");
                    }

                    const data = await response.json();
                    console.log("Track removed successfully from current playlist. Snapshot ID:", data.snapshot_id);
                    Spicetify.showNotification("Track removed from current playlist.");
                } catch (error) {
                    console.error("Failed to remove track from current playlist:", error);
                }
            },
            undo: async () => {
                try {
                    const response = await fetch(endpoint, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ uris: [currentTrack.uri] }),
                    });

                    if (!response.ok) {
                        throw new Error("Error re-adding track to current playlist.");
                    }

                    const data = await response.json();
                    console.log("Track re-added successfully to current playlist. Snapshot ID:", data.snapshot_id);
                    Spicetify.showNotification("Track re-added to current playlist.");
                } catch (error) {
                    console.error("Failed to re-add track to current playlist:", error);
                }
            },
        };

        performAction(action);
    }

    const actionHistory = [];
    const redoStack = [];

    async function undoAction() {
        if (actionHistory.length === 0) {
            Spicetify.showNotification("No actions to undo.");
            return;
        }

        const action = actionHistory.pop();
        await action.undo();
        redoStack.push(action);
        Spicetify.showNotification("Action undone.");
    }

    async function redoAction() {
        if (redoStack.length === 0) {
            Spicetify.showNotification("No actions to redo.");
            return;
        }

        const action = redoStack.pop();
        await action.do();
        actionHistory.push(action);
        Spicetify.showNotification("Action redone.");
    }

    // Bind Shortcuts
    Spicetify.Mousetrap.bind("ctrl+1", async () => {
        try {
            await addCurrentTrackToMainPlaylist();
        } catch (error) {
            console.error("Error adding track:", error);
            Spicetify.showNotification("Error adding track.");
        }
    });

    Spicetify.Mousetrap.bind("ctrl+`", async () => {
        try {
            await removeCurrentTrackFromCurrentPlaylist();
        } catch (error) {
            console.error("Error removing track:", error);
            Spicetify.showNotification("Error removing track.");
        }
    });

    Spicetify.Mousetrap.bind("ctrl+z", async () => {
        try {
            await undoAction();
        } catch (error) {
            console.error("Error undoing action:", error);
            Spicetify.showNotification("Error undoing action.");
        }
    });

    Spicetify.Mousetrap.bind("ctrl+y", async () => {
        try {
            await redoAction();
        } catch (error) {
            console.error("Error redoing action:", error);
            Spicetify.showNotification("Error redoing action.");
        }
    });

    console.log("Custom Shortcuts Loaded!");
})();





	// re-render vim on window resize & prevent mouse event while active
	window.addEventListener(
		"resize",
		(event) => {
			if (vim.isActive) {
				vim.activate();
			}
		},
		true
	);

	window.addEventListener(
		"mousedown",
		(event) => {
			if (vim.isActive) {
				event.stopPropagation();
			}
		},
		true
	);

	// Functions
	function focusOnApp() {
		return document.querySelector(
			".Root__main-view .os-viewport, .Root__main-view .main-view-container > .main-view-container__scroll-node:not([data-overlayscrollbars-initialize]), .Root__main-view .main-view-container__scroll-node > [data-overlayscrollbars-viewport]"
		);
	}

	function createScrollCallback(step) {
		const app = focusOnApp();
		if (app) {
			const scrollInterval = setInterval(() => {
				app.scrollTop += step;
			}, 10);
			document.addEventListener("keyup", () => {
				clearInterval(scrollInterval);
			});
		}
	}

	function scrollToPosition(position) {
		const app = focusOnApp();
		app.scroll(0, position === 0 ? 0 : app.scrollHeight);
	}

	/**
	 * @returns {number | undefined}
	 * @param {NodeListOf<Element>} allItems
	 */
	function findActiveIndex(allItems) {
		const activeLink = document.querySelector(".main-yourLibraryX-navLinkActive");
		const historyURI = Spicetify.Platform.History.location.pathname.replace(/^\//, "spotify:").replace(/\//g, ":");
		const activePage = document.querySelector(`[aria-describedby="onClickHint${historyURI}"]`);

		if (!activeLink && !activePage) {
			return -1;
		}

		let index = 0;
		for (const item of allItems) {
			if (item === activeLink || item === activePage) {
				return index;
			}

			index++;
		}
	}

	/**
	 *
	 * @param {1 | -1} direction
	 */
	function rotateSidebar(direction) {
		const allItems = document.querySelectorAll(
			"#spicetify-sticky-list .main-yourLibraryX-navLink, .main-yourLibraryX-listItem > div:not(:has([data-skip-in-keyboard-nav])) > div:first-child"
		);
		const maxIndex = allItems.length - 1;

		let index = findActiveIndex(allItems) + direction;
		if (index < 0) index = maxIndex;
		else if (index > maxIndex) index = 0;

		allItems[index].click();
	}


function VimBind() {
	const elementQuery = ["[href]", "button", ".main-trackList-trackListRow", "[role='button']"].join(",");

	const keyList = "qwertasdfgzxcvyuiophjklbnm".split("");

	const lastKeyIndex = keyList.length - 1;

	this.isActive = false;

	const vimOverlay = document.createElement("div");
	const baseOverlay = document.createElement("div");
	const tippyOverlay = document.createElement("div");
	vimOverlay.id = "vim-overlay";
	baseOverlay.id = "base-overlay";
	tippyOverlay.id = "tippy-overlay";
	vimOverlay.style.position = baseOverlay.style.position = tippyOverlay.style.position = "absolute";
	vimOverlay.style.width = baseOverlay.style.width = tippyOverlay.style.width = "100%";
	vimOverlay.style.height = baseOverlay.style.height = tippyOverlay.style.height = "100%";
	baseOverlay.style.zIndex = "9999";
	tippyOverlay.style.zIndex = "10000";
	vimOverlay.style.display = "none";
	vimOverlay.innerHTML = `<style>
.vim-key {
    position: fixed;
    padding: 3px 6px;
    background-color: var(--spice-button-disabled);
    border-radius: 3px;
    border: solid 2px var(--spice-text);
    color: var(--spice-text);
    text-transform: lowercase;
    line-height: normal;
    font-size: 14px;
    font-weight: 500;
}
</style>`;
	vimOverlay.append(baseOverlay);
	vimOverlay.append(tippyOverlay);
	document.body.append(vimOverlay);

	const mousetrap = new Spicetify.Mousetrap(document);
	mousetrap.bind(keyList, listenToKeys.bind(this), "keypress");
	// Pause mousetrap event emitter
	const orgStopCallback = mousetrap.stopCallback;
	mousetrap.stopCallback = () => true;

	/**
	 *
	 * @param {KeyboardEvent} event
	 */
	this.activate = function (event) {
		vimOverlay.style.display = "block";

		const vimkey = getVims();
		if (vimkey.length > 0) {
			for (const e of vimkey) {
				e.remove();
			}
		}

		let firstKey = 0;
		let secondKey = 0;

		for (const e of getLinks()) {
			const computed = window.getComputedStyle(e);
			if (computed.display === "none" || computed.visibility === "hidden" || computed.opacity === "0") {
				continue;
			}

			const bound = e.getBoundingClientRect();
			const owner = document.body;

			let top = bound.top;
			let left = bound.left;

			if (
				bound.bottom > owner.clientHeight ||
				bound.left > owner.clientWidth ||
				bound.right < 0 ||
				bound.top < 0 ||
				bound.width === 0 ||
				bound.height === 0
			) {
				continue;
			}

			// Exclude certain elements from the centering calculation
			if (e.parentNode.role !== "row") {
				top = top + bound.height / 2 - 15;
				left = left + bound.width / 2 - 15;
			}

			// Append the key to the correct overlay
			if (e.tagName === "BUTTON" && e.parentNode.tagName === "LI") {
				tippyOverlay.append(createKey(e, keyList[firstKey] + keyList[secondKey], top, left));
			} else {
				baseOverlay.append(createKey(e, keyList[firstKey] + keyList[secondKey], top, left));
			}

			secondKey++;
			if (secondKey > lastKeyIndex) {
				secondKey = 0;
				firstKey++;
			}
		}

		this.isActive = true;
		setTimeout(() => {
			mousetrap.stopCallback = orgStopCallback.bind(mousetrap);
		}, 100);
	};

	/**
	 *
	 * @param {KeyboardEvent} event
	 */
	this.deactivate = function (event) {
		mousetrap.stopCallback = () => true;
		this.isActive = false;
		vimOverlay.style.display = "none";
		for (const e of getVims()) {
			e.remove();
		}
	};

	function getLinks() {
		const elements = Array.from(document.querySelectorAll(elementQuery));
		return elements;
	}

	function getVims() {
		return Array.from(vimOverlay.getElementsByClassName("vim-key"));
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	function listenToKeys(event) {
		if (!this.isActive) {
			return;
		}

		const vimkey = getVims();

		if (vimkey.length === 0) {
			this.deactivate(event);
			return;
		}

		for (const div of vimkey) {
			const text = div.innerText.toLowerCase();
			if (text[0] !== event.key) {
				div.remove();
				continue;
			}

			const newText = text.slice(1);
			if (newText.length === 0) {
				interact(div.target);
				this.deactivate(event);
				return;
			}

			div.innerText = newText;
		}

		if (baseOverlay.childNodes.length === 0 && tippyOverlay.childNodes.length === 0) {
			this.deactivate(event);
		}
	}

	/**
	 * @param {HTMLElement} element
	 */
	function interact(element) {
		// Hover on contextmenu dropdown list items
		if (element.tagName === "BUTTON" && element.parentNode.tagName === "LI" && element.ariaExpanded !== null) {
			const event = new MouseEvent("mouseover", {
				view: window,
				bubbles: true,
				cancelable: true,
			});

			element.dispatchEvent(event);
			return;
		}

		if (element.hasAttribute("href") || element.tagName === "BUTTON" || element.role === "button" || element.parentNode.role === "row") {
			element.click();
			return;
		}

		const findButton = element.querySelector(`button[data-ta-id="play-button"]`) || element.querySelector(`button[data-button="play"]`);
		if (findButton instanceof HTMLButtonElement) {
			findButton.click();
			return;
		}
		alert("Let me know where you found this button, please. I can't click this for you without that information.");
		return;
	}

	/**
	 * @param {Element} target
	 * @param {string} key
	 * @param {string | number} top
	 * @param {string | number} left
	 */
	function createKey(target, key, top, left) {
		const div = document.createElement("span");
		div.classList.add("vim-key");
		div.innerText = key;
		div.style.top = `${top}px`;
		div.style.left = `${left}px`;
		div.target = target;
		return div;
	}

	/**
	 *
	 * @param {Spicetify.Keyboard.ValidKey} key
	 */
	this.setCancelKey = function (key) {
		mousetrap.bind(Spicetify.Keyboard.KEYS[key], this.deactivate.bind(this));
	};

	return this;
}
