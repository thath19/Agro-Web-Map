// Initialize map
const map = L.map('map').setView([7.85, 80.75], 9);

// Add OSM basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add scale control
L.control.scale().addTo(map);

// Create layer groups
const soilLayer = L.layerGroup();
const builtupLayer = L.layerGroup();
const riverLayer = L.layerGroup();

// Load soil layer
fetch('https://raw.githubusercontent.com/thath19/soil_map/refs/heads/main/Soil_type.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: 'brown', weight: 1, fillOpacity: 0.3 },
      onEachFeature: function (feature, layer) {
        const props = feature.properties;
        const soilType = props.DOMSOI || "Unknown";
        const crops = props.Crop || "No crop data available";
        const popupContent = `
          <strong>Soil Type:</strong> ${soilType}<br/>
          <strong>Suitable Crops:</strong> ${crops}
        `;
        layer.bindPopup(popupContent);
      }
    }).addTo(soilLayer);
  })
  .catch(error => console.error('Error loading soil layer:', error));

// Load built-up layer
fetch('https://raw.githubusercontent.com/thath19/Land-Cover/main/built.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: 'red', weight: 1, fillOpacity: 0.001 }
    }).addTo(builtupLayer);
  })
  .catch(error => console.error('Error loading built-up area data:', error));

// Load river layer (on top)
fetch('https://raw.githubusercontent.com/thath19/Water_Sources/main/River_coverageNW.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: 'blue', weight: 1, fillOpacity: 0.2 }
    }).addTo(riverLayer);
  })
  .catch(error => console.error('Error loading river data:', error));

soilLayer.addTo(map);
builtupLayer.addTo(map);
riverLayer.addTo(map); // Top layer

// Add layer toggle control
const overlayMaps = {
  "Soil Types": soilLayer,
  "Built-up Areas": builtupLayer,
  "River Coverage": riverLayer
};
L.control.layers(null, overlayMaps, { collapsed: false }).addTo(map);

// Add legend
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
  const div = L.DomUtil.create('div', 'legend');

  div.innerHTML += '<strong>Legend</strong><br>';

  // Soil Types (brown fill)
  div.innerHTML += `
    <div><i class="legend-box" style="background: brown;"></i> Soil Types</div>
  `;

  // Built-up Areas (transparent with red border)
  div.innerHTML += `
    <div><i class="legend-box" style="background: transparent; border: 2px solid red;"></i> Built-up Areas</div>
  `;

  // River Coverage (blue line)
  div.innerHTML += `
    <div><i class="legend-line" style="background: blue;"></i> River Coverage</div>
  `;

  return div;
};

legend.addTo(map);
