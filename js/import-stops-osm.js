var ColumnsList = ["Columnstop_id","Columnstop_code","Columnstop_name","Columnstop_desc","Columnstop_lat","Columnstop_lon","Columnzone_id","Columnstop_url","Columnlocation_type","Columnparent_station","Columnstop_timezone","Columnwheelchair_boarding","Columnlevel_id","Columnplatform_code"];
var NewStops = [];

var trashIcon = function (cell, formatterParams, onRendered) { //plain text value
	return "<i class='fas fa-trash-alt'></i>";
};
// MAP Init
var LayerOSM = L.tileLayer.provider('OpenStreetMap.Mapnik');

const startLocation = [10.030259357021862, 76.31446838378908];

var map = new L.Map('map', {
	center: [0, 0],
	zoom: 2,
	layers: [LayerOSM],
	scrollWheelZoom: true
});

const fontAwesomeIcon = L.divIcon({
    html: '<i class="fas fa-bus"></i>',
    iconSize: [20, 20],
    className: 'myDivIcon'
});

var opl = new L.OverPassLayer({
	
    //options: {
        debug: true,
        minZoom: 13,
        endPoint: 'https://overpass-api.de/api/',
        query: '(node[public_transport=stop_position]({{bbox}}););out;',
        loadedBounds: [],
        markerIcon: fontAwesomeIcon,
        timeout: 30 * 1000, // Milliseconds
        retryOnTimeout: false,
        noInitialRequest: false,
        minZoomIndicatorEnabled: true,
        minZoomIndicatorOptions: {
          position: 'topright',
          minZoomMessageNoLayer: 'No layer assigned',
          minZoomMessage: 'Current zoom level: CURRENTZOOM - All data at level: MINZOOMLEVEL'
      },
        beforeRequest: function() {},
        afterRequest: function() {},
        onSuccess: function(data) {
            data.elements.forEach(function (node) {
                 // First check if the node exists in table
                var rows = StopsTable.searchRows("stop_id", "=", node.id);     
                if (rows.length == 0) {
                    if ($('#checkstop_code').checked) {
                        // Add all stops
                        var jsonData = {};
                        jsonData['stop_id'] = node.id;
                        jsonData['stop_name'] = node.tags.name;
                        jsonData['stop_lat'] = node.lat;
                        jsonData['stop_lon'] = node.lon;
                        StopsTable.addData(jsonData);
                        L.marker([node.lat, node.lon], {
                            icon: fontAwesomeIcon
                        }).addTo(map);
                    }
                    else {
                        if (node.tags.name) {
                            var jsonData = {};
                            jsonData['stop_id'] = node.id;
                            jsonData['stop_name'] = node.tags.name;
                            jsonData['stop_lat'] = node.lat;
                            jsonData['stop_lon'] = node.lon;
                            StopsTable.addData(jsonData);
                            L.marker([node.lat, node.lon], {
                                icon: fontAwesomeIcon
                            }).addTo(map);
                        }
                    }                    
                }               
            })
        },
        onError: function(xhr) {},
        onTimeout: function(xhr) {},
      //}
});
map.addLayer(opl);

// var TempTable = new Tabulator("#TempTable", {
//     selectable: 1, // make max 1 row click-select-able. http://tabulator.info/docs/3.4?#selectable
// 	movableRows: true, //enable user movable rows
//     layout:"fitColumns",
//     placeholder:"No Data Available",    
//     height:400 // Height is needed for virtual dom, without virtual dom performance is slowwwww
// });

