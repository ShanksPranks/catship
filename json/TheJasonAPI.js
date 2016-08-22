        <script src="../src/jquery-1.11.1.min.js"></script>    
    <script>
console.log('loading');
var text = '{ "players" : [{ "catshipID":"ntadaaaada" , "name":"nada" , "highScore":0 , "level":0, "gamesPlayed":0, "lastPlayedDate":0 },{ "catshipID":"othernada" , "name":"othernada" , "highScore":0  , "level":0, "gamesPlayed":0, "lastPlayedDate":0  }]}';
var jsonObject = JSON.parse(text);

                $.ajax({
                    type: 'POST',
                    url: 'PutTheJson.php',
                    data: { jsonObject: JSON.stringify(jsonObject) },
                    success: function (data) {
                        //console.log('successfull post:' + data);
                    },
                    error: function (xhr, status, error) {
                        //console.log('xhr thingy: ' + xhr + ', status: ' + status + ', error : ' + error);
                    },
                    dataType: 'text'
                });


</script>

