// Fightcade Renchanced Plugins
// Author: Ren
// Website: https://arkadyzja.honmaru.pl


// CONFIGURATION //
const CONFIG = {
    showThemeButtons: true,
    showFavoritesButton: true,
    showFavoriteNavigationButtons: true,
    startupTheme: 'solpor',
    themes: ["default", "lembranza", "meigallo", "rabudo", "solpor", "vagalume", "bretema", "luar", "furancho"],
};

// STYLING //
const addGlobalStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
        .star-icon {
            fill: none; /* Transparent inside */
            stroke: rgba(255, 255, 255, 0.3); /* Semi-transparent border */
            stroke-width: 2;
            transition: fill 0.3s ease, stroke 0.3s ease; /* Smooth transition */
            cursor: pointer; /* Pointer cursor to indicate interactivity */
        }
        .star-icon:hover {
            stroke: white; /* Solid white border */
        }
    `;
    document.head.appendChild(style);
};

// HELPER FUNCTIONS //

/**
 * Adds a new styled link with an icon next to the target element.
 * @param {HTMLElement} targetElement - The reference element to place the link after.
 * @param {Function} callback - The callback executed when the link is clicked.
 * @param {string} tooltip - Tooltip text for the link.
 * @param {string} svgHTML - The SVG markup for the icon.
 */
const addStyledLink = (targetElement, callback, tooltip, svgHTML) => {
    const link = document.createElement('a');
    link.classList.add('buttonItemWrapper');
    link.title = tooltip;
    link.style.cssText = `
        display: block;
        margin-left: 0px;
        padding: 5px;
        width: 100%;
        margin-top: 15px;
        cursor: pointer;
    `;

    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.classList.add('star-icon');
    svgElement.setAttribute("width", "40");
    svgElement.setAttribute("height", "40");
    svgElement.innerHTML = svgHTML;

    link.appendChild(svgElement);
    link.addEventListener('click', callback);

    targetElement.parentNode.insertBefore(link, targetElement.nextSibling);
};

/**
 * Adds navigation buttons (previous and next) with icons next to the target element.
 * @param {HTMLElement} targetElement - The reference element to place the buttons after.
 * @param {Function} prevCallback - The callback executed for the previous button.
 * @param {Function} nextCallback - The callback executed for the next button.
 */
const addNavigationButtons = (targetElement, prevCallback, nextCallback) => {
    const container = document.createElement('div');
    container.style.cssText = `
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        margin-bottom: 15px;
        width: 100%;
    `;

    const buttons = [
        { title: 'Go to previous fav channel', svg: '<polygon points="10,0 10,20 0,10" />', callback: prevCallback },
        { title: 'Go to next fav channel', svg: '<polygon points="0,0 10,10 0,20" />', callback: nextCallback },
    ];

    buttons.forEach(({ title, svg, callback }) => {
        const button = document.createElement('a');
        button.title = title;
        button.style.cssText = `
            display: inline-block;
            width: 50%;
            cursor: pointer;
        `;

        const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement.classList.add('star-icon');
        svgElement.setAttribute("width", "20");
        svgElement.setAttribute("height", "20");
        svgElement.innerHTML = svg;

        button.appendChild(svgElement);
        button.addEventListener('click', callback);

        container.appendChild(button);
    });

    targetElement.parentNode.insertBefore(container, targetElement.nextSibling);
};

/**
 * Waits for the Vue app to initialize and executes a callback once ready.
 * @param {Function} callback - The callback to execute with the Vue app instance.
 */
const waitForVue = (callback) => {
    const appElement = document.querySelector('#app');
    if (appElement?.__vue__?._data?.global?.setTheme) {
        callback(appElement.__vue__);
    } else {
        setTimeout(() => waitForVue(callback), 300);
    }
};

// MAIN PLUGIN FUNCTION //
const fightcadePlugins = (fcWindow) => {
    fcWindow.currentChannel = 0;

    waitForVue((FCADE) => {
        const setTheme = (theme) => {
            FCADE._data.global.setTheme(theme);
            console.log(`Theme set to: ${theme}`);
        };

        const showFavorites = () => {
            const searchChannel = FCADE.$children.find((child) => child.$options.name === 'search-channel');
            if (searchChannel) {
                Object.assign(searchChannel, {
                    yearFilter: 0,
                    genreFilter: 0,
                    systemFilter: 0,
                    rankedFilter: 0,
                    textFilter: '',
                    favorites: true,
                });

                if (FCADE.activeChannelId !== 'search-channel') {
                    FCADE.gotoChannel('search-channel');
                }
                searchChannel.requestChannels();
            }
        };

        const changeChannel = (direction) => {
            const favorites = FCADE.global.localUser.favoritesChannels;
            const currentChannel = fcWindow.currentChannel;

            const nextIndex = (currentChannel + direction + favorites.length) % favorites.length;
            const nextChannel = favorites[nextIndex];

            fcWindow.currentChannel = nextIndex;

            const loadedChannels = FCADE.channels.filter((c) => c.emulator).map((c) => c.id);
            const channelToRemove = favorites.find((c) => loadedChannels.includes(c));
            if (channelToRemove) {
                FCADE.leaveChannel(channelToRemove);
            }

            FCADE.joinChannel(nextChannel);
            setTimeout(() => FCADE.gotoChannel(nextChannel), 1000);
        };

        const targetSelector = '#app > div.mainToolbarWrapper > div.mainToolbar > div.channelsList > a';
        const targetElement = fcWindow.document.querySelector(targetSelector);
        
        if(CONFIG.showFavoriteNavigationButtons) {
            if (targetElement) {
                addNavigationButtons(targetElement, () => changeChannel(-1), () => changeChannel(1));
            }
        }

        if (CONFIG.showFavoritesButton) {

            if (targetElement) {
                addStyledLink(targetElement, showFavorites, 'Show Favorites', '<polygon points="18,3 23,14 33,14 26,21 29,32 18,26 8,32 11,21 3,14 14,14" />');
            }
        }

        if (CONFIG.showThemeButtons) {
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                bottom: 10px;
                right: 10px;
                margin-top: 10px;
                margin-bottom: 10px;
                display: flex;
                flex-direction: column;
                gap: 3px;
                z-index: 10000;
            `;

            CONFIG.themes.forEach((theme) => {
                const button = document.createElement('button');
                button.textContent = theme;
                button.style.cssText = `
                    padding: 5px;
                    border-radius: 3px;
                    border: none;
                    cursor: pointer;
                    background-color: rgba(0, 0, 0, 0.7);
                    color: white;
                    font-family: Arial, sans-serif;
                    font-size: 8px;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                `;

                button.addEventListener('mouseover', () => { button.style.opacity = '1'; });
                button.addEventListener('mouseout', () => { button.style.opacity = '0.8'; });
                button.addEventListener('click', () => setTheme(theme));

                container.appendChild(button);
            });

            fcWindow.document.body.appendChild(container);
        }

        setTheme(CONFIG.startupTheme);
    });
};

// Add styles and start the plugin
addGlobalStyles();
fightcadePlugins(window);