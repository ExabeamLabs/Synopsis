/*
Copyright 2018 Exabeam, Inc.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
   http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
// Logic to create Maps


function initmap(geolocation) {
    var map;
var ajaxRequest;
var plotlist;
var plotlayers=[];

coord_map = []
for (var i = 0; i < geolocation.length; i++){
  // latlng_string = geolocation[i].geo.split(';')
  // alng = parseFloat(latlng_string[0])
  alng = parseFloat(geolocation[i].lat)
  // alat = parseFloat(latlng_string[1])
  alat = parseFloat(geolocation[i].lon)
  atimestamp = geolocation[i].timestamp
  coord_map.push({
    "lng":alng,
    "lat":alat,
    "time":atimestamp
  })

}
markers = []
  // set up the map
    var geolocation_shuffle = document.getElementById('geolocation_shuffle')
    geolocation_shuffle.setAttribute('data-groups',"['" + coord_map.join("','") + "']")
    map = new L.Map('mapid');
      // create the tile layer with correct attribution
	  var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 2, maxZoom: 16, attribution: osmAttrib});
    var bounds = new L.LatLngBounds();
    map.setView(new L.LatLng(coord_map[0].lng, coord_map[0].lat),13);
    map.addLayer(osm);
    map.scrollWheelZoom.disable();
  for( var i = 0; i < coord_map.length;i++){
    lng = coord_map[i].lng
    lat = coord_map[i].lat
    timestamp = coord_map[i].time

     marker = L.marker([lng,lat]).addTo(map)
          .openPopup();
      markers.push([lng,lat])
  }
  var abounds = L.latLngBounds(markers);
  map.fitBounds(abounds);//works!


  //var popup = L.popup()
    //.setLatLng([lng, lat])
    //.setContent("Last known location retrieved on : " + timestamp)
    //.openOn(map);
}