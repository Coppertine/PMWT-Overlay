
const COMMAND_PREFIX = "!pmwt";
const BanCount = 2;

const file = [];
let api = new Api();
api.getAPIKey();
let mappool = new Mappool();
setupMappool();
async function setupMappool() {
    await mappool.importFromJson("./pool.json");
    await mappool.render(document.getElementsByClassName("mappoolScene")[0]);
}
// Socket Events
// Credits: VictimCrasher - https://github.com/VictimCrasher/static/tree/master/WaveTournament
let socket = new ReconnectingWebSocket("ws://" + location.host + "/ws");

socket.onopen = () => {
    console.log("Successfully Connected");
};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};

// Chat
let chatDisplay = document.getElementById("chatBox");
let chatLen = 0;
let chatColour;



// Score Info
let currentScoreVisibility = false;
let movingScoreBars = $("#movingScoreBars");
let movingScoreBarRed = $("#movingScoreBarRed");
let movingScoreBarBlue = $("#movingScoreBarBlue");
let playScores = $("#playScores");
let playScoreRed = $("#playScoreRed");
let playScoreBlue = $("#playScoreBlue");
let currentScoreRed;
let currentScoreBlue;
let animation = {
    playScoreRed: new CountUp('playScoreRed', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    playScoreBlue: new CountUp('playScoreBlue', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: " ", decimal: "." }),
}

// Team Names
let teamRedName = $("#teamRedName");
let teamBlueName = $("#teamBlueName");
let currentTeamRedName;
let currentTeamBlueName;

// UserIDs with player avatars
let teamRedIcon = $("#teamRedIcon");
let teamBlueIcon = $("#teamBlueIcon");
let currentTeamRedIcon;
let currentTeamBlueIcon;

// Stars
let currentStarVisibility;
let currentBestOf;
let currentStarRed;
let currentStarBlue;
let teamRedStars = $("#teamRedStars");
let teamBlueStars = $("#teamBlueStars");

let showcaseScene = false;
let tempImg;
let tempMapName;
let tempMapArtist;
let tempMapMapper;

let tempMapCS;
let tempMapAR;
let tempMapOD;
let tempMapLength;
let tempMapBPM;
let tempMapSR;
let tempId;

// IPC State and Automation
let ipcState;
let canAutoPick = false;
let mappoolScene = false;
let gameplayScene = false;
let autoPickedMap = false;
let pickedMap = false;
let gameplayInPlay = false; // Used to display map stats during gameplay.
let currentPickTeam;
let currentBanTeam;
let currentProtectTeam;


// OBS Studio Controls.
if (window.obsstudio) {
    window.obsstudio.getCurrentScene(function (scene) {
        switch (scene.name) {
            case "Showcase":
                toShowcaseScene();
                break;
            case "Tournament Client":
                toTournamentClientScene();
                break;
            case "Ending Soon":
            case "Technical Difficulties":
            case "Intermission":
            case "Starting Soon":
                toIntermissionScene(scene.name);
                break;
            case "Mappool":
                toMappoolScene();
                break;
        }
    });

    window.addEventListener('obsSceneChanged', function (event) {
        switch (event.detail.name) {
            case "Showcase":
                toShowcaseScene();
                break;
            case "Tournament Client":
                toTournamentClientScene();
                break;
            case "Ending Soon":
            case "Technical Difficulties":
            case "Intermission":
            case "Starting Soon":
                toIntermissionScene(event.detail.name);
                break;
            case "Mappool":
                toMappoolScene();
                break;
        }
    });
}


function toShowcaseScene() {
    mappoolScene = false;
    showcaseScene = true;
    gameplayScene = false;
    $(".mainScreen").removeClass("mappoolClientScene");
    $(".mainScreen").removeClass("gameplayClientScene");
    $(".mainScreen").addClass("showcaseClientScene");
    $(".background p").text("");
    $(".showcaseMapStats").show();
    $("#chatBox").hide();

    ComfyJS.onChat = (user, message, flags, self, extra) => {
        var newMessage = document.createElement("li");
        var text = document.createElement("blockquote");

        newMessage.innerText = user;
        text.innerText = message;

        newMessage.append(text);
        document.querySelector("#twitchChatBox>ul").append(newMessage);
    }
    $(".mappoolScene").hide();
    $(".pickBans").hide();
}

