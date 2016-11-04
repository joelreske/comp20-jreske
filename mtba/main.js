var myLat = 0;
var myLng = 0;
var request = new XMLHttpRequest();
var me = new google.maps.LatLng(myLat, myLng);
var map;
var my_marker;
var redline_data_url = "https://whispering-mountain-14036.herokuapp.com/redline.json";

var myOptions = {
    zoom: 13,
    center: me,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};


function init() {
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    showMyLocation();
}

function showMyLocation() {
    if (navigator.geolocation) { // the navigator.geolocation object is supported on your browser
        navigator.geolocation.getCurrentPosition(function(position) {
            myLat = position.coords.latitude;
            myLng = position.coords.longitude;

            myPos = new google.maps.LatLng(myLat, myLng);
            map.panTo(myPos);
            my_marker = new google.maps.Marker({
                position: myPos,
                title: "Here I Am!"
            });
            my_marker.setMap(map);
            showStops();
        });
    } else {
        alert("Geolocation is not supported by your web browser.  What a shame!");
    }
}

var closest_stop;

function showStops() {
    var paths = new Array(4);
    paths[1] = [];
    paths[2] = [];
    paths[3] = [];

    for (i in stops) {
        var cur_stop = stops[i];

        var cur_marker = new google.maps.Marker({
            position: {
                lat: cur_stop["stop_lat"],
                lng: cur_stop["stop_lon"]
            },
            icon: "t_logo.png",
            map: map
        });

        var cur_pos = {
            lat: cur_stop["stop_lat"],
            lng: cur_stop["stop_lon"]
        };
        paths[cur_stop["line"]].push(cur_pos);

        addStopInfo(cur_marker, cur_stop["stop_name"]);

        // Calculate closest distance
        cur_stop["dist"] = haversineDistance([myLat, myLng], [cur_stop["stop_lat"], cur_stop["stop_lon"]]);
        if (closest_stop == null || cur_stop["dist"] < closest_stop["dist"]) {
            closest_stop = cur_stop;
        }
    }
    updateClosest();

    /* Draw lines connecting paths*/
    for (i in paths) {
        if (i > 1) {
            paths[i].unshift({
                "lat": 42.320685,
                "lng": -71.052391
            });
        }
        var line = new google.maps.Polyline({
            path: paths[i],
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        line.setMap(map);
    }
}

function addStopInfo(stop_marker, name) {
    var stop_info = new google.maps.InfoWindow({
        content: name
    });

    stop_marker.addListener('click', function() {

        function showSchedule(schedule) {
            content = "<b>" + name + "</b><br>";
            var cur_time = schedule.TripList.CurrentTime;
            for (i in schedule.TripList.Trips) {
                var cur_trip = schedule.TripList.Trips[i];

                for (j in cur_trip.Predictions) {
                    var cur_predict = cur_trip.Predictions[j];
                    if (cur_predict.Stop == name) {
                        var arrival_time = cur_time + cur_predict.Seconds;
                        var arrival_date = new Date(arrival_time * 1000);
                        content += "Train to <b>" + cur_trip.Destination + "</b> arriving at <b>" + arrival_date.toLocaleTimeString() + "</b><br>";
                    }
                }
            }
            stop_info.setContent(content);
            stop_info.open(stop_marker.get('map'), stop_marker);
        }
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    showSchedule(JSON.parse(request.responseText));
                } else {
                    alert("Shoot! Looks like the MTBA returned a 404 error. Please try again in a moment.");
                }
            }
        }
        request.open("GET", redline_data_url, true);
        request.send(null);
    });
}

function updateClosest() {
    var closest_line = new google.maps.Polyline({
        path: [{
            lat: myLat,
            lng: myLng
        }, {
            lat: closest_stop["stop_lat"],
            lng: closest_stop["stop_lon"]
        }],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    closest_line.setMap(map);

    my_marker.addListener('click', function() {
        var title = "<b>Closest Line</b> is " + closest_stop["stop_name"] + "<br> <b>Distance</b>: " + closest_stop["dist"];
        var my_info = new google.maps.InfoWindow({
            content: title
        });

        my_info.open(my_marker.get('map'), my_marker);
    });
}


/* Based on code found at http://stackoverflow.com/questions/14560999/using-the-haversine-formula-in-javascript */
function haversineDistance(coords1, coords2, isMiles) {
    function toRad(x) {
        return x * Math.PI / 180;
    }

    var lon1 = coords1[0];
    var lat1 = coords1[1];

    var lon2 = coords2[0];
    var lat2 = coords2[1];

    var R = 6371; // km

    var x1 = lat2 - lat1;
    var dLat = toRad(x1);
    var x2 = lon2 - lon1;
    var dLon = toRad(x2)
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    if (isMiles) d /= 1.60934;

    return d;
}
