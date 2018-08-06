HTML5 panorama player
======================

This panorama player is based on [pannellum](https://github.com/mpetroff/pannellum) project.

The goal of this project is to extract main pannellum functionalities into separate components to be loaded on demand as well as learn JavaScript OOP and WebGL techniques.


Settings
---
The settins object five four main sections:
1. viewer
2. controls
3. modules
4. set
5. require

__"require" option__
This option allows load external settings files. Those files may have settings
for the whole project, for the "set" section and for particular panorama in "panorama" section.
It has format "require" : { "id": "settings-1", mode : replace|update}.
If "replace" specified, the loaded settings will rplace the current one.
It usualy happens when settings requested via query string. Those have the highest
priority by default.
