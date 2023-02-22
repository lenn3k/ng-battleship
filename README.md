# Battleship

To whomever is reading this:

This is an angualar application I created after my first burn-out.
I wen't back to work after 6 months and as a way to freshen up my skills I created this application.
Just a simple Battleship game that lets you play against a computer that calculates where your ships are with some basic probablities.

Forward to this time of writing, again I find myself in a burn-out situation, this time it took me longer to recover and after a whole 11 months I decided it was time to start working again and see how it fares.
And yet again here we are, using this simple application to freshen up my skills.
I started by upgrading the appliation to the latest angular version (15 at this time) and moved on with adding sockets to it.
Admittingly this took a bit more digging in my memory for the skills to surface again but after some time spent I managed to build a multi-player version of the game using sockets as wel as a game lobby to create and join games.

The way I used sockets is probably not very efficient but as its the first time I used them I'm rather satisfied with the results

The game and mechanics are based on this [datagenetics article](http://www.datagenetics.com/blog/december32011/).

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.3.3.

## Development server

Run `yarn start` for a dev server.
Navigate to `http://localhost:4200/game` to play against AI.
Navigate to `http://localhost:4200/lobby` to play against other people. (This also requires the nodejs-battleship repo on my github)
The app will automatically reload if you change any of the source files.
