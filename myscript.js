// YouTube page
var first_load_f = true;
var old_url;
var N_TL = 4;
var labels = ["Label 1", "Label 2", "Label 3", "Label 4", "Label 5", "Label 6", "Label 7", "Label 8", "Label 9", "Label 10"];
var z_index = 10;
var PREVIEW_INTERVAL = 700;
let anno = {};


// misc
function msToTime(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    var milliseconds = parseInt((millis % 1000) / 100);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds + "." + milliseconds;
}

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;
    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

var queryStringMap = function(data) {
    var result = {};
    data.split('&').forEach(function(entry) {
        result[
            decodeURIComponent(entry.substring(0, entry.indexOf('=')))] =
            decodeURIComponent(entry.substring(entry.indexOf('=') + 1));
    });
    return result;
};



// Waveform
var xhr;
var audioContext = new AudioContext();
var canvas;
function get_stream() {
    var youtubeId = getUrlParameter("v");
    $.ajax({
        type: "GET", 
        url: "https://www.youtube.com/get_video_info",
        dataType:'text',
        data: {video_id: youtubeId}, 
        success: function(response) {
            let get_video_info = queryStringMap(response);
            let pl_res = JSON.parse(get_video_info["player_response"]);
            let strms = pl_res["streamingData"]["adaptiveFormats"];
            let audio_url = strms[strms.length-1]['url'];
            //console.log(audio_url);
            if (audio_url != undefined) {
                xhr = new XMLHttpRequest();
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        audioContext.decodeAudioData(xhr.response, function(buffer) { 
                            canvas = document.getElementById("yta_waveform");
                            canvas.height = $("#yta_waveform").height();
                            canvas.width = $("#yta_waveform").width();
                            drawBuffer(canvas.width, canvas.height, canvas, buffer); 
                        });
                    }
                };
                xhr.open('GET', audio_url, true);
                xhr.send(null);
            }
        }, 
        error:function() {
        }
    });
}


// draw waveform
var context;
function drawBuffer(width, height, canvas, buffer) {
    context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    var data = buffer.getChannelData(0);
    var step = Math.ceil(data.length / width);
    var amp = height/2;
    for(var i=0; i < width; i++){
        var min = 1.0;
        var max = -1.0;
        for (var j=0; j<step; j++) {
            var datum = data[(i*step)+j]; 
            if (datum < min)
                min = datum;
            if (datum > max)
                max = datum;
        }
        context.fillStyle = "rgb(200, 200, 200)";
        context.fillRect(i, (1+min)*amp, 1, Math.max(1,(max-min)*amp));
    }
}

// change plau position
$(document).on("click", "#yta_waveform", function(e){
    var parentOffset = $(this).offset(); 
    var relX = e.pageX - parentOffset.left;
    var position = relX / $(this).width();
    var duration = videoEl.duration;
    videoEl.currentTime = duration*position;
});

// Audio processing
var videoEl;
function load_audio() {
    videoEl = document.querySelector('video');

    // Video Event
    videoEl.onloadstart = function() {
        //console.log("LOAD START");
        draw_note();
    };
    videoEl.onloadeddata = function() {
        //console.log("LOADED");
    };
    videoEl.onprogress = function() {
        //console.log("DOWNLOADING VIDEO");
    };
    videoEl.onended = function() {
        //console.log("END");
    };
    videoEl.onplay = function() {
        //console.log("PLAY");
        check_ad();
    };
    videoEl.onpause = function() {
        //console.log("PAUSE");
    };
    videoEl.onseeked = function() {
        //console.log("SEEKED");
    };
    videoEl.onplaying = function() {
        //console.log("PLAYING");
    };
    videoEl.onwaiting = function() {
        //console.log("WAITING");
    };
    videoEl.ontimeupdate = function(){
        var cTime_ratio = videoEl.currentTime/videoEl.duration
        $("#yta_play_position").css("left", String(cTime_ratio*100)+"%");
    };
}

