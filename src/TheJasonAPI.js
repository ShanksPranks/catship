<script>

var text = '{ "players" : [{ "catshipID":"nada" , "name":"nada" , "highScore":0 , "level":0, "gamesPlayed":0, "lastPlayedDate":0 },{ "catshipID":"othernada" , "name":"othernada" , "highScore":0  , "level":0, "gamesPlayed":0, "lastPlayedDate":0  }]}';
var jsonObject = JSON.parse(text);

                $.ajax({
                    type: 'POST',
                    url: 'json/PutTheJson.php',
                    data: { jsonObject: JSON.stringify(myJson) },
                    success: function (data) {
                        //console.log('successfull post:' + data);
                    },
                    error: function (xhr, status, error) {
                        //console.log('xhr thingy: ' + xhr + ', status: ' + status + ', error : ' + error);
                    },
                    dataType: 'text'
                });

            }

        }
        else {
            this.game.state.start("TheGame");
        }
    }