function toTournamentClientScene() {
    mappoolScene = false;
    showcaseScene = false;
    gameplayScene = true;
    $(".mainScreen").removeClass("showcaseClientScene");
    $(".mainScreen").removeClass("mappoolClientScene");

    $(".mainScreen").addClass("gameplayClientScene");
    $(".gameplayScene").show();

    $(".showcaseMapStats").fadeOut("slow");
    $("#chatBox").show();
    $(".background p").text("");
    $(".mappoolScene").hide();
    $(".pickBans").hide();

}

function toIntermissionScene(sceneName) {
    showcaseScene = false;
    mappoolScene = false;
    gameplayScene = false;
    $(".mainScreen").removeClass("showcaseClientScene");
    $(".mainScreen").removeClass("gameplayClientScene");
    $(".mainScreen").removeClass("mappoolClientScene");

    $(".showcaseMapStats").fadeOut("slow");

    $(".gameplayScene").hide();
    $("#chatBox").hide();
    $(".background p").text(sceneName);
    $(".mappoolScene").hide();
    $(".pickBans").hide();
}

function toMappoolScene() {
    showcaseScene = false;
    mappoolScene = true;
    gameplayScene = false;

    $(".mainScreen").removeClass("showcaseClientScene");
    $(".mainScreen").removeClass("gameplayClientScene");
    $(".mainScreen").addClass("mappoolClientScene");
    $(".showcaseMapStats").fadeOut("slow");
    $(".mappoolScene").fadeIn();
    $(".pickBans").show();
}