/* annotation tool */
function draw_tool() {
    /* videos */
    var $videos = $("<div/>").attr("id", "yta_videos");
    var $v_list = $("<div/>").attr("id", "yta_video_list");
    $("<div/>").attr("id", "yta_video_head").text("Annotated videos").appendTo($v_list);
    $("<div/>").attr("id", "yta_video_content").appendTo($v_list);
    $("<div/>").attr("id", "yta_video_close").text("close").appendTo($v_list);
    $v_list.appendTo($videos);
    $videos.appendTo($("#content"));
    var $panel = $("<div/>").attr("id", "yta_tool");
    /* waveform */
    $("<canvas/>").attr("id", "yta_waveform").appendTo($panel);
    /* play bar */
    $("<div/>").attr("id", "yta_play_position").appendTo($panel);
    /* time line */
    var $work = $("<div/>").attr("id", "yta_work_space");
    for (let i=0; i<N_TL; i++) {
        var $tl = $("<div/>").attr("id", "yta_tl_"+i).addClass("yta_tl");
        $("<div/>").attr("id", "yta_tl_label_"+i).addClass("yta_tl_label").text(labels[i]).appendTo($tl);
        $("<div/>").attr("id", "yta_tl_line_"+i).addClass("yta_tl_line").appendTo($tl);
        $("<div/>").attr("id", "yta_tl_prev_"+i).addClass("yta_tl_prev").text("■◀◀").appendTo($tl);
        $("<div/>").attr("id", "yta_tl_next_"+i).addClass("yta_tl_next").text("▶▶■").appendTo($tl);
        $tl.appendTo($work);
    }
    $work.appendTo($panel);
    /* bottom bar */
    var $bottom = $("<div/>").attr("id", "yta_bottom");
    $("<div/>").attr("id", "yta_show").text("Show annotated videos").appendTo($bottom);
    $("<div/>").attr("id", "yta_cr").text("YouTube Range Annotation.").appendTo($bottom)
    $bottom.appendTo($panel);

    /* hidden tool */
    var $hidden = $("<div/>").attr("id", "yta_tool_hidden");
    $("<div/>").text('YouTube Range Annotation').appendTo($hidden);
    $hidden.appendTo($panel);

    $("#info-contents").before($panel);
    draw_note();
}


/* draw annotated data */
var wf_timeoutID = 0;
function draw_note() {
    if (context != undefined) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
    $(".yta_note").remove();
    $select_obj = "";
    mode = "none";
    anno = {}
    let youtubeId = getUrlParameter("v");
    anno["youtube_id"] = youtubeId;
    let title = document.title.slice(0, -10);
    anno["title"] = title;
    anno["data"] = {};
    chrome.runtime.sendMessage({from: "content", subject: "loadData", youtube_id: youtubeId},  function(response) {
        for (let i=0; i<N_TL; i++) {
            let line = response.data[i];
            if (line == undefined) {
                break;
            }
            if (line.length > 0) {
                anno["data"][i] = line;
                for (let j in line) {
                    startRatio = line[j]["st"] / videoEl.duration;
                    endRatio = line[j]["et"] / videoEl.duration;
                    let widthRatio = (line[j]["et"] - line[j]["st"]) / videoEl.duration;
                    let note_left = 100 * startRatio;
                    let note_width = 100 * widthRatio;
                    let $note = $("<div/>").addClass("yta_note")
                        .css({"left": String(note_left) + "%", "width": String(note_width) + "%"})
                        .attr("starttime", line[j]["st"])
                        .attr("endtime", line[j]["et"])
                    $("<div/>").text(msToTime(line[j]["st"]*1000) + " - " + msToTime(line[j]["et"]*1000)).addClass("yta_note_text").appendTo($note);
                    $("<div/>").addClass("yta_remove_note").text("×").appendTo($note);
                    $("<div/>").addClass("yta_note_nob").appendTo($note);
                    $note.appendTo("#yta_tl_line_" + String(i));
                }
            }
        }
        check_ad();
    });
    if (ad_status == false) {
        if (wf_timeoutID != 0) {
            clearTimeout(wf_timeoutID);
        }
        wf_timeoutID = setTimeout(function (){
            //console.log("draw waveform");
            get_stream();
        }, 2000);
    }
}

/* check Ad video */
var ad_status = false;
function check_ad() {
    if ($(".ytp-play-progress").css("background-color") == "rgb(255, 0, 0)") {
        $("#yta_tool_hidden").css("display", "none");
        ad_status = false;
    } else {
        $("#yta_tool_hidden").css("display", "block");
        ad_status = true;
    }
}

/* save annotation */
function save_data() {
    anno = {}
    let youtubeId = getUrlParameter("v");
    anno["youtube_id"] = youtubeId;
    let title = document.title.slice(0, -9);
    anno["title"] = title;
    anno["data"] = {};
    for (let i=0; i<N_TL; i++) {
        /* sort by start time */
        $("#yta_tl_line_"+i).each(function () {
            $(this).html(
                $(this).children(".yta_note").sort(function(a, b){
                    var x = Number($(a).attr("starttime"));
                    var y = Number($(b).attr("starttime"));
                    return x - y;
                })
            )
        });
        /* make data */
        $("#yta_tl_line_"+i).each(function () {
            let line = [];
            $(this).children(".yta_note").each(function () {
                let stime = $(this).attr("starttime");
                let etime = $(this).attr("endtime");
                line.push({"st":stime, "et":etime});
            });
            anno["data"][i] = line;
        });
    }
    chrome.runtime.sendMessage({
        from:    'content', 
        subject: 'saveData', 
        data: anno
    });
}

