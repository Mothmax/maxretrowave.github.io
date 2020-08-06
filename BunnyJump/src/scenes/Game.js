import Phaser from '../lib/phaserExport.js'

import Carrot from'../game/Carrot.js'

export default class Game extends Phaser.Scene
{
    /** @type {Phaser.Physics.Arcade.Sprite} */
    //player = null

    init()
    {
        this.carrotsCollected = 0
    }

    constructor()
    {
        super('game')

        /** @type {Phaser.Physics.Arcade.Sprite} */
        this.player = null

         /** @type {Phaser.Physics.Arcade.StaticGroup} */
        this.platforms = null

        /** @type {Phaser.Physics.Arcade.Group} */
        this.carrots = null

        this.carrotsCollected = 0

        this.overlapping = false
    }

    preload()
    {
        this.load.image('carrot', 'assets/carrot.png')
        this.load.image('background', 'assets/bg_layer1.png')
        this.load.image('platform', 'assets/ground_grass.png')
        this.load.image('bunny-stand', 'assets/bunny1_stand.png')
        this.load.image('bunny-jump', 'assets/bunny1_jump.png')

        /** @type {Phaser.Physics.Arcade.keyboard.createCursorKeys} */
        this.cursors = this.input.keyboard.createCursorKeys()
    }


    create()
    {
        this.add.image(240, 320, 'background').setScrollFactor(1, 0)
        //this.physics.add.image(240,320,'platform').setScale(0.5)
        this.platforms = this.physics.add.staticGroup()

// then create 5 platforms from the group
        for (let i = 0; i < 5; ++i) 
        {
            const x = Phaser.Math.Between(80, 400) 
            const y = 150 * i
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x, y, 'platform')
            platform.scale = 0.5

            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const body = platform.body
            body.updateFromGameObject()
        }
        this.player = this.physics.add.sprite(240, 320, 'bunny-stand').setScale(0.5)
        this.physics.add.collider(this.platforms, this.player)
        
        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.left = false
        this.player.body.checkCollision.right = false

        this.cameras.main.startFollow(this.player)

        // set the horizontal dead zone to 1.5x game width
        this.cameras.main.setDeadzone(this.scale.width * 1.5)

        this.carrots = this.physics.add.group({
            classType: Carrot
        })

        this.physics.add.collider(this.platforms, this.carrots)
        this.physics.add.overlap(this.player,
            this.carrots,
            this.handleCollectCarrot, // called on overlap 
            undefined,
            this)

        const style = { color: '#000', fontSize: 24 }
        this.carrotsCollectedText = this.add.text(240, 10, 'Carrots: 0', style).setScrollFactor(0)
        .setOrigin(0.5, 0)
    }

    update()
    {
        this.platforms.children.iterate(child => 
        {
            /** @type {Phaser.Physics.Arcade.Sprite} */ 
            const platform = child
            const scrollY = this.cameras.main.scrollY 
            if (platform.y >= scrollY + 700)
            {
                platform.y = scrollY - Phaser.Math.Between(50, 80)
                platform.body.updateFromGameObject()
                this.addCarrotAbove(platform)
            }
        })

        const touchingDown = this.player.body.touching.down
        if (touchingDown && this.overlapping == false)
        {
            this.player.setVelocityY(-300)
            this.player.setTexture('bunny-jump')
        }

        const vy = this.player.body.velocity.y
        if (vy > 0 && this.player.texture.key !== 'bunny-stand')
        {
            // switch back to jump when falling
            this.player.setTexture('bunny-stand') 
        }

        // left and right input logic
        if (this.cursors.left.isDown && !touchingDown)
        {
            this.player.setVelocityX(-200)
        }
        else if (this.cursors.right.isDown && !touchingDown)
        {
            this.player.setVelocityX(200)
        }
        else 
        {
            // stop movement if not left or right
            this.player.setVelocityX(0)
        }

        this.horizontalWrap(this.player)

        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 200)
        {
            this.scene.start('game-over')
        }
    }

    /**
    * @param {Phaser.GameObjects.Sprite} sprite
    */
    horizontalWrap(sprite)
    {
        const halfWidth = sprite.displayWidth * 0.5 
        const gameWidth = this.scale.width
        if (sprite.x < -halfWidth)
        {
            sprite.x = gameWidth + halfWidth
        }
        else if (sprite.x > gameWidth + halfWidth) 
        {
            sprite.x = -halfWidth
        }
    }

    /**
    @param {Phaser.GameObjects.Sprite} sprite */
    addCarrotAbove(sprite)
    {
        const y = sprite.y - sprite.displayHeight
        /** @type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get(sprite.x, y, 'carrot')
        carrot.setActive(true)
        carrot.setVisible(true)

        this.add.existing(carrot)
        // update the physics body size
        carrot.body.setSize(carrot.width, carrot.height)

        this.physics.world.enable(carrot)

        return carrot
    }

    /**
    @param {Phaser.Physics.Arcade.Sprite} player * @param {Carrot} carrot
    */
    handleCollectCarrot(player, carrot)
    {
        if (!this.player.body.touching.down)
        {
            this.overlapping = true
            this.carrotsCollected++
            const value = `Carrots: ${this.carrotsCollected}`
            this.carrotsCollectedText.text = value
            // hide from display
            this.carrots.killAndHide(carrot)
            // disable from physics world
            this.physics.world.disableBody(carrot.body)
            this.overlapping = false
        }
    }

    findBottomMostPlatform()
    {
        var platform = null
        var max = null
        this.platforms.children.iterate(child => 
        {
            if (max == null)
            {
                max = child.y
                platform = child;
            }
            else
            {
                if (child.y > max)
                {
                    max = child.y
                    platform = child
                }
            }
            
        })

        return platform
    }
}