socket.onmessage = event => {
    // showcaseScene = document.getElementsByClassName('showcaseClientScene').length;
    let data = JSON.parse(event.data);
    let beatmap = data.menu.bm;
    processShowcaseMaps(beatmap, data.menu.mods);
    if (tempId != data.menu.bm.id && mappool.isLoaded) {
        processPicksBans(data);
        tempId = data.menu.bm.id;
    }
    processChat(data);
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Team Names ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if (currentTeamRedName !== data.tourney.manager.teamName.left) {
        currentTeamRedName = data.tourney.manager.teamName.left;
        teamRedName.text(currentTeamRedName);
        setTeamIcon(teamRedIcon, currentTeamRedName);
        teamRedIcon.show();
    }
    if (currentTeamBlueName !== data.tourney.manager.teamName.right) {
        currentTeamBlueName = data.tourney.manager.teamName.right;
        teamBlueName.text(currentTeamBlueName);
        setTeamIcon(teamBlueIcon, currentTeamBlueName);

        teamBlueIcon.show();
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Generate Stars ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    function generateStar(starNo, starSide, starStatus) {
        let starCreate = document.createElement("div");
        starCreate.classList.add("star");
        if (starStatus == "fill") starCreate.classList.add("starFill")
        starCreate.style.transition = "500ms ease-in-out";
        // Decide whether the star should be on the left or right side of the screen
        if (starSide == "left") starCreate.style.left = `${120 + (i * 50)}px`;
        else starCreate.style.right = `${(120 + (i * 50))}px`;
        return starCreate;
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Stars Visibility ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if (currentStarVisibility !== data.tourney.manager.bools.starsVisible) {
        currentStarVisibility = data.tourney.manager.bools.starsVisible;
        if (currentStarVisibility) {
            teamRedStars.show();
            teamBlueStars.show();
        } else {
            teamRedStars.hide();
            teamBlueStars.hide();
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Setting Star Count ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if (currentBestOf !== Math.ceil(data.tourney.manager.bestOF / 2) ||
        currentStarRed !== data.tourney.manager.stars.left ||
        currentStarBlue !== data.tourney.manager.stars.right) {
        // Best Of
        currentBestOf = Math.ceil(data.tourney.manager.bestOF / 2);

        // Left Stars
        currentStarRed = data.tourney.manager.stars.left;
        teamRedStars.innerHTML = '';
        for (var i = 0; i < currentStarRed; i++) teamRedStars.append(generateStar(i, "left", "fill"));
        for (i; i < currentBestOf; i++) teamRedStars.append(generateStar(i, "left", "nofill"));

        // Right Stars
        currentStarBlue = data.tourney.manager.stars.right;
        teamBlueStars.innerHTML = '';
        for (var i = 0; i < currentStarBlue; i++) teamBlueStars.append(generateStar(i, "right", "fill"));
        for (i; i < currentBestOf; i++) teamBlueStars.append(generateStar(i, "right", "nofill"));
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Score Display ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if (currentScoreVisibility !== data.tourney.manager.bools.scoreVisible) {
        currentScoreVisibility = data.tourney.manager.bools.scoreVisible;
        if (currentScoreVisibility) {
            // Score visible -> Set bg bottom to full
            $("#chatBox").hide();
            playScoreBlue.show();
            playScoreRed.show();
        } else {
            // Score invisible -> Set bg to show chats
            $("#chatBox").show();
            playScoreBlue.hide();
            playScoreRed.hide();
            movingScoreBarBlue.css("width", 0);
            movingScoreBarRed.css("width", 0);
        }
    }

    if (currentScoreVisibility) {
        currentScoreRed = data.tourney.manager.gameplay.score.left;
        currentScoreBlue = data.tourney.manager.gameplay.score.right;

        animation.playScoreRed.update(currentScoreRed);
        animation.playScoreBlue.update(currentScoreBlue);

        if (currentScoreRed > currentScoreBlue) {
            playScoreRed.css("fontSize", "45px");
            playScoreBlue.css("fontSize", "35px");
            movingScoreBarRed.css("width", ((currentScoreRed - currentScoreBlue) / 300000 * 960) + "px");
            movingScoreBarBlue.css("width", 0);
        } else if (currentScoreRed == currentScoreBlue) {
            playScoreRed.css("fontSize", "35px");
            playScoreBlue.css("fontSize", "35px");
            movingScoreBarRed.css("width", 0);
            movingScoreBarBlue.css("width", 0);
        } else {
            playScoreRed.css("fontSize", "35px");
            playScoreBlue.css("fontSize", "45px");
            movingScoreBarRed.css("width", 0);
            movingScoreBarBlue.css("width", ((currentScoreBlue - currentScoreRed) / 300000 * 960) + "px");
        }
    }

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ IPC Automation ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if (ipcState !== data.tourney.manager.ipcState) {
        ipcState = data.tourney.manager.ipcState;
        if (ipcState == 3) // Playing
        {
            pickedMap = false;
            autoPickedMap = false;
            gameplayInPlay = true;
            $(".mainScreen").addClass("inPlay");
        }
        else if (ipcState == 4) // Ranking Screen.
        {
            $(".mainScreen").removeClass("inPlay");
            setTimeout(() => {
                if (currentStarVisibility && !(currentScoreRed == currentBestOf || currentScoreBlue == currentBestOf)) {
                    if (!window.obsstudio)
                        toMappoolScene();
                    else if (!mappoolScene)
                        window.obsstudio.setCurrentScene("Mapool");
                }
            }, 20000);
        }
    }

}


function setTeamIcon(div, teamName) {
    // Read the teams.json file and get the teamIcon value for the teamName
    // If the teamName is not found, return the default icon ("assets/coolshrooms.png")
    var teamIconSet = false;
    // Read the teams.json file
    $.getJSON("teams.json", function (result) {

        // Loop through the teams and find the teamName

        result.forEach(field => {
            if (field.teamName === teamName) {
                div.attr("src", `${field.teamIcon}`);
                teamIconSet = true;
                return;
            }
        });
        if (!teamIconSet)
            div.attr("src", "./assets/coolshrooms.png");
        return;
    });
}

function processShowcaseMaps(bm, mods) {
    const mapName = formatBeatmapName(bm);
    if (tempMapName !== mapName) {
        tempMapName = mapName;
        document.getElementsByClassName("showcaseMapName")[0].innerText = mapName;
    }
    if (tempMapArtist !== bm.metadata.artist) {
        tempMapArtist = bm.metadata.artist;
        document.getElementsByClassName("showcaseMapArtist")[0].innerText = bm.metadata.artist;
    }

    if (tempMapMapper !== bm.metadata.mapper) {
        tempMapMapper = bm.metadata.mapper;
        document.getElementsByClassName("showcaseMapMapper")[0].innerText = bm.metadata.mapper;
    }

    if (tempImg !== bm.path.full) {
        tempImg = bm.path.full;
        bm.path.full = bm.path.full.replace(/#/g, '%23').replace(/%/g, '%25').replace(/\\/g, '/');
        $("#showcaseMapInfo img")[0].src = `http://${location.host}/Songs/${bm.path.full}?a=${Math.random(10000)}`;
    }

    if (showcaseScene || gameplayInPlay) {
        if (tempMapCS !== bm.stats.CS) {
            tempMapCS = bm.stats.CS;
            $("#showcaseMapInfo .showcaseMapCS").text(`CS: ${bm.stats.CS}`);
        }
        if (tempMapAR !== bm.stats.AR) {
            tempMapAR = bm.stats.AR;
            $("#showcaseMapInfo .showcaseMapAR").text(`AR: ${bm.stats.AR}`);
        }
        if (tempMapOD !== bm.stats.OD) {
            tempMapOD = bm.stats.OD;
            $("#showcaseMapInfo .showcaseMapOD").text(`OD: ${bm.stats.OD}`);
        }
        if (tempMapLength !== timeFromLength(bm.time.full, mods)) {
            tempMapLength = timeFromLength(bm.time.full, mods);
            $("#showcaseMapInfo .showcaseMapLength").text(timeFromLength(bm.time.full, mods));
        }
        if (tempMapSR !== bm.stats.fullSR) {
            tempMapSR = bm.stats.fullSR;
            $("#showcaseMapInfo .showcaseMapSR").text(`${bm.stats.fullSR}*`);
        }
        if (tempMapBPM !== bm.stats.BPM.max) {
            tempMapBPM = bm.stats.BPM.max;
            $("#showcaseMapInfo .showcaseMapBPM").text(`BPM: ${bm.stats.BPM.max}`);
        }
    }

    if(showcaseScene) {
        // Check if map is in mappool
        if (!mappool.containsMap(bm.id))
            return;
        let showcaseMap = mappool.getMap(bm.id);
        let modShort = getShortFormMod(showcaseMap.mod.name);
        let modSlot = mappool.getModBeatmap(showcaseMap.mod.name).beatmaps.findIndex(map => map.id == bm.id) + 1;
        document.getElementById("showcaseCurrentModMap").className = "";
        document.getElementById("showcaseCurrentModMap").classList.add(showcaseMap.mod.name);
        document.getElementById("showcaseCurrentModMap").innerText = `${modShort}${modSlot}`;
    }
}

function processPicksBans(data) {
    console.log(`Finding map for ${data.menu.bm.id}`)
    //  Auto Picks
    if (!mappool.containsMap(data.menu.bm.id))
        return;
    console.log(`Found map for ${data.menu.bm.id}`);
    if (mappoolScene && canAutoPick && !autoPickedMap && !pickedMap && currentPickTeam) {
        mappool.addPick(data.menu.bm.id, currentPickTeam);
        autoPickedMap = true;
        pickedMap = true;
        // wait 2 seconds before running section below
        setTimeout(function () {
            if (window.obsstudio)
                window.obsstudio.setCurrentScene("Tournament Client");
        }, 2000);
    }
}

function formatBeatmapName(bm) {
    return `${bm.metadata.title} [${bm.metadata.difficulty}]`;
}

function timeFromLength(length, mods) {
    // mod check time, if bitflag of mods.num has 64 (DT), divide by 1.5

    if (mods.num & 64) {
        length = length / 1.5;
    }

    // Convert length from milliseconds to X:XX (minutes:seconds)
    let minutes = Math.floor(length / 60000);
    let seconds = ((length % 60000) / 1000).toFixed(0);
    return `${minutes}:${(seconds < 10 ? '0' : '')}${seconds}`;
}

function processChat(data) {
    if (!data.tourney.manager.chat) return;
    if (currentScoreVisibility) return;
    if (!mappool.isLoaded) return;
    if (chatLen != data.tourney.manager.chat.length) {
        if (chatLen == 0 || (chatLen > 0 && chatLen > data.tourney.manager.chat.length)) {
            chatDisplay.innerHTML = "";
            chatLen = 0;
        }

        // Add the chats
        for (var i = chatLen; i < data.tourney.manager.chat.length; i++) {
            if (data.tourney.manager.chat[i].messageBody.startsWith(COMMAND_PREFIX)) {
                if (data.tourney.manager.chat[i].team != "red"
                    || data.tourney.manager.chat[i].team != "blue") {
                    processCommand(data.tourney.manager.chat[i]);
                }
            }

            tempClass = data.tourney.manager.chat[i].team;
            let chatParent = Object.assign(document.createElement('div'), {
                className: 'chatMessage'
            });

            let chatTime = Object.assign(document.createElement('div'), {
                className: 'chatTime',
                innerText: data.tourney.manager.chat[i].time
            });

            let chatUser = Object.assign(document.createElement('div'), {
                className: 'chatUser',
                innerText: `${data.tourney.manager.chat[i].name}:\xa0`
            });

            let chatMessage = Object.assign(document.createElement('div'), {
                className: 'chatBody',
                innerText: data.tourney.manager.chat[i].messageBody
            });

            chatUser.classList.add(tempClass);
            chatParent.appendChild(chatTime);
            chatParent.appendChild(chatUser);
            chatParent.appendChild(chatMessage);
            chatDisplay.appendChild(chatParent);
        }
        chatLen = data.tourney.manager.chat.length;
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
    }
}

function processCommand(chatMsg) {
    console.log(`Processing command: ${chatMsg.messageBody}`);
    let command = chatMsg.messageBody.substring(COMMAND_PREFIX.length + 1); // Accounts for space after prefix
    let commandArgs = command.split(" ");
    let commandName = commandArgs[0];
    switch (commandName) {
        case "ban":
            processBanCommand(commandArgs);
            break;
        case "protecc":
            processProtectCommand(commandArgs);
            break;
        case "mappool":
            if (window.obsstudio)
                window.obsstudio.setCurrentScene("Mappool");
            break;
    }
}

function processBanCommand(args) {
    console.log(`Processing ban command: ${args}`);
    if (mappool.isBanned(args[2]))
        return;
    mappool.addBan(args[1], args[2]);
    // Need to check if this is the first ban in the mappool. 
    // If so, we need to set the currentPickTeam to be opposite to the team that banned the map.
    if (mappool.getBans().length == 1) {
        currentPickTeam = args[2] == "blue" ? "red" : "blue";
    }
    if (mappool.getBans().length == BanCount) {
        console.log("Bans are done, starting picks.");
        canAutoPick = true;
    }
}

function processProtectCommand(args) {
    console.log(`Processing protect command: ${args}`);
    mappool.addProtect(args[1], args[2]);
}

function toggleMapPoolDisplay() {
    $(".mainScreen").toggleClass("gameplayClientScene");
    $(".mapPoolScene").toggle();
    $(".pickBans").toggle();
}

function addPick(mapId) {
    // Check if map is in mappool
    if (!mappool.containsMap(mapId))
        return;
    // Check if map is already banned, picked or protected.
    if (mappool.isBanned(mapId) || mappool.isPicked(mapId) || mappool.isProtected(mapId))
        return;

    mappool.addPick(mapId, currentPickTeam);
    // Swap pick team
    currentPickTeam = currentPickTeam == "blue" ? "red" : "blue";
}

function addBan(mapId, team = "") {
    // Check if map is in mappool
    if (!mappool.containsMap(mapId))
        return;
    // Check if map is already banned, picked or protected.
    if (mappool.isBanned(mapId) || mappool.isPicked(mapId) || mappool.isProtected(mapId))
        return;
    if (team != "")
        currentBanTeam = team;
    mappool.addBan(mapId, currentBanTeam);
    // Swap ban team
}

function addProtect(mapId, team) {
    // Check if map is in mappool
    if (!mappool.containsMap(mapId))
        return;
    // Check if map is already banned, picked or protected.
    if (mappool.isBanned(mapId) || mappool.isPicked(mapId) || mappool.isProtected(mapId))
        return;
    mappool.addProtect(mapId, team);
}
