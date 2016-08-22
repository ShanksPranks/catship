<html>
 <head>
  <title>PHP Test</title>
 </head>
 <body>
 <?php echo '<p>Hello World</p>'; 

 function debug_to_console( $data ) {

    if ( is_array( $data ) )
        $output = "<script>console.log( 'Debug Objects: " . implode( ',', $data) . "' );</script>";
    else
        $output = "<script>console.log( 'Debug Objects: " . $data . "' );</script>";

    echo $output;
}

$json = '{"a":1,"b":2,"c":3,"d":4,"e":5}';
$json = '{"a":1,"b":2,"c":3,"d":4,"e":5}';

var_dump(json_decode($json));
var_dump(json_decode($json, true));

//$response = http_get("http://www.rootsmoothie.squarespace.com/api/commerce/shopping-cart", array("timeout"=>1), $info);
//print_r($info);
echo '<p>print obj</p>';
$json = $_GET['http://www.rootsmoothie.squarespace.com/api/commerce/shopping-cart'];
echo $json->access_token;
echo '<p>changed</p>';
debug_to_console($json);
var_dump(json_decode($json));
//print_r($obj[0]->text);
//print_r($obj);
//alert($obj['3']);
echo '<p>console </p>';

//$json = file_get_contents('url_here');
//$obj = json_decode($json);
//echo $obj->access_token;

//debug_to_console( $obj->id );

 ?> 

 <script>
// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

// Helper method to parse the title tag from the response.
function getTitle(text) {
  return text.match('<title>(.*)?</title>')[1];
}

// Make the actual CORS request.
function makeCorsRequest() {
  // All HTML5 Rocks properties support CORS.
  var url = 'http://updates.html5rocks.com';

  var xhr = createCORSRequest('GET', url);
  if (!xhr) {
    alert('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    var text = xhr.responseText;
    var title = getTitle(text);
    alert('Response from CORS request to ' + url + ': ' + title);
  };

  xhr.onerror = function() {
    alert('Woops, there was an error making the request.');
  };

  xhr.send();
}

var url = 'http://www.rootsmoothie.squarespace.com/api/commerce/shopping-cart';
var xhr = createCORSRequest('GET', url);
xhr.send();

 </script>
 </body>
</html>