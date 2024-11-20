// iwr -useb https://raw.githubusercontent.com/spicetify/marketplace/main/resources/install.ps1 | iex


// go build -o spicetify

// .\spicetify.exe

// .\spicetify.exe enable-devtools

// .\spicetify.exe apply


// .\spicetify.exe restore
// .\spicetify.exe backup
// .\spicetify.exe apply

// NAME: Keyboard Shortcut
// AUTHOR: khanhas, OhItsTom
// DESCRIPTION: Register a few more keybinds to support keyboard-driven navigation in Spotify client.

/// <reference path="../globals.d.ts" />

(function KeyboardShortcut() {
    if (!Spicetify.Mousetrap || !Spicetify.Player || !Spicetify.Platform) {
        setTimeout(KeyboardShortcut, 1000); // Retry after 1 second
        return;
    }

    const NODE_SERVER_URL = "http://localhost:3000"; // Base URL of your Node.js server
    let accessToken = null;

    // Fetch Access Token from Node.js Server
    async function fetchAccessToken() {
		try {
			const response = await fetch("http://localhost:3000/token");
			if (!response.ok) {
				throw new Error("Failed to fetch access token.");
			}
	
			const data = await response.json();
			if (!data.accessToken) {
				throw new Error("No access token returned by server.");
			}
	
			console.log("Access Token:", data.accessToken);
			return data.accessToken;
		} catch (error) {
			console.error("Error fetching access token:", error);
			return null;
		}
	}

    // Retrieve Access Token
	async function refreshAccessToken() {
		try {
			const response = await fetch("http://localhost:3000/refresh", {
				method: "POST",
			});
			if (!response.ok) {
				throw new Error("Failed to refresh access token.");
			}
	
			const { accessToken } = await response.json();
			console.log("Refreshed access token:", accessToken);
			return accessToken;
		} catch (error) {
			console.error("Error refreshing access token:", error);
			return null;
		}
	}
	
	async function getAccessToken() {
		if (!accessToken) {
			console.log("Fetching new access token...");
			return await fetchAccessToken();
		}
	
		try {
			const response = await fetch("https://api.spotify.com/v1/me", {
				headers: { Authorization: `Bearer ${accessToken}` },
			});
	
			if (response.status === 401) {
				console.log("Access token expired. Refreshing...");
				accessToken = await refreshAccessToken();
			}
		} catch (error) {
			console.error("Error validating access token:", error);
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

    // Add Current Track to "MAIN" Playlist
    async function addCurrentTrackToMainPlaylist() {
		console.log("addCurrentTrackToMainPlaylist ACTIVATED");
        const playlistId = await locateMainPlaylist();
        if (!playlistId) return;

        const currentTrack = Spicetify.Player?.data?.item || Spicetify.Player.getTrack();
        if (!currentTrack) {
            console.warn("No track is currently playing.");
            return;
        }

        const endpoint = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
        const token = await getAccessToken();

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
                console.error("Error adding track.");
                return;
            }

            const data = await response.json();
            console.log("Track added successfully to 'MAIN'. Snapshot ID:", data.snapshot_id);
        } catch (error) {
            console.error("Failed to add track to 'MAIN':", error);
        }
    }

    // Remove Current Track from Current Playlist
    async function removeCurrentTrackFromCurrentPlaylist() {
		console.log("removeCurrentTrackFromCurrentPlaylist ACTIVATED");
        const currentPlaylistUri = Spicetify.Player?.data?.context?.uri;
        const currentTrack = Spicetify.Player?.data?.item || Spicetify.Player.getTrack();
        if (!currentPlaylistUri || !currentTrack) {
            console.warn("No track or playlist context found.");
            return;
        }

        const playlistId = currentPlaylistUri.split(":").pop();
        const endpoint = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
        const token = await getAccessToken();

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
                console.error("Error removing track from playlist.");
                return;
            }

            const data = await response.json();
            console.log("Track removed successfully from current playlist. Snapshot ID:", data.snapshot_id);
        } catch (error) {
            console.error("Failed to remove track from current playlist:", error);
        }
    }

    // Bind Shortcuts
    Spicetify.Mousetrap.bind("ctrl+1", addCurrentTrackToMainPlaylist); // Add to MAIN
    Spicetify.Mousetrap.bind("ctrl+`", removeCurrentTrackFromCurrentPlaylist); // Remove from current playlist

    console.log("Custom Shortcuts Loaded!");
})();





// // Remove Current Song
// function removeCurrentSong() {
//     debugPlayerData();
//     console.log("Attempting to remove the current song...");

//     const currentTrack = getCurrentTrack();
//     if (!currentTrack) {
//         console.warn("No current track found.");
//         Spicetify.showNotification("No track is loaded.");
//         return;
//     }

//     const trackURI = currentTrack.uri;
//     const playlistURI = Spicetify.Player.data?.context?.uri?.replace("spotify:playlist:", ""); // Extract only the playlist ID.

//     if (!playlistURI) {
//         console.warn("No playlist context found.");
//         Spicetify.showNotification("No playlist context available.");
//         return;
//     }

//     console.log(`Removing track: ${trackURI} from playlist: ${playlistURI}`);

//     // Proper payload for deletion
//     const payload = {
//         operations: [
//             {
//                 op: "delete",
//                 uri: trackURI,
//             },
//         ],
//     };

