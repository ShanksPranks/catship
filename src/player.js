/* By Daniel Svensson, dsvensson@gmail.com, 2012 */

function parse_metadata(ref) {
	var offset = 0;

	var read_int32 = function() {
		var value = Module.getValue(ref + offset, "i32");
		offset += 4;
		return value;
	}

	var read_string = function() {
		var value = Module.Pointer_stringify(Module.getValue(ref + offset, "i8*"));
		offset += 4;
		return value;
	}

	var res = {};

	res.length = read_int32();
	res.intro_length = read_int32();
	res.loop_length = read_int32();
	res.play_length = read_int32();

	offset += 4*12; // skip unused bytes

	res.system = read_string();
	res.game = read_string();
	res.song = read_string();
	res.author = read_string();
	res.copyright = read_string();
	res.comment = read_string();

	return res;
}


function play_song(song, subtune) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", song, true);
	xhr.responseType = "arraybuffer";
	xhr.onload = function(e) {
		if (!window.AudioContext) {
			if (window.webkitAudioContext) {
				window.AudioContext = window.webkitAudioContext;
			} else if (window.mozAudioContext) {
				window.AudioContext = window.mozAudioContext;
			} else {
				alert("old browser is old, get a new one with web audio api support...");
			}
		}

		var ctx = new AudioContext();

		var payload = new Uint8Array(this.response);

		var ref = Module.allocate(1, "i32", Module.ALLOC_STACK);

		var samplerate = ctx.sampleRate;

		if (Module.ccall("gme_open_data", "number", ["array", "number", "number", "number"], [payload, payload.length, ref, samplerate]) != 0)
			console.error("could not load data", payload);

		var emu = Module.getValue(ref, "i32");

		var subtune_count = Module.ccall("gme_track_count", "number", ["number"], [emu]);

		console.log("Track count: ", subtune_count);

		if (Module.ccall("gme_track_info", "number", ["number", "number", "number"], [emu, ref, subtune]) != 0)
			console.error("could not load metadata");

		var metadata = parse_metadata(Module.getValue(ref, "*"));

		var element = document.getElementById("metadata");
		/*element.innerHTML = "Loaded: " + metadata.author + " - " + metadata.game + ", subtune " + subtune + " of " + subtune_count;

		if (subtune < subtune_count)
			element.innerHTML += " (<a href=\"?file=" + song + "&subtune=" + (subtune + 1) + "\">next</a>";
		else
			element.innerHTML += "(next"
		if (subtune > 0)
			element.innerHTML += " / <a href=\"?file=" + song + "&subtune=" + (subtune - 1) + "\">prev</a>)";
		else
			element.innerHTML += " / prev)"
            */
		if (Module.ccall("gme_start_track", "number", ["number", "number"], [emu, subtune]) != 0)
			console.log("could not load track");


		Module.ccall("gme_enable_accuracy", "number", ["number", "number"], [emu, 1]);

		var bufferSize = 1024 * 32;
		var inputs = 2;
		var outputs = 2;

		var node = ctx.createScriptProcessor(bufferSize / outputs, inputs, outputs);

		var buffer = Module.allocate(bufferSize * 2, "i8", Module.ALLOC_STACK);

		var INT16_MAX = 0x7fff;
	
		node.onaudioprocess = function(e) {
			if (Module.ccall("gme_track_ended", "number", ["number"], [emu]) == 1) {
				node.disconnect();
				console.log("end of stream");
				return;
			}

			var channels = [e.outputBuffer.getChannelData(0), e.outputBuffer.getChannelData(1)];

		    var err = Module.ccall("gme_play", "number", ["number", "number", "number"], [emu, bufferSize, buffer]);
			for (var i = 0; i < bufferSize / e.outputBuffer.numberOfChannels - 1; i++) {
				for (var n = 0; n < e.outputBuffer.numberOfChannels; n++) {
					channels[n][i] = Module.getValue(buffer + (i + n) * 4, "i16") / INT16_MAX;
				}
			}
		}

		// since we're unbuffered (it seems?), lets wait a bit before starting playback
		var timer = setTimeout(function() {
		    node.connect(ctx.destination);
			clearInterval(timer);
		}, 250);

		window.savedReferences = [ctx, node];
	};
	xhr.send();
}

function parse_params() {
	result = { file: "nsf/catship1.nsf", subtune: "0"}
	var params = window.location.search.substring(1).split("&");
	for (var i = 0; i < params.length; i++) {
		var parts = params[i].split("=");
		result[parts[0]] = decodeURIComponent(parts[1]);
	}
	return result;
}

window.onload = function() {
//	var xhr = new XMLHttpRequest();
//	xhr.open("GET", "nsf/filelist.txt", true);
//	xhr.onload = function(e) {
//		var files = this.response.split("\n");
//		var element = document.getElementById("filelist");
//		for (var i = 0; i < files.length; i++) {
//			element.innerHTML += "<a href=\"?file=nsf/" + files[i] + "&subtune=0\">" + files[i] + "</a><br/>";
//		}
//	}
//	xhr.send();
//	console.log(parse_params());
//    var params = parse_params();
//	play_song(params.file, parseInt(params.subtune));
//	console.log(window.location.search);
}