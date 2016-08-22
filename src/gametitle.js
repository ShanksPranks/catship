var gameTitle = function(game){}

gameTitle.prototype = {
    create: function () {

        //        music = this.game.add.audio('track1');
        //        music.play();

        //play_song('nsf/catship2.nsf'); 
        if (level == 0) {
            scoreString = 'Score : ';
            scoreText = this.game.add.text(16, 16, scoreString + score, { font: '12px Arial', fill: '#fff' });
            logo = this.game.add.sprite(0, 0, 'splash');
            stateText = this.game.add.text(this.game.world.centerX, this.game.world.height - 110, ' ', { font: '20px Arial', fill: '#fff' });
            stateText.anchor.setTo(0.5, 0.5);
            stateText.visible = false;
        }
        else if (level == 2) {
            logo = this.game.add.sprite(161, 0, 'cs5');
            storyboard += 1;
        }
            this.game.input.onDown.add(this.removeLogo, this);
    },

    removeLogo: function () {

        logo.kill();
        if (storyboard == 0) {
            bg = this.game.add.sprite(0, 0, 'bg');
            logo = this.game.add.sprite(161, 0, 'cs1');
            storyboard += 1;
        }
        else if (storyboard == 1) {
            logo = this.game.add.sprite(161, 0, 'cs2');
            storyboard += 1;
        }
        else if (storyboard == 2) {
            logo = this.game.add.sprite(161, 0, 'cs3');
            storyboard += 1;
        }
        else if (storyboard == 3) {
            logo = this.game.add.sprite(161, 0, 'cs4');
            storyboard += 1;
        }
        else if (storyboard == 4) {
            logo.kill();
            bg.kill();
            stagespeed = 1;
            storyboard += 1;
            this.game.state.start("TheGame");
        }
            // storyboard 5 = game over

        else if (storyboard == 7) {
            logo = this.game.add.sprite(161, 0, 'cs6');
            storyboard += 1;
        }
        else if (storyboard == 8) {
            logo.kill();
            bg.kill();
            stagespeed = 1;
            storyboard += 1;
            this.game.state.start("Level2");
        }

    }

}