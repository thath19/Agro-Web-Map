import Map from "https://js.arcgis.com/4.29/@arcgis/core/Map.js";
import MapView from "https://js.arcgis.com/4.29/@arcgis/core/views/MapView.js";
import FeatureLayer from "https://js.arcgis.com/4.29/@arcgis/core/layers/FeatureLayer.js";
import GraphicsLayer from "https://js.arcgis.com/4.29/@arcgis/core/layers/GraphicsLayer.js";
import Sketch from "https://js.arcgis.com/4.29/@arcgis/core/widgets/Sketch.js";
import BasemapToggle from "https://js.arcgis.com/4.29/@arcgis/core/widgets/BasemapToggle.js";
import LayerList from "https://js.arcgis.com/4.29/@arcgis/core/widgets/LayerList.js";
import SimpleRenderer from "https://js.arcgis.com/4.29/@arcgis/core/renderers/SimpleRenderer.js";
import SimpleFillSymbol from "https://js.arcgis.com/4.29/@arcgis/core/symbols/SimpleFillSymbol.js";
import SimpleLineSymbol from "https://js.arcgis.com/4.29/@arcgis/core/symbols/SimpleLineSymbol.js";
import * as analysis from "./analysis.js";

const soilLayerURL = "https://services5.arcgis.com/MpnsppwdopkoFFFQ/arcgis/rest/services/Soil_type/FeatureServer/0";
const agroZoneLayerURL = "https://services5.arcgis.com/MpnsppwdopkoFFFQ/arcgis/rest/services/Agro_ecological_Zone/FeatureServer/0";
const builtupLayerURL = "https://services5.arcgis.com/MpnsppwdopkoFFFQ/arcgis/rest/services/built_up/FeatureServer/0";
const waterLayerURL = "https://services5.arcgis.com/MpnsppwdopkoFFFQ/arcgis/rest/services/River_coverageNW/FeatureServer/0";
const pondsLayerURL = "https://services5.arcgis.com/MpnsppwdopkoFFFQ/arcgis/rest/services/Ponds/FeatureServer/0";

// Create the map and view
const map = new Map({
  basemap: "topo-vector"
});

const view = new MapView({
  container: "viewDiv",
  map: map,
  center: [80.7, 7.5],
  zoom: 8,
  constraints: {
    minZoom: 6,
    maxZoom: 16,
    rotationEnabled: false
  }
});



// Add feature layers
const soilLayer = new FeatureLayer({ url: soilLayerURL, title: "Soil Type", renderer: new SimpleRenderer({
    symbol: new SimpleFillSymbol({
      color: [210, 180, 140, 0.5],  // tan
      outline: { color: [160, 130, 100], width: 1 }
    })
  }) });

const agroZoneLayer = new FeatureLayer({ url: agroZoneLayerURL, title: "Agro Ecological Zone",
  renderer: new SimpleRenderer({
    symbol: new SimpleFillSymbol({
      color: [102, 255, 178, 0.4],  // mint green
      outline: { color: [0, 153, 76], width: 1 }
    })
  }) });

const builtupLayer = new FeatureLayer({ url: builtupLayerURL, title: "Built-up Area",
  renderer: new SimpleRenderer({
    symbol: new SimpleFillSymbol({
      color: [150, 150, 150, 0.5],  // gray
      outline: { color: [80, 80, 80], width: 0.0000001 }
    })
  }) });

const waterLayer = new FeatureLayer({ url: waterLayerURL, title: "Water Coverage",
  renderer: new SimpleRenderer({
    symbol: new SimpleLineSymbol({
      color: [0, 128, 255, 1],  // blue
      width: 1
    })
  }) });

const pondsLayer = new FeatureLayer({ url: pondsLayerURL, title: "Ponds",
  renderer: new SimpleRenderer({
    symbol: new SimpleFillSymbol({
      color: [0, 102, 204, 0.6],  // dark blue
      outline: { color: [0, 51, 102], width: 0.0001 }
    })
  }) });


map.addMany([soilLayer, agroZoneLayer, builtupLayer, waterLayer, pondsLayer]);

// Add drawing layer
const drawLayer = new GraphicsLayer();
map.add(drawLayer);

// Sketch widget
const sketch = new Sketch({
  view: view,
  layer: drawLayer,
  creationMode: "update"
});
view.ui.add(sketch, "top-right");

// Handle sketch drawing
sketch.on("create", (event) => {
  if (event.state === "complete") {
    const geometry = event.graphic.geometry;

    // If an analysis module is present, call it
    if (typeof analysis !== "undefined" && analysis.runSuitabilityAnalysis) {
      analysis.runSuitabilityAnalysis(geometry, view);
    } else {
      console.warn("Suitability analysis function not found.");
    }
  }
});

// LayerList widget (only in sidebar)
const layerList = new LayerList({
  view: view
});
view.ui.add(layerList, "top-right");


// BasemapToggle widget (toggles between satellite and topo)
const basemapToggle = new BasemapToggle({
  view: view,
  nextBasemap: "satellite"
});
view.ui.add(basemapToggle, "bottom-right");