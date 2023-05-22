class Beatmap {
    constructor(id, mod) {
        this.id = id;
        this.setid = 0;
        this.title = "";
        this.artist = "";
        this.difficultyName = "";
        this.mapper = "";
        this.mod= mod;
    }

    async populate() {
        let json = await api.getBeatmap(this.id).then((result) => {
            this.title = `${result[0].title} [${result[0].version}]`;
            this.artist = result[0].artist;
            if(this.artist == "Emiru no Aishita Tsukiyo ni Dai San Gensou Kyoku wo")
                this.artist = "Emille's Moonlight Serenade"; // Quick fix to prevent overflowing to the mod icons.
            this.mapper = result[0].creator;
            this.setid = result[0].beatmapset_id;
        });
        return;
    }
}

class Mod {
    constructor(name, colour) {
        this.name = name;
        this.colour = colour;
    }
}

// each Mappool is a collection of ModBeatmaps which contain the Mod and list of Beatmaps
class Mappool {
    constructor() {
        this.modBeatmaps = [];
        this.isLoaded = false;
    }

    getBans() {
        // Find all beatmaps in each modbeatmaps that have the `ban` class
        let bans = [];
        for (let modBeatmap of this.modBeatmaps) {
            for (let beatmap of modBeatmap.beatmaps) {
                if (document.getElementById(beatmap.id).classList.length == 1)
                    continue;
                if (document.getElementById(beatmap.id).classList.contains("ban")) {
                    bans.push(beatmap);
                }
            }
        }
        return bans;
    }

    // returns true if the mappool contains the given map id
    containsMap(mapid) {
        for (let modBeatmap of this.modBeatmaps) {
            for (let beatmap of modBeatmap.beatmaps) {
                if (beatmap.id == mapid)
                    return true;
            }
        }
        return false;
    }

    // returns the ModBeatmap with the given mod
    getModBeatmap(mod) {
        return this.modBeatmaps.find(modBeatmap => modBeatmap.mod.name == mod);
    }

    // adds a new ModBeatmap to the Mappool
    addModBeatmap(modBeatmap) {
        this.modBeatmaps.push(modBeatmap);
    }

    async importFromJson(jsonPath) {
        const json = await $.getJSON(jsonPath, (result) => {
            result.forEach((modBeamapList) => {
                let mod = new Mod(modBeamapList.mod, modBeamapList.colour);
                let beatmaps = [];
                modBeamapList.maps.forEach((beatmap) => {
                    beatmaps.push(new Beatmap(beatmap, mod));
                });
                this.addModBeatmap(new ModBeatmaps(mod, beatmaps));
            });
        });
    }

    addBan(team, beatmapid) {
        if (team != "red" && team != "blue")
            return false;

        // find the mappoolMapInfo element with the given beatmapid as the id
        // add the classes "ban red" or "ban blue" depending on the team

        let mapInfo = document.getElementById(beatmapid);
        mapInfo.classList.add("ban", team);
    }

    addPick(beatmapid, team) {
        if (team != "red" && team != "blue")
            return false;

        // find the mappoolMapInfo element with the given beatmapid as the id
        // add the classes "pick red" or "pick blue" depending on the team
        if (document.getElementsByClassName("selected").length > 0)
            document.getElementsByClassName("selected")[0].classList.remove("selected");

        let mapInfo = document.getElementById(beatmapid);
        mapInfo.classList.add("pick", team, "selected");

        // TODO: Add scroll to selected map
        document.getElementsByClassName("mappoolScene")[0].scrollTo(0, mapInfo.offsetTop);
    }

    addProtect(team, beatmapid) {
        if (team != "red" && team != "blue")
            return false;

        // find the mappoolMapInfo element with the given beatmapid as the id
        // add the classes "protecc red" or "protecc blue" depending on the team
        let mapInfo = document.getElementById(beatmapid);
        mapInfo.classList.add("protecc", team);
    }

    removeBan(beatmapid) {
        let mapInfo = document.getElementById(beatmapid);
        mapInfo.classList.remove("ban", "red", "blue");
    }

    removePick(beatmapid) {
        let mapInfo = document.getElementById(beatmapid);
        mapInfo.classList.remove("pick", "red", "blue");
    }

    removeProtect(beatmapid) {
        let mapInfo = document.getElementById(beatmapid);
        mapInfo.classList.remove("protecc", "red", "blue");
    }

    isBanned(beatmapid) {
        let mapInfo = document.getElementById(beatmapid);
        return mapInfo.classList.contains("ban");
    }

    isPicked(beatmapid) {
        let mapInfo = document.getElementById(beatmapid);
        return mapInfo.classList.contains("pick");
    }

    isProtected(beatmapid) {
        let mapInfo = document.getElementById(beatmapid);
        return mapInfo.classList.contains("protecc");
    }

    async render(mapPoolDiv) {
        for (let modBeatmap of this.modBeatmaps) {
            let modContainer = Object.assign(document.createElement("div"), {
                className: `modContainer ${modBeatmap.mod.name}`
            });

            for (let beatmap of modBeatmap.beatmaps) {
                await beatmap.populate();
                let mapInfo = Object.assign(document.createElement("div"), {
                    className: "mappoolMapInfo",
                    id: beatmap.id,
                });

                let mapCover = Object.assign(document.createElement("img"), {
                    src: `https://assets.ppy.sh/beatmaps/${beatmap.setid}/covers/cover.jpg`
                });

                let textOverlayContainer = Object.assign(document.createElement("div"), {
                    className: "textOverlayContainer"
                });

                let mapName = Object.assign(document.createElement("div"), {
                    className: "mappoolMapName",
                    innerHTML: beatmap.title
                });

                let mapArtist = Object.assign(document.createElement("div"), {
                    className: "mappoolMapArtist",
                    innerHTML: beatmap.artist
                });

                let mapMapper = Object.assign(document.createElement("div"), {
                    className: "mappoolMapMapper",
                    innerHTML: beatmap.mapper
                });

                textOverlayContainer.appendChild(mapName);
                textOverlayContainer.appendChild(mapArtist);
                textOverlayContainer.appendChild(mapMapper);

                mapInfo.appendChild(mapCover);
                mapInfo.appendChild(textOverlayContainer);
                modContainer.appendChild(mapInfo);
            }
            mapPoolDiv.appendChild(modContainer);

        }

        this.isLoaded = true;
    }

    getMap(beatmapid) {
        for (let modBeatmap of this.modBeatmaps) {
            for (let beatmap of modBeatmap.beatmaps) {
                if (beatmap.id == beatmapid)
                    return beatmap;
            }
        }
        return null;
    }
}

class ModBeatmaps {
    constructor(mod, beatmaps) {
        this.mod = mod;
        this.beatmaps = beatmaps;
    }
}

function getShortFormMod(mod) {
    // possible cases are: nomod, hidden, hardrock, hidden-hardrock, doubletime, hidden-doubletime, freemod and tiebreaker
    switch (mod) {
        case "nomod":
            return "NM";
        case "hidden":
            return "HD";
        case "hardrock":
            return "HR";
        case "hidden-hardrock":
            return "HDHR";
        case "doubletime":
            return "DT";
        case "hidden-doubletime":
            return "HDDT";
        case "freemod":
            return "FM";
        case "tiebreaker":
            return "TB";
        default:
            return "";
    }
}
