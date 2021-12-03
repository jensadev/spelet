class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
    }
    create() {
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

        // skapa en fysik-grupp
        this.spikes = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        // från platforms som skapats från tilemappen
        // kan vi ladda in andra lager
        // i tilemappen finns det ett lager Spikes
        // som innehåller spikarnas position
        console.log(this.platforms);
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
        this.physics.add.collider(
            this.player,
            this.spikes,
            this.playerHit,
            null,
            this
        );

        this.physics.add.collider(this.player, this.platforms, this.jump, null, this);

        // krocka med platforms lagret
        this.physics.add.collider(this.player, this.platforms);

        // skapa text på spelet, texten är tom
        // textens innehåll sätts med updateText() metoden
        this.text = this.add.text(16, 16, '', {
            fontSize: '20px',
            fill: '#ffffff'
        });
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
        this.events.on('pause', function () {
            console.log('Play scene paused');
        });
        this.events.on('resume', function () {
            console.log('Play scene resumed');
        });

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setLerp(0.1, 0.1);
        this.cameras.main.setDeadzone(0, 0);
        this.cameras.main.setViewport(0, 0, 896, 448);
        this.cameras.main.zoom = 1.6
        this.cameras.main.setBounds(0, 0, 896, 448);

        this.foes = this.physics.add.group({   
        });
        this.physics.add.collider(this.foes, this.platforms);
    }

    // play scenens update metod
    update() {
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
        if(this.DashKey.isDown){
            this.foe = this.foes.create(this.player.body.x, this.player.body.y, 'foe');
        }


        // följande kod är från det tutorial ni gjort tidigare
        // Control the player with left or right keys

        // Player can jump while walking any direction by pressing the space bar
        // or the 'UP' arrow
        if (
            (this.cursors.space.isDown || this.cursors.up.isDown) &&
            this.player.body.onFloor()
        ) {
            this.player.setVelocityY(-350);
            this.player.play('jump', true);
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
    }

    // metoden updateText för att uppdatera overlaytexten i spelet
    updateText() {
        this.text.setText(
            `Arrow keys to move. Space to jump. P to pause. Spiked: ${this.spiked}`
        );
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
        if(player.body.touching.down)
        {
        jumpIsUsed = false;
        jumpIsAllowed = false;
        dashIsUsed = false;
        }
        if ((this.WKey.isDown || this.SpaceKey.isDown) && this.player.body.onFloor())
        {
            player.setVelocityY(-530);
            this.player.play('jump', true);
        }
        this.player.setVelocityX(this.player.body.velocity.x * 0.93)
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