/* show song list */
$(document).on("click", "#yta_show", function(e){
    $("#yta_video_content").empty();
    chrome.runtime.sendMessage({from: "content", subject: "showVideos"},  function(response) {
        for (let i in response["data"]) {
            let youtube_id = response["data"][i]["id"];
            let title = response["data"][i]["title"]
            $("<a/>").attr("href", "/watch?v="+youtube_id)
                .text(title)
                .appendTo("#yta_video_content");
        }
    });
    $("#yta_videos").fadeIn("fast");
});

$(document).on("click", "#yta_video_close", function(e){
    $("#yta_videos").css("display", "none");
});


/* change play position */
function move_audio(tempX) {
    var parentOffset = $(".yta_tl_line").offset(); 
    var position = tempX / $(".yta_tl_line").width();
    if (position < 0.99) {
        var duration = videoEl.duration;
        videoEl.currentTime = duration*position;
    }
}

$(document).on("click", ".yta_tl_prev", function(e){
    var label_num = parseInt($(this).attr("id").split("_")[3]);
    var currentTime = videoEl.currentTime-1;      // stupid
    let old_t = 0;
    for (let i in anno["data"][label_num]) {
        let st = Number(anno["data"][label_num][i]["st"]);
        if (old_t < currentTime && currentTime < st){
            videoEl.currentTime = old_t;
        } else if (st < currentTime) {
            videoEl.currentTime = st;
        }
        old_t = st;
    }
});


$(document).on("click", ".yta_tl_next", function(e){
    var label_num = parseInt($(this).attr("id").split("_")[3]);
    var currentTime = videoEl.currentTime;
    let old_t = 0;
    for (let i in anno["data"][label_num]) {
        let st = Number(anno["data"][label_num][i]["st"]);
        if (old_t < currentTime && currentTime < st){
            videoEl.currentTime = st;
        } 
        old_t = st;
    }
});


/* add note */
var mode = "none";
var $select_obj = "";
var offset_left = 0;
var offset_wifth = 0;
var mouseX;
var startRatio = 0.0;
var endRatio = 1.0;
var timeoutID = 0;
$(document).on("mousemove", ".yta_tl_line", function(e){
    var areaOffset = $(this).offset();
    mouseX = ((e.pageX)-(areaOffset.left));
    if (mode == "create") {
        $("#yta_note_unclear").css("width", String(mouseX - offset_left) + "px");
        if (timeoutID != 0) {
            clearTimeout(timeoutID);
        }
        timeoutID = setTimeout(function (){
            move_audio(mouseX);
        }, PREVIEW_INTERVAL);
    } else if (mode == "select") {
        $($select_obj).css({"left": String(mouseX - offset_left) + "px"});
        if (timeoutID != 0) {
            clearTimeout(timeoutID);
        }
        timeoutID = setTimeout(function (){
            move_audio(mouseX - offset_left);
        }, PREVIEW_INTERVAL);
    } else if (mode == "extend") {
        $($select_obj).css({"width": String(mouseX - offset_left) + "px"});
        if (timeoutID != 0) {
            clearTimeout(timeoutID);
        }
        timeoutID = setTimeout(function (){
            move_audio(mouseX + 4);         // NOTE add width of nob (4px) 
        }, PREVIEW_INTERVAL);
    }
});

$(document).on("click", ".yta_tl_line", function(e){
    if (mode == "none") {
        if (!$(e.target).hasClass("yta_note") && !$(e.target).hasClass("yta_note_nob") && !$(e.target).hasClass("yta_remove_note") && !$(e.target).hasClass("yta_note_text")) {
            $("<div/>").attr("id", "yta_note_unclear")
                .css({"left": String(mouseX)+"px"})
                .appendTo(this);

            var parentOffset = $(this).offset(); 
            var relX = e.pageX - parentOffset.left;
            var position = relX / $(this).width();
            var duration = videoEl.duration;
            videoEl.currentTime = duration*position;
            startRatio = position;
            offset_left = mouseX;
            $select_obj = this;
            mode = "create";
        }
    } else if (mode == "create") {
        var note_left = 100 * $("#yta_note_unclear").position().left / $($select_obj).width();
        var note_width = 100 * $("#yta_note_unclear").width() / $($select_obj).width();
        if (note_width < 1) {
            note_width = 1;
        }
        $("#yta_note_unclear").remove();
        var $note = $("<div/>").addClass("yta_note").css({"left": String(note_left) + "%", "width": String(note_width) + "%", "z-index":z_index});
        z_index++;
        var startTime = videoEl.duration*startRatio;
        $note.attr("starttime", startTime);
        var parentOffset = $(this).offset(); 
        var relX = e.pageX - parentOffset.left;
        var position = relX / $(this).width();
        endRatio = position;
        var endTime = videoEl.duration*endRatio;
        $note.attr("endtime", endTime);
        $("<div/>").text(msToTime(startTime*1000) + " - " + msToTime(endTime*1000)).addClass("yta_note_text").appendTo($note);
        $("<div/>").addClass("yta_remove_note").text("×").appendTo($note);
        $("<div/>").addClass("yta_note_nob").appendTo($note);
        $note.appendTo($select_obj);
        $select_obj = "";
        mode = "none";
        save_data();
    }
});

