# research/ — not production

Downloaded repos, assets, isolated prototypes and reports for the 2026-11 improvement round.
Nothing here is loaded by work/build/*.html. Production changes go through pipeline/add_*.py + build.sh.

- repositories/<area>/<name>/  shallow clones or extracted files; each has SOURCE.md (url, commit, license)
- assets/<kind>/<name>/        downloaded models/textures/sounds; each has SOURCE.md (url, license, attribution, format, notes)
- prototypes/<area>/           standalone HTML pages (three@0.187 from jsdelivr) proving one thing each
- reports/                     architecture, research, license, roadmap, agent execution

Do not vendor node_modules or whole repos into pipeline/. Copy the file(s) you use and record the source.
