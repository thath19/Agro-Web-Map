let map = L.map('map').setView([7.85, 80.75], 8);

// Add OSM basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

let currentLayer = null;

function loadLayer(geojsonPath, popupField) {
  // Remove existing layer
  if (currentLayer) {
    map.removeLayer(currentLayer);
  }

  // Load new layer
  fetch(geojsonPath)
    .then(res => res.json())
    .then(data => {
      currentLayer = L.geoJSON(data, {
        onEachFeature: (feature, layer) => {
          layer.bindPopup(`<b>${popupField}:</b> ${feature.properties[popupField]}`);
        },
        style: {
          color: popupField === "recommended_crop" ? "#0074D9" : "#2ECC40",
          weight: 2
        }
      }).addTo(map);
      map.fitBounds(currentLayer.getBounds());
    });
}

// Button event listeners
document.getElementById('btnSuitability').addEventListener('click', () => {
  loadLayer('data/suitability.geojson', 'recommended_crop');
});

document.getElementById('btnSurvey').addEventListener('click', () => {
  loadLayer('data/crops.geojson', 'crop');
});
