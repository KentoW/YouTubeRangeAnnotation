const INTERVAL = 1000;

var db = new Dexie("yta_database");
db.version(1).stores({annotation: 'id, title, data', label_setting: "id, num_labels, labels", on_off: "id, status"});
db.open();
db.label_setting.where('id').equals(1).first().then((r) => {
    draw_popup();
});

/* draw label fields */
function draw_popup() {
    db.label_setting.where('id').equals(1).first().then((r) => {
        let num = r.num_labels;
        let labels = r.labels;
        $("#num_label_k").text("# of label:" + String(num));
        $("#num_label_v").val(num);
        $("#num_label_name").empty();
        for (let i=0; i<num; i++) {
            let $item = $("<div/>").addClass("num_label_item");
            let label_name = labels[i];
            $("<div/>").addClass("num_label_item_k").text("Label " + String(i+1)).appendTo($item);
            $("<input/>").addClass("num_label_item_v").attr("label_id", i).attr("type", "text").attr("placeholder", "Type label name").val(label_name).appendTo($item);
            $item.appendTo("#num_label_name");
        }
    });
}

/* show info */
$(document).on("click", "#info", function(){
    $("#important").css("display", "block");
});
$(document).on("click", "#close_imp", function(){
    $("#important").css("display", "none");
});

/* count press button */
var reset_timeout_id = 0;
var delete_timeout_id = 0;
var num_reset = 0;
var num_delete = 0;
$(document).on("click", "#reset_setting", function(e){
    if (num_reset < 20) {
        if (reset_timeout_id != 0) {
            clearTimeout(reset_timeout_id);
        }
        num_reset = num_reset + 1;
        $("#num_press").text(num_reset);
        if (num_reset == 20) {
            reset_setting();
        }
        reset_timeout_id = setTimeout(function (){
            num_reset = 0;
            $("#num_press").text(num_reset);
        }, INTERVAL);
    }
});

$(document).on("click", "#delete_db", function(e){
    if (num_delete < 20) {
        if (delete_timeout_id != 0) {
            clearTimeout(delete_timeout_id);
        }
        num_delete = num_delete + 1;
        $("#num_press").text(num_delete);
        if (num_delete == 20) {
            delete_db();
        }
        delete_timeout_id = setTimeout(function (){
            num_delete = 0;
            $("#num_press").text(num_delete);
        }, INTERVAL);
    }
});


/* reset setting */
function reset_setting() {
    $("#status").css("display", "none");
    $("#success_reset").css("display", "block");
    db.label_setting.put({
        id: 1, 
        num_labels: 4, 
        labels: ["Label 1", "Label 2", "Label 3", "Label 4", "Label 5", "Label 6", "Label 7", "Label 8", "Label 9", "Label 10"]
    })
    db.on_off.put({
        id: 1, 
        status: "on"
    })
    setTimeout(function (){
        $("#status").css("display", "block");
        $("#success_reset").css("display", "none");
    }, 7000);
}

/* delete db */
function delete_db() {
    $("#status").css("display", "none");
    $("#success_delete").css("display", "block");
    db.annotation.clear();
    setTimeout(function (){
        $("#status").css("display", "block");
        $("#success_delete").css("display", "none");
    }, 7000);
}



/* download data */
$(document).on("click", "#download", function(){
    write_file();
});

function write_file() {
    db.label_setting.where('id').equals(1).first().then((r) => {
        /* download label data */
        let labels = r.labels;
        let num = r.num_labels;
        let labelJson = JSON.stringify(labels.slice(0, num));
        let downLoadLink = document.createElement("a");
        downLoadLink.download = "YTRA_label.jsonl";
        downLoadLink.href = URL.createObjectURL(new Blob([labelJson], {type: "text.plain"}));
        downLoadLink.dataset.downloadurl = ["text/plain", downLoadLink.download, downLoadLink.href].join(":");
        downLoadLink.click();
        /* download annotation data */
        db.annotation.toArray().then(function(annotations){
            let output = [];
            for (let d in annotations) {
                output.push(JSON.stringify(annotations[d]));
            }
            let resultJson = output.join("\n");
            let downLoadLink = document.createElement("a");
            downLoadLink.download = "YTRA_data.jsonl";
            downLoadLink.href = URL.createObjectURL(new Blob([resultJson], {type: "text.plain"}));
            downLoadLink.dataset.downloadurl = ["text/plain", downLoadLink.download, downLoadLink.href].join(":");
            downLoadLink.click();
        })
    });
}

/* change num of label */
$(document).on("change", "#num_label_v", function(){
    var num = $(this).val();
    db.label_setting.where('id').equals(1).first().then((r) => {
        db.label_setting.put({
            id: 1, 
            num_labels: num, 
            labels: r.labels
        })
        draw_popup();
    });
});

/* change label names */
$(document).on("change", ".num_label_item_v", function(){
    db.label_setting.where('id').equals(1).first().then((r) => {
        let labels = r.labels;
        var label_id = parseInt($(this).attr("label_id"));
        labels[label_id] = $(this).val();
        db.label_setting.put({
            id: 1, 
            num_labels: r.num_labels, 
            labels: labels
        })
    });
});

/* toggle ON-OFF */
$(document).on("click", "#on_off", function(){
    chrome.runtime.sendMessage({
        from:    'popup', 
        subject: 'switch_on_off' 
    });
}); 
