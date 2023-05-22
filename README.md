PMWT Steaming Overlay
-----------------------
Designed by cloudical / Coppertine

Developed by Coppertine using parts from lil onion, Hoaq and VictimCrasher's overlays.


Setup
=======

Create a profile on OBS Studio (optimised for streaming, using base of 1080p and using the stream key in #streamers) 
Import the PMWT.json file in Scene Collection -> Import.
Go to Edit -> Advanced Audio Properties and set the Audio Monitoring section for "osu! Audio" and "Tourney Audio" to "Monitor and Output"

Create a new folder, call it `osu`.
Copy paste osu!.exe to the `osu` folder and run it, log in (with username and password remembered). Close and copy / paste the tournament.cfg file into the osu folder and run the executable.

In gosumemory folder, start the gosumemory.exe (if not downloaded, download from https://github.com/l3lackShark/gosumemory). To see if it works, restart OBS or click on "Gosumemory" Source and hit "Refresh".


Navigation
==========
A lot of the scenes will be controlled from the OBS scenes on the left and are mostly self explanitory, however there are no timers in this overlay.
(cuz lazy)

- Go to Tournament Client to show the main tournament match.
- Go to Showcase if you are doing mappool showcases (this only works for a osu! resolution of 1280 x 720)
- Go to Seeding if you want to do lazer... why?
- Any others will show the text and an icon as an intermission scene.


Building
=========
If you want to modify any style files, please modify files in the `sass/` folder and run.
`sass --watch sass:style`

The web application is built with gosumemory / obs chromium browser in mind and everything seen is rendered in the browser (no videos).

Commands
========
gosumemory listens to commands on the multiplayer lobby chat from the referee (player without a team assigned) that has a prefix: `!pmwt`
| Command | Description | Example |
| --- | --- | --- |
| `!pmwt mappool` | Forces the stream view to the mappool | |
| `!pmwt ban [id] <red/blue>` | Bans a spesific map by `id` by the team, stated or not.<br>Teams will swap over on the next ban command unless stated.| `!pmwt ban 12345 red`<br>`!pmwt ban 1235` |
| `!pmwt protecc [id] [red/blue]` | Protects a spesific map by `id` by the team. | `!pmwt protecc 12345 red` |

Twitch Chat
======
gosumemory listens to the twitch chat using https://github.com/instafluff/ComfyJS to display chat onto the Showcase scene.
The functionality is scuffed and could be improved. This can also have the ability to allow gosumemory serve as a twitch chatbot for spesific commands in the future / by someone elses implementation.
