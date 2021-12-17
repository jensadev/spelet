class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
    }
    create() {
        this.jumpIsUsed = false;
        this.jumpIsAllowed = false;
        this.dashIsUsed = false;
        // variabel för att hålla koll på hur många gånger vi spikat oss själva
        this.spiked = 0;

        // ladda spelets bakgrundsbild, statisk
        // setOrigin behöver användas för att den ska ritas från top left
        //this.add.image(0, 0, 'background').setOrigin(0, 0);
        
        // skapa en tilemap från JSON filen vi preloadade
        const map = this.make.tilemap({ key: 'map' });
        // ladda in tilesetbilden till vår tilemap
        const tileset = map.addTilesetImage('jefrens_tilesheet', 'tiles');

        // initiera animationer, detta är flyttat till en egen metod
        // för att göra create metoden mindre rörig
        this.initAnims();

        // keyboard cursors
        this.cursors = this.input.keyboard.createCursorKeys();

        // Ladda lagret Platforms från tilemappen
        // och skapa dessa
        // sätt collisionen
        map.createLayer('background', tileset);
        map.createLayer('foreground', tileset);
        this.platforms = map.createLayer('platforms', tileset);
        this.platforms.setCollisionByExclusion(-1, true);
        // platforms.setCollisionByProperty({ collides: true });
        // this.platforms.setCollisionFromCollisionGroup(
        //     true,
        //     true,
        //     this.platforms
        // );
        // platforms.setCollision(1, true, true);

        // skapa en spelare och ge den studs
        this.player = this.physics.add.sprite(50, 300, 'player');
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.setData('health', 8);
        this.player.setScale(0.5,0.5)

        // skapa en fysik-grupp
        this.spikes = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        // från platforms som skapats från tilemappen
        // kan vi ladda in andra lager
        // i tilemappen finns det ett lager Spikes
        // som innehåller spikarnas position

        /*map.getObjectLayer('Spikes').objects.forEach((spike) => {
            // iterera över spikarna, skapa spelobjekt
            const spikeSprite = this.spikes
                .create(spike.x, spike.y - spike.height, 'spike')
                .setOrigin(0);
            spikeSprite.body
                .setSize(spike.width, spike.height - 20)
                .setOffset(0, 20);
        });*/
        // lägg till en collider mellan spelare och spik
        // om en kollision sker, kör callback metoden playerHit
        this.physics.add.collider(this.player, this.spikes, this.playerHit, null, this);

        // krocka med platforms lagret
        this.physics.add.collider(this.player, this.platforms, this.jump, null, this);

        // skapa text på spelet, texten är tom
        // textens innehåll sätts med updateText() metoden
        this.text = this.add.text(16, 16, '', {fontSize: '20px', fill: '#ffffff'});
        this.text.setScrollFactor(0);
        this.updateText();

        // lägg till en keyboard input för P
        this.keyObj = this.input.keyboard.addKey('P', true, false);

        this.SpaceKey = this.input.keyboard.addKey(32);
        this.WKey = this.input.keyboard.addKey('W');
        this.AKey = this.input.keyboard.addKey('A');
        this.SKey = this.input.keyboard.addKey('S');
        this.DashKey = this.input.keyboard.addKey(16);
        this.DKey = this.input.keyboard.addKey('D');

        // exempel för att lyssna på events
        this.events.on('pause', function () {console.log('Play scene paused');});
        this.events.on('resume', function () {console.log('Play scene resumed');});

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setLerp(0.1, 0.1);
        this.cameras.main.setDeadzone(0, 0);
        this.cameras.main.setViewport(0, 0, 896, 448);
        this.cameras.main.setBounds(0, 0, 896, 448);

        this.physics.world.setBounds(0, 0, 896, 448);

        this.foes = this.physics.add.group({});
        this.donuts = this.physics.add.group({});
        this.bullets = this.physics.add.group({});

        this.physics.add.collider(this.foes, this.platforms);
        this.physics.add.overlap(this.foes, this.donuts, this.destroyDonutAndFoe);
        this.physics.add.overlap(this.player, this.bullets, this.damagePlayer);
        this.physics.add.collider(this.donuts, this.platforms, this.destroyDonut);
        this.physics.add.collider(this.bullets, this.platforms, this.destroyBullet);

        this.input.on('pointerdown', function (pointer) {
            this.pointerIsDown = true;
        }, this);

        this.input.on('pointerup', function (pointer) {
            this.pointerIsDown = false;
        }, this);

        this.donutCooldown = 0;
        this.bulletCooldown = 0;
    }

    // play scenens update metod
    update() {

        if (this.player.getData('health') <= 0){
            if (this.text.text != 'Game Over')
            this.text = this.add.text(0, (this.game.config.height / 2) - 128, 'Game Over', {
                fontFamily: '"Mochiy Pop P One"',
                fontSize: '128px',
                fill: '#ff0000',
                align: 'center',
                fixedWidth: this.game.config.width,
                fixedHeight: this.game.config.height,
            });
            this.player.setVelocityX(this.player.body.velocity.x * 0.93)
            return;
        }

        // för pause
        if (this.keyObj.isDown) {
            // pausa nuvarande scen
            this.scene.pause();
            // starta menyscenene
            this.scene.launch('MenuScene');
        }


        
        if (this.AKey.isDown)
        {
            this.player.setVelocityX(this.player.body.velocity.x-30);
            this.player.anims.play('walk', true);
        }
        else if (this.DKey.isDown)
        {
            this.player.setVelocityX(this.player.body.velocity.x+30);
    
            this.player.anims.play('walk', true);
        }
        else
        {
            this.player.play('idle', true);
        }

        if(!(this.WKey.isDown || this.SpaceKey.isDown) && !this.player.body.onFloor() && !this.jumpIsUsed){
            this.jumpIsAllowed = true;
        }
    
        if ((this.WKey.isDown || this.SpaceKey.isDown) && !this.player.body.onFloor() && !this.jumpIsUsed && this.jumpIsAllowed){
            this.player.setVelocityY(-430);
            this.jumpIsUsed = true;
        }

        if(this.DashKey.isDown && this.foeAllowed){
            this.foe = this.foes.create(this.player.body.x, this.player.body.y, 'foe');
            this.foe.setData('health', 100);
            this.foe.setData('cooldown', Math.random() * 300);
            this.foeAllowed = false;
        }

        if(!this.DashKey.isDown){
            this.foeAllowed = true;
        }

        if(this.pointerIsDown && this.donutCooldown > 15){
            let v = Math.atan2((this.game.input.mousePointer.x - this.player.body.x - 32 + this.cameras.main.scrollX),(this.game.input.mousePointer.y - this.player.body.y - 32 + this.cameras.main.scrollY))

            this.donut = this.donuts.create(this.player.body.x + 16, this.player.body.y + 16, 'donut');
            this.donut.setScale(0.125);
            this.donut.body.allowGravity = false;
            this.donut.setVelocityY(Math.cos(v+Math.PI)*(-800) + this.player.body.velocity.y)
            this.donut.setVelocityX(Math.sin(v+Math.PI)*(-800) + this.player.body.velocity.x)
            this.donut.setData('time', 40)
            this.donutCooldown = 0;
        }
        this.donutCooldown++;
        
        if (this.donuts.countActive(true) != 0) {
            this.donuts.children.iterate(function (child) {
                if (child != null) {
                    child.setVelocityY(child.body.velocity.y * 0.96);
                    child.setVelocityX(child.body.velocity.x * 0.96);
                    if (child.getData('time') == 0) {
                        child.destroy();
                    } else {
                        child.setData('time', child.getData('time') - 1);
                    }
                }
            })
        }

        if (this.foes.countActive(true) != 0) {
            let bullet;
            let bullets = this.bullets;
            let player = this.player;
            let platforms = this.platforms;
            this.foes.children.iterate(function (child) {
                if (child != null) {
                    child.setData('cooldown', child.getData('cooldown') - 1)
                    let line = new Phaser.Geom.Line(player.body.x + 12, player.body.y + 12, child.body.x + 12, child.body.y + 12);
                    let line2 = new Phaser.Geom.Line(player.body.x + 12, player.body.y + 35, child.body.x + 12, child.body.y + 35);
                    let line3 = new Phaser.Geom.Line(player.body.x + 35, player.body.y + 12, child.body.x + 35, child.body.y + 12);
                    let line4 = new Phaser.Geom.Line(player.body.x + 35, player.body.y + 35, child.body.x + 35, child.body.y + 35);

                    if(child.getData('cooldown') <= 0){
                    child.setData('cooldown', Math.random() * 50 + 120);
                        if(platforms.getTilesWithinShape(line, { isColliding: true }).length == 0 && platforms.getTilesWithinShape(line2, { isColliding: true }).length == 0 && platforms.getTilesWithinShape(line3, { isColliding: true }).length == 0 && platforms.getTilesWithinShape(line4, { isColliding: true }).length == 0){
                            let v = Math.atan2((player.body.x - child.body.x),(player.body.y - child.body.y))

                            bullet = bullets.create(child.body.x + 32, child.body.y + 16, 'bullet');
                            //bullet.setScale(0.5);
                            bullet.rotation = -v - Math.PI/2;
                            if(player.body.x >= child.body.x){
                                bullet.flipY = true;
                            }
                            bullet.body.allowGravity = false;
                            bullet.setData('time', 1000)
                            bullet.setVelocityY(Math.cos(v+Math.PI)*(-200))
                            bullet.setVelocityX(Math.sin(v+Math.PI)*(-200))
                        }
                    }                    
                }
            })
        }

        if (this.bullets.countActive(true) != 0) {
            this.bullets.children.iterate(function (child) {
                if (child != null) {
                    if (child.getData('time') == 0) {
                        child.destroy();
                    } else {
                        child.setData('time', child.getData('time') - 1);
                    }
                }
            })
        }
     
        if (this.player.body.velocity.x > 0) {
            this.player.setFlipX(false);
        } else if (this.player.body.velocity.x < 0) {
            // otherwise, make them face the other side
            this.player.setFlipX(true);
        }
        if(this.player.body.velocity.x > 480)
        this.player.setVelocityX(480)
        if(this.player.body.velocity.x < -480)
        this.player.setVelocityX(-480)

        this.player.setVelocityX(this.player.body.velocity.x * 0.93)
    }

    // metoden updateText för att uppdatera overlaytexten i spelet
    updateText() {
        this.text.setText(`Arrow keys to move. Space to jump. P to pause.`);
    }

    // när spelaren landar på en spik, då körs följande metod
    playerHit(player, spike) {
        this.spiked++;
        player.setVelocity(0, 0);
        player.setX(50);
        player.setY(300);
        player.play('idle', true);
        let tw = this.tweens.add({
            targets: player,
            alpha: { start: 0, to: 1 },
            tint: { start: 0xff0000, to: 0xffffff },
            duration: 100,
            ease: 'Linear',
            repeat: 5
        });
        this.updateText();
    }

    jump (player, platform){
        if(player.body.onFloor())
        {
            this.jumpIsUsed = false;
            this.jumpIsAllowed = false;
            
            if ((this.WKey.isDown || this.SpaceKey.isDown || this.cursors.up.isDown) && this.player.getData('health') >= 1){
                this.player.setVelocityY(-430);
                this.player.play('jump', true);
            }

        }
    }

    destroyDonut (donut, platform){
        donut.destroy();
    }

    destroyDonutAndFoe (foe, donut){
        donut.destroy();
        foe.setData('health', foe.getData('health') - 40)
        if(foe.getData('health') <= 0){
            foe.destroy();
        }
    }

    damagePlayer (player, bullet){
        bullet.destroy();
        player.setData('health', player.getData('health')-1);
    }

    destroyBullet (bullet, platform){
        bullet.destroy();
    }

    // när vi skapar scenen så körs initAnims för att ladda spelarens animationer
    initAnims() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('player', {
                prefix: 'jefrens_',
                start: 1,
                end: 4
            }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: [{ key: 'player', frame: 'jefrens_2' }],
            frameRate: 10
        });


        this.anims.create({
            key: 'jump',
            frames: [{ key: 'player', frame: 'jefrens_5' }],
            frameRate: 10
        });

        this.anims.create({
            key: 'foe_walk',
            frames: this.anims.generateFrameNames('foe', {
                prefix: 'foe_',
                start: 1,
                end: 4
            }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'foe_idle',
            frames: [{ key: 'foe', frame: 'foe_2' }],
            frameRate: 10
        });
    }
}

export default PlayScene;