//     Spicetify.CosmosAsync.post(
//         `sp://core-playlist/v1/playlist/${playlistURI}/change`,
//         payload
//     )
//         .then(() => {
//             Spicetify.showNotification("Track removed from playlist.");
//         })
//         .catch((error) => {
//             console.error("Failed to remove track:", error);
//             Spicetify.showNotification("Failed to remove the track.");
//         });
// }

// // Add to Main Playlist
// function addToMainPlaylist() {
//     debugPlayerData();
//     console.log("Attempting to add the current song to 'MAIN' playlist...");

//     const currentTrack = getCurrentTrack();
//     if (!currentTrack) {
//         console.warn("No current track found.");
//         Spicetify.showNotification("No track is loaded.");
//         return;
//     }

//     const trackURI = currentTrack.uri;

//     Spicetify.Platform.RootlistAPI.getContents()
//         .then((rootlistData) => {
//             console.log("Fetched rootlist data:", rootlistData);

//             const playlists = rootlistData.items.flatMap((item) =>
//                 item.type === "playlist" ? [item] : []
//             );

//             const mainPlaylist = playlists.find((playlist) =>
//                 /MAIN \d{2}\/\d{2}\/\d{2}/.test(playlist.name)
//             );

//             if (!mainPlaylist) {
//                 console.warn("No 'MAIN' playlist found.");
//                 Spicetify.showNotification('No playlist matching "MAIN 00/00/00" found.');
//                 return;
//             }

//             console.log(`Adding track: ${trackURI} to playlist: ${mainPlaylist.uri}`);

//             const playlistID = mainPlaylist.uri.replace("spotify:playlist:", "");

//             Spicetify.CosmosAsync.post(
//                 `sp://core-playlist/v1/playlist/${playlistID}/change`,
//                 {
//                     operations: [
//                         {
//                             op: "add",
//                             after: null, // Append to the end
//                             uris: [trackURI],
//                         },
//                     ],
//                 }
//             )
//                 .then(() => {
//                     Spicetify.showNotification(`Track added to '${mainPlaylist.name}'.`);
//                 })
//                 .catch((error) => {
//                     console.error("Failed to add track:", error);
//                     Spicetify.showNotification("Failed to add track to playlist.");
//                 });
//         })
//         .catch((error) => {
//             console.error("Failed to fetch playlists:", error);
//             Spicetify.showNotification("Error fetching playlists.");
//         });
// }





// Undo Last Action
const actionHistory = [];
function undoLastAction() {
	const lastAction = actionHistory.pop();
	if (lastAction && typeof lastAction.undo === "function") {
		try {
			lastAction.undo();
			Spicetify.showNotification("Action undone successfully.");
		} catch (error) {
			Spicetify.showNotification("Failed to undo action.");
		}
	} else {
		Spicetify.showNotification("No actions to undo.");
	}
}
	
    // Keybinds
    const binds = {
		"ctrl+`": { callback: removeCurrentTrackFromMainPlaylist },
		"ctrl+1": { callback: addCurrentTrackToMainPlaylist },
		"ctrl+z": { callback: undoLastAction }, // Ensure undoLastAction is implemented
	
        // Existing keybinds
        "ctrl+q": {
            callback: () =>
                Spicetify.CosmosAsync.post("sp://esperanto/spotify.desktop.lifecycle_esperanto.proto.DesktopLifecycle/Shutdown") &&
                Spicetify.CosmosAsync.post("sp://desktop/v1/shutdown"),
        },
        "ctrl+tab": { callback: () => rotateSidebar(1) },
        "ctrl+shift+tab": { callback: () => rotateSidebar(-1) },
        "shift+pageup": { callback: () => focusOnApp() },
        "shift+pagedown": { callback: () => focusOnApp() },
        j: { callback: () => createScrollCallback(SCROLL_STEP) },
        k: { callback: () => createScrollCallback(-SCROLL_STEP) },
        g: { callback: () => scrollToPosition(0) },
        "shift+g": { callback: () => scrollToPosition(1) },
        "shift+h": { callback: () => Spicetify.Platform.History.goBack() },
        "shift+l": { callback: () => Spicetify.Platform.History.goForward() },
        m: { callback: () => Spicetify.Player.toggleHeart() },
        "/": { callback: () => Spicetify.Platform.History.replace("/search") },
        "ctrl+left": { callback: () => Spicetify.Player.prev() },
        "ctrl+right": { callback: () => Spicetify.Player.next() },
        "ctrl+up": { callback: () => Spicetify.Player.setVolume(Spicetify.Player.getVolume() + 0.05) },
        "ctrl+down": { callback: () => Spicetify.Player.setVolume(Spicetify.Player.getVolume() - 0.05) },
        f: {
            callback: (event) => {
                vim.activate(event);
                vim.setCancelKey("ESCAPE");
            },
        },
    };

	// Bind all the keys
	// Apply keybinds
for (const [key, { callback }] of Object.entries(binds)) {
    console.log(`Binding key: ${key}`); // Debug keybinding
    Spicetify.Mousetrap.bind(key, (event) => {
        event.preventDefault();
        console.log(`Key pressed: ${key}`); // Debug key pressed
        callback(event); // Call the assigned function
    });
}


    console.log("All keybinds successfully applied.");



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
