// importera alla scener
import PlayScene from './play-scene';
import PreloadScene from './preload-scene';
import MenuScene from './menu-scene';

// spelets config
const config = {
    type: Phaser.AUTO,
    width: 834,
    height: 512,
    pixelArt: true,
    transparent: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: true
        }
    },
    scene: [PreloadScene, PlayScene, MenuScene],
    parent: 'game'
};

// initiera spelet
new Phaser.Game(config);
