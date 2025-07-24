window.onload = () => {
  // All your Leaflet setup here
  const map = L.map('map').setView([7.85, 80.75], 9);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  L.control.scale().addTo(map);

    // Load soil layer
    const soilLayer = L.layerGroup();
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
        soilLayer.addTo(map);
    })
    .catch(error => console.error('Error loading soil layer:', error));

  let surveyLayer = null;

  function loadSurveyData() {
    const surveyURL = "https://services5.arcgis.com/MpnsppwdopkoFFFQ/arcgis/rest/services/Crop_Map_Data__/FeatureServer/0/query?where=1=1&outFields=*&f=geojson";

    fetch(surveyURL)
      .then(res => res.json())
      .then(data => {
        if (!data.features || data.features.length === 0) {
          document.getElementById("info-box").innerHTML = "No survey data found.";
          return;
        }

        if (surveyLayer) {
          map.removeLayer(surveyLayer);
        }

        surveyLayer = L.geoJSON(data, {
          style: {
            color: "#6fa86fff",
            weight: 2,
            opacity: 1,
            fillColor: "#6fa86fff",
            fillOpacity: 0.5
          },
          onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const popupContent = `
              <strong>Crop Category:</strong> ${props["cultivated_crop_catergory"] || 'N/A'}<br/>
              <strong>Crop Type:</strong> ${props["names_of_the_crop_types"] || 'N/A'}<br/>
              <strong>Land Extend:</strong> ${props["land_extend"] || 'N/A'} acres
            `;
            layer.bindPopup(popupContent);
          }
        }).addTo(map);

        map.fitBounds(surveyLayer.getBounds());
        document.getElementById("info-box").innerHTML = "Survey polygons loaded successfully.";
      })
      .catch(err => {
        console.error("Error loading survey data:", err);
        document.getElementById("info-box").innerHTML = "Error loading survey data.";
      });
  }

  // Load data on first load
  loadSurveyData();

  // Button behavior
  const closeBtn = document.getElementById('closeSurvey');
  const modal = document.getElementById('surveyModal');

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    loadSurveyData();
     // reload polygons after closing
  });
};
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
  location.reload(); // Force full page reload
});