$(document).on("click", ".yta_note", function(e){
    if (mode == "none") {
        if (!$(e.target).hasClass("yta_note_nob") && !$(e.target).hasClass("yta_remove_note")) {
            $(this).children(".yta_note_text").text("");
            z_index++;
            $(this).addClass("select").css("z-index", z_index);
            $select_obj = this;
            offset_left = (e.pageX)-$(this).offset().left;
            mode = "select";
        }
    } else if (mode == "select") {
        $($select_obj).removeClass("select");
        startRatio = $($select_obj).position().left / $(".yta_tl_line").width();
        endRatio = ($($select_obj).position().left + $($select_obj).width()) / $(".yta_tl_line").width();

        if (startRatio < 0.0) {
            startRatio = 0.0;
        }
        if (endRatio > 1){
            endRatio = 1.0
        }
        var startTime = videoEl.duration*startRatio;
        $(this).attr("starttime", startTime);
        var endTime = videoEl.duration*endRatio;
        $(this).attr("endtime", endTime);
        $(this).children(".yta_note_text").text(msToTime(startTime*1000) + " - " + msToTime(endTime*1000));
        var note_left = 100 * startRatio;
        var note_width = 100 * (endRatio - startRatio);
        if (note_width < 2) {
            note_width = 2;
        }
        $($select_obj).css({"left": String(note_left) + "%", "width": String(note_width) + "%"});
        if (timeoutID != 0) {
            clearTimeout(timeoutID);
        }
        move_audio($($select_obj).position().left);
        $select_obj = "";
        mode = "none";
        save_data();
    }
});

$(document).on("click", ".yta_note_nob", function(e){
    if (mode == "none") {
        if ($(e.target).hasClass("yta_note_nob")) {
            $(this).parent().children(".yta_note_text").text("");
            offset_left = mouseX - $(this).position().left - $(this).width(); 
            $select_obj = $(this).parent();
            z_index++;
            $(this).parent().css("z-index", z_index).addClass("select");
            mode = "extend";
        }
    } else if (mode == "extend") {
        $($select_obj).removeClass("select");
        startRatio = $($select_obj).position().left / $(".yta_tl_line").width();
        endRatio = ($($select_obj).position().left + $($select_obj).width()) / $(".yta_tl_line").width();

        var startTime = videoEl.duration*startRatio;
        $(this).parent().attr("starttime", startTime);
        var endTime = videoEl.duration*endRatio;
        $(this).parent().attr("endtime", endTime);
        $(this).parent().children(".yta_note_text").text(msToTime(startTime*1000) + " - " + msToTime(endTime*1000));
        var note_left = 100 * startRatio;
        var note_width = 100 * $($select_obj).width() / $(".yta_tl_line").width();
        if (note_width < 1) {
            note_width = 1;
        }
        if (timeoutID != 0) {
            clearTimeout(timeoutID);
        }
        move_audio($($select_obj).position().left + $($select_obj).width() + 4);    // NOTE add width of nob (4px) 
        $($select_obj).css({"left": String(note_left) + "%", "width": String(note_width) + "%"});
        $select_obj = "";
        mode = "none";
        save_data();
    }
});

$(document).on("click", ".yta_remove_note", function(e){
    if (mode == "none") {
        if ($(e.target).hasClass("yta_remove_note")) {
            $(this).parent().remove();
            save_data();
        }
    }
});


// message communication
chrome.extension.onMessage.addListener(function(request, sender, response) {
    // Reload Event
    if (request.type === 'getDoc') {
        //console.log("Reload Page");
        check_ad();
        // draw tool (only first time)
        z_index = 0;
        chrome.runtime.sendMessage({from: "content", subject: "check_extension"},  function(response) {
            var on_off = response.res;
            if (first_load_f == true && window.location.href.startsWith('https://www.youtube.com/watch') && on_off == "true"){
                labels = response.labels;
                N_TL = response.num_labels;
                load_audio();
                setTimeout("draw_tool()", 2000);       // stupid
                first_load_f = false;
            }
            old_url = window.location.href;
        });
        if (first_load_f == false) {
            $(".yta_note").remove();
            setTimeout("draw_note()", 1000);       // stupid
        }
    }
    return true;
});



