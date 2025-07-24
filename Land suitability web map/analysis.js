import Query from "https://js.arcgis.com/4.29/@arcgis/core/rest/support/Query.js";
import * as geometryEngine from "https://js.arcgis.com/4.29/@arcgis/core/geometry/geometryEngine.js";

export async function runSuitabilityAnalysis(geometry, view) {
  const panel = document.getElementById("analysisPanel");
  panel.innerHTML = "<em>Running analysis...</em>";

  const soilLayer = view.map.findLayerById("Soil Type") || view.map.layers.find(l => l.title === "Soil Type");
  const waterLayer = view.map.findLayerById("Water Coverage") || view.map.layers.find(l => l.title === "Water Coverage");
  const builtupLayer = view.map.findLayerById("Built-up Area") || view.map.layers.find(l => l.title === "Built-up Area");
  const pondsLayer = view.map.findLayerById("Ponds") || view.map.layers.find(l => l.title === "Ponds");
  const agroZoneLayer = view.map.findLayerById("Agro Ecological Zone") || view.map.layers.find(l => l.title === "Agro Ecological Zone");

  async function queryLayer(layer, geom) {
    const query = layer.createQuery();
    query.geometry = geom;
    query.spatialRelationship = "intersects";
    query.outFields = ["*"];
    query.returnGeometry = true;
    const result = await layer.queryFeatures(query);
    return result.features;
  }

  try {
    // Soil
    const soilFeatures = await queryLayer(soilLayer, geometry);
    const soilAttributes = soilFeatures.map(f => f.attributes);
    const domSoils = [...new Set(soilAttributes.map(a => a.DOMSOI || "Unknown"))];
    const faoSoils = [...new Set(soilAttributes.map(a => a.FAOSOIL || "Unknown"))];
    const cropTypes = [...new Set(soilAttributes.map(a => a.Crop || "N/A"))];

    // Water: river (500m) & pond (300m)
    const waterBuffer = geometryEngine.geodesicBuffer(geometry, 500, "meters");
    const waterFeatures = await queryLayer(waterLayer, waterBuffer);
    const isNearRiver = waterFeatures.length > 0;

    const pondBuffer = geometryEngine.geodesicBuffer(geometry, 300, "meters");
    const pondFeatures = await queryLayer(pondsLayer, pondBuffer);
    const isNearPond = pondFeatures.length > 0;

    // Built-up area (1km buffer)
    const bufferGeom = geometryEngine.geodesicBuffer(geometry, 1000, "meters");
    const builtupFeatures = await queryLayer(builtupLayer, bufferGeom);
    let builtupArea = 0;
    for (const feature of builtupFeatures) {
      const geom = feature.geometry;
      if (geom && (geom.type === "polygon" || geom.type === "multipolygon")) {
        const intersection = geometryEngine.intersect(bufferGeom, geom);
        if (intersection) {
          builtupArea += geometryEngine.geodesicArea(intersection, "square-meters");
        }
      }
    }
    const totalBufferArea = geometryEngine.geodesicArea(bufferGeom, "square-meters");
    const builtupPercentage = (builtupArea / totalBufferArea) * 100;

    // Agro Ecological Zone
    const agroFeatures = await queryLayer(agroZoneLayer, geometry);
    const agroZones = [...new Set(agroFeatures.map(f => f.attributes.ZONE || f.attributes.Name || "Unknown"))];
    const climaticZones = [...new Set(agroFeatures.map(f => f.attributes.climatic_z || "Unknown"))];
    const terrains = [...new Set(agroFeatures.map(f => f.attributes.terrain || "Unknown"))];

    // HTML output
    let html = `<strong>Suitability Analysis:</strong><br/><ul style="line-height: 1.6;">`;
    html += `<li><strong>Soil Type (DOMSOI):</strong> ${domSoils.join(", ")}</li>`;
    html += `<li><strong>FAO Soil Class:</strong> ${faoSoils.join(", ")}</li>`;
    html += `<li><strong>Suggested Crops:</strong> ${cropTypes.join(", ")}</li>`;
    html += `<li><strong>Nearby River (within 500m):</strong> ${isNearRiver ? "Yes ✅" : "No ❌"}</li>`;
    html += `<li><strong>Nearby Pond (within 300m):</strong> ${isNearPond ? "Yes ✅" : "No ❌"}</li>`;
    html += `<li><strong>Built-up Area within 1km:</strong> ${builtupPercentage.toFixed(2)}%</li>`;
    html += `<li><strong>Agro Ecological Zone:</strong> ${agroZones.join(", ")}</li>`;
    html += `<li><strong>Climatic Zone:</strong> ${climaticZones.join(", ")}</li>`;
    html += `<li><strong>Terrain:</strong> ${terrains.join(", ")}</li>`;
    html += `</ul><hr/><strong>Final Recommendation:</strong><br/>`;

    // Recommendation logic (expanded)
    if (builtupPercentage >= 20) {
      html += `<p style="color:red;">❌ Not suitable: Urban coverage exceeds 20% within 1km buffer.</p>`;
    } else if (!isNearRiver && !isNearPond) {
      html += `<p style="color:orange;">⚠️ Limited water access. Consider irrigation support.</p>`;
    } else if (cropTypes.includes("N/A") || domSoils.includes("Unknown")) {
      html += `<p style="color:gray;">🛈 Soil or crop data incomplete. Field assessment recommended.</p>`;
    } else if (terrains.includes("Hilly") || terrains.includes("Steep")) {
      html += `<p style="color:orange;">⚠️ Caution: Terrain may not be ideal. Consider soil erosion risk and terracing.</p>`;
    } else {
      html += `<p style="color:green;">✅ Suitable for agriculture. Best crops: ${cropTypes.join(", ")}</p>`;
    }

    if (climaticZones[0] !== "Unknown") {
      html += `<p><strong>Climatic Advice:</strong> This area is in the <em>${climaticZones.join(", ")}</em> zone. Match crops to rainfall/temperature patterns.</p>`;
    }

    panel.innerHTML = html;

  } catch (err) {
    console.error("Error during suitability analysis:", err);
    panel.innerHTML = "<p style='color:red;'>❌ Analysis failed. See console for details.</p>";
  }
}
