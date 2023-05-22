class Api {
    async getAPIKey() {
        try {
            const jsonData = await $.getJSON("lib/api.json");
            jsonData.map((num) => {
                file.push(num);
            });
            this.apiKey = file[0].apiKey;
            this.twitchKey = file[0].twitchOauthKey;
        } catch (error) {
            console.error("Could not read JSON file", error);
        }
    }

    async getBeatmap(beatmapId) {
        const url = `https://osu.ppy.sh/api/get_beatmaps?k=${this.apiKey}&b=${beatmapId}`;
        // Do a fetch() request to the url
        let json;
        const response = await fetch(url);
        // If the response is OK, parse the JSON
        if (response.ok) {
            json = await response.json();
            console.log(json);
        } else {
            console.error("HTTP-Error: " + response.status);
        }
        // Return the JSON
        return json;
    }

    constructor() {
        this.apiKey = "";
        this.twitchKey = "";
    }


}

