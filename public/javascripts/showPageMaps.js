mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/satellite-v9', // style URL
        center: campgrounds.geometry.coordinates, // starting position [longitute, latitude]
        zoom: 15, // starting zoom
});

map.addControl(new mapboxgl.NavigationControl(),'bottom-right');

new mapboxgl.Marker()
.setLngLat(campgrounds.geometry.coordinates)
 .setPopup(
         new mapboxgl.Popup({offset: 25})
         .setHTML(
                `<h3>${campgrounds.title}</h3><p>${campgrounds.location}</p>`
         )

 )
.addTo(map)