var StopsTable = new Tabulator("#StopsTable", {
    selectable: 1, // make max 1 row click-select-able. http://tabulator.info/docs/3.4?#selectable
	movableRows: true, //enable user movable rows
    layout:"fitColumns",
    index:"stop_id",    
    placeholder:"No Data Available",
    height:400, // Height is needed for virtual dom, without virtual dom performance is slowwwww    
    columns: [ //Define Table Columns
		// stop_id,stop_name,stop_lat,stop_lon,zone_id,wheelchair_boarding
		{ rowHandle: true, formatter: "handle", headerSort: false, frozen: true, width: 30, minWidth: 30 },
        { title: "stop_id", field: "stop_id", frozen: true, headerFilter: "input", validator: ["string", 3] },
        { title: "stop_code", field: "stop_code", editor: "input"},
        { title: "stop_name", field: "stop_name", editor: "input", headerFilter: "input", validator: ["required", "string", 3] },
        { title: "stop_desc", field: "stop_desc", editor: "input"},
		{ title: "stop_lat", field: "stop_lat", headerSort: false, validator: "float" },
		{ title: "stop_lon", field: "stop_lon", headerSort: false, validator: "float" },
        { title: "zone_id", field: "zone_id", editor: "input" },
        { title: "stop_url", field: "stop_url", editor: "input" },
        { title: "location_type", field: "location_type", editor: "input" },
        { title: "parent_station", field: "parent_station", editor: "input" },
        { title: "stop_timezone", field: "stop_timezone", editor: "input" },
        { title: "wheelchair_boarding", field: "wheelchair_boarding", editor: "select", headerSort: false, editorParams: { values: { 0: "No (0)", 1: "Yes (1)" } } },
        { title: "level_id", field: "level_id", editor: "input" },
        { title: "platform_code", field: "platform_code", editor: "input" },
        {
			formatter: trashIcon, align: "center", title: "Delete", headerSort: false, cellClick: function (e, cell) {				
				cell.getRow().delete();				
			}
		}
	]
});

$("#ImportToStopsTable").on("click", function(){
    //var TempJsonTable = [];
    var jsonDataArray = [];
    
    var progressBar = $('.progress-bar');
    var total = TempTable.getDataCount(); //set this on initial page load
   
	if (TempTable.getDataCount() < 1) {
        alert('No data in the CSV Table');
        return;
    }
    // get table data
    var data = TempTable.getData();
    data.forEach(function(row, index) {
        var jsonData = {};
        var count = Number(index+1);
        var pcg = Math.floor(count/total*100);
        // create new stops layout        
        ColumnsList.forEach(function(selectcolumn) {            
            // get the column selectbox value
            var importcolumn = $("#" + selectcolumn).val();
            var gtfscolumnname = selectcolumn.replace('Column','');
            if (importcolumn != '') {
                if (selectcolumn == "Columnstop_id" && importcolumn == 'GENERATE')
                {
                    stop_id_list = [];
                    let data = StopsTable.getData();
	                stop_id_list = data.map(a => a.stop_id);
                    var counter = 1;
                    var stop_prefix = 'STOP';
                    while ( stop_id_list.indexOf(stop_prefix + pad(counter) ) > -1 ) counter++;

                    var stop_id = stop_prefix + pad(counter);
                    jsonData['stop_id'] = stop_id;
                } 
                else {
                    jsonData[gtfscolumnname] = row[importcolumn];
                }                
            }
        });          
        // True added to add the row to the top of the table. 
        StopsTable.addData(jsonData);
        progressBar.css("width", pcg+ '%').attr("aria-valuenow", pcg+ '%').text(pcg+ '%'); 
        
    });        
});

function SaveStops(datatosave) {
    var pw = $("#password").val(); 
    var xhr = new XMLHttpRequest();
	xhr.open('POST', `${APIpath}tableReadSave?table=stops&pw=${pw}`);
	xhr.withCredentials = true;
	xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
	xhr.onload = function () {
		if (xhr.status === 200) {
			console.log('Successfully sent data via POST to server /API/tableReadSave table=stops, resonse received: ' + xhr.responseText);
			//$('#stopSaveStatus').html('<span class="alert alert-success">' + xhr.responseText + '</span>');
			$.toast({
				title: 'Save Stops',
				subtitle: 'Success',
				content: xhr.responseText,
				type: 'success',
				delay: 3000
			});
		} else {
			console.log('Server POST request to API/tableReadSave table=stops failed. Returned status of ' + xhr.status + ', reponse: ' + xhr.responseText);
			$.toast({
				title: 'Save Stops',
				subtitle: 'Error',
				content: xhr.responseText,
				type: 'error',
				delay: 3000
			});
			//$('#stopSaveStatus').html('<span class="alert alert-danger">Failed to save. Message: ' + xhr.responseText + '</span>');
		}
	}
	xhr.send(JSON.stringify(datatosave)); // this is where POST differs from GET : we can send a payload instead of just url arguments.    
};

$("#ImportToSystem").on("click", function(){
    if (StopsTable.getDataCount() == 0) {
        alert('There are no stops to add to the stops file in the system');
        return;
    }
    // Load the current stops data and combine it with the new data.   
    var stopsurl = APIpath + 'tableReadSave?table=stops';
    StopsTable.redraw();    
    var NewStops = StopsTable.getData();
    console.log (NewStops);
    $.getJSON( stopsurl, function( data ) {
        var CurrentStops = data;        
        // Combine stops
        var CombinedStops = CurrentStops.concat(NewStops);        
        // Save the combined stops
        SaveStops(CombinedStops);
      });    
});

function ProcessResults(results) {
    console.timeEnd('ParseCSV');
    console.log('Filling Table...');
    console.time('FillingTable');
    var columns = results.meta.fields; // Set the columns of the TempTable.
    columns.forEach(function(column) {
        // Add columns to table
        TempTable.addColumn({title:column, field:column});
        // add columns to select boxes.
        ColumnsList.forEach(function(selectcolumn) {
            // Add all column to the select boxes for the import.
            var selected = false;                    
            // gtfs column name
            var gtfscolumnname = selectcolumn.replace('Column','');
            // if the column is equal to the gtfs standard select this column automaticly.
            if (column == gtfscolumnname) { selected = true;}
            var newOption = new Option(column, column, false, selected);
            // add the option to the selectbox.
            $("#" + selectcolumn).append(newOption);
        });                
    });            
    // Import the data in the table.
    TempTable.replaceData(results.data);
    //TempTable.redraw();
    console.timeEnd('FillingTable');
}


function ResetTempTable() {
    
    var cols = TempTable.getColumns() //get array of column components
    cols.forEach(function(col) {
        TempTable.deleteColumn(col);
    });

    // Recreate the default selectboxes.
    ColumnsList.forEach(function(selectcolumn) {
        // Loop through all options
        $("#" + selectcolumn).children('option:not(:first)').remove();            
       if (selectcolumn == 'Columnstop_id') {
            var newOption = new Option("Generate a STOP_ID", "GENERATE", false, false);
            // add the option to the selectbox.
            $("#" + selectcolumn).append(newOption);
       }
        
    });
    var progressBar = $('.progress-bar');
    progressBar.css("width", '0%').attr("aria-valuenow", '0%').text('0%'); 
}

// Is url check:

const isUrl = string => {
    try { return Boolean(new URL(string)); }
    catch(e){ return false; }
}


// Toggles for show hide columns in stop table.

$('#checkstop_id').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("stop_id");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("stop_id");
        StopsTable.redraw();
    }
});

$('#checkstop_code').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("stop_code");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("stop_code");
        StopsTable.redraw();
    }
});

$('#checkstop_name').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("stop_name");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("stop_name");
        StopsTable.redraw();
    }
});

$('#checkstop_desc').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("stop_desc");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("stop_desc");
        StopsTable.redraw();
    }
});

$('#checkstop_lat').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("stop_lat");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("stop_lat");
        StopsTable.redraw();
    }
});

$('#checkstop_lon').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("stop_lon");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("stop_lon");
        StopsTable.redraw();
    }
});

$('#checkstop_lon').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("stop_lon");
        StopsTable.redraw();;
    }
    else {
        StopsTable.showColumn("stop_lon");
        StopsTable.redraw();
    }
});

$('#checkzone_id').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("zone_id");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("zone_id");
        StopsTable.redraw();
    }
});

$('#checkstop_url').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("stop_url");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("stop_url");
        StopsTable.redraw();
    }
});

$('#checklocation_type').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("location_type");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("location_type");
        StopsTable.redraw();
    }
});

$('#checkparent_station').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("parent_station");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("parent_station");
        StopsTable.redraw();
    }
});

$('#checkstop_timezone').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("stop_timezone");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("stop_timezone");
        StopsTable.redraw();
    }
});

$('#checkwheelchair_boarding').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("wheelchair_boarding");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("wheelchair_boarding");
        StopsTable.redraw();
    }
});

$('#checklevel_id').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("level_id");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("level_id");
        StopsTable.redraw();
    }
});

$('#checkplatform_code').change(function() {
    if(this.checked) {
        StopsTable.hideColumn("platform_code");
        StopsTable.redraw();
    }
    else {
        StopsTable.showColumn("platform_code");
        StopsTable.redraw();
    }
});