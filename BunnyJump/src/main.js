import Phaser from './lib/phaserExport.js'
import Game from './scenes/Game.js'
import GameOver from './scenes/GameOver.js'

export default new Phaser.Game({
    type: Phaser.CANVAS,
    width: 480,
    height: 640,
    scene: [Game, GameOver],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 200
            },
            debug: false
        }
    }
})
//Phaser.AUTO
//console.dir(Phaser)
//console.log('Hello World')