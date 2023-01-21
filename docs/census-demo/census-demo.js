

let zoom = 12;
let center = [-71.25, 46.8];

if (window.location.hash !== '') {
  const hash = window.location.hash.replace('#map=', '');
  const parts = hash.split('/');
  if (parts.length === 4) {
    zoom = parseFloat(parts[0]);
    center = [parseFloat(parts[1]), parseFloat(parts[2])];
  }
}

var disseminationAreasMinZoom = 11;
var disseminationBlocksMinZoom = 14;

disseminationAreasDataSourceZoomLevel = 10;
disseminationBlocksDataSourceZoomLevel = 10;

var styleCache = {};

function getStyle(tenth) {
  var tenthColor = "";

  switch(tenth) {
    case 0:
      tenthColor = "#c1e7ff00";
      break;
    case 1:
      tenthColor = "#abd2ec20";
      break;
    case 2:
      tenthColor = "#94bed940";
      break;
    case 3:
      tenthColor = "#7faac660";
      break;
    case 4:
      tenthColor = "#6996b380";
      break;
    case 5:
      tenthColor = "#5383a1A0";
      break;
    case 6:
      tenthColor = "#3d708fB0";
      break;
    case 7:
      tenthColor = "#255e7eC0";
      break;
    case 8:
      tenthColor = "#004c6dD0";
      break;      
    case 9:
      tenthColor = "#00354dE0";
      break;  

  }
  tenthColorNoAlpha = tenthColor.slice(0, -2);
  return new ol.style.Style({
    fill: new ol.style.Fill({
      color: tenthColor
    }),
    stroke:new ol.style.Stroke({
      color: tenthColorNoAlpha,
      width: .5
    })
  });
}
								
function styleFunction(feature, resolution) {
    var val = feature.get('density2021');
    tenth = 0;

    if(val <= 10)
      tenth = 0;
    else if(val <= 100)
      tenth = 1;
    else if(val <= 500)
      tenth =  3;
    else if(val <= 2000)
      tenth =  4;
    else if(val <= 5000)
      tenth =  5;
    else if(val <= 10000)
      tenth =  6;
    else if(val <= 15000)
      tenth =  7;
    else if(val <= 20000)
      tenth =  8;
    else if(val <= 50000)
      tenth =  9;
    else
      tenth =  10;

    if(!styleCache[tenth]) {
      styleCache[tenth] = getStyle(tenth);
    }
    return styleCache[tenth];
}
var canadaExtent = ol.proj.transformExtent([-140.99778, 41.6751050889, -52.6480987209, 83.23324,4326], 'EPSG:4326', 'EPSG:3857');

var censusSubdivisionsLayer = new ol.layer.VectorTile({
    source: new ol.source.VectorTile({
      format: new ol.format.MVT(),
      url: "/tilecache/census-subdivisions-2021/{z}/{x}/{y}.pbf",
      crossOrigin: 'anonymous',
      minZoom: 8,
      maxZoom: 8        
    }),
    style: styleFunction,
    extent: canadaExtent,
    minZoom: 0,
    maxZoom: disseminationAreasMinZoom + 1 
  });
var disseminationAreasLayer = new ol.layer.VectorTile({
    source: new ol.source.VectorTile({
      format: new ol.format.MVT(),
      url: "/tilecache/dissemination-areas-2021/{z}/{x}/{y}.pbf",
      crossOrigin: 'anonymous',
      minZoom: disseminationAreasDataSourceZoomLevel,
      maxZoom: disseminationAreasDataSourceZoomLevel
    }),
    style: styleFunction,
    extent: canadaExtent,
    minZoom: disseminationAreasMinZoom,
    maxZoom: disseminationBlocksMinZoom + 1    
  });
var disseminationBlocksLayer = new ol.layer.VectorTile({
    source: new ol.source.VectorTile({
      format: new ol.format.MVT(),
      url: "/tilecache/dissemination-blocks-2021/{z}/{x}/{y}.pbf",
      crossOrigin: 'anonymous',
      minZoom: disseminationBlocksDataSourceZoomLevel,
      maxZoom: disseminationBlocksDataSourceZoomLevel  
    }),
    style: styleFunction,
    extent: canadaExtent,
    minZoom: disseminationBlocksMinZoom,
    maxZoom: 20      
  });

var censusSubdivisionsSelection = null;
var disseminationAreasSelection = null;
var disseminationBlocksSelection = null;

var selectedStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(0,0,0,0.8)',
    width: 5,
  })
});  

var censusSubdivisionsSelectionLayer = new ol.layer.VectorTile({
  map: map,
  renderMode: 'vector',
  source: censusSubdivisionsLayer.getSource(),
  extent: canadaExtent,
  minZoom: 0,
  maxZoom: disseminationAreasMinZoom,
  style: function (feature) {
    if(!!censusSubdivisionsSelection)
    if (feature.getProperties().csduid == censusSubdivisionsSelection.getProperties().csduid) {
      return selectedStyle;
    }
  },
});
var disseminationAreasSelectionLayer = new ol.layer.VectorTile({
  map: map,
  renderMode: 'vector',
  source: disseminationAreasLayer.getSource(),
  extent: canadaExtent,
  minZoom: disseminationAreasMinZoom,
  maxZoom: disseminationBlocksMinZoom,
  style: function (feature) {
    if(!!disseminationAreasSelection)
    if (feature.getProperties().dauid == disseminationAreasSelection.getProperties().dauid) {
      return selectedStyle;
    }
  },
});
var disseminationBlocksSelectionLayer = new ol.layer.VectorTile({
  map: map,
  renderMode: 'vector',
  source: disseminationBlocksLayer.getSource(),
  extent: canadaExtent,
  minZoom: disseminationBlocksMinZoom,
  maxZoom: 20,
  style: function (feature) {
    if(!!disseminationBlocksSelection)
    if (feature.getProperties().dbuid == disseminationBlocksSelection.getProperties().dbuid) {
      return selectedStyle;
    }
  },
});

var baseLayer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    url: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
  })
});

var layerGroup = new ol.layer.Group({layers:[censusSubdivisionsLayer,disseminationAreasLayer,disseminationBlocksLayer]});
var selectionLayerGroup = new ol.layer.Group({layers:[censusSubdivisionsSelectionLayer,disseminationAreasSelectionLayer,disseminationBlocksSelectionLayer]});

var map = new ol.Map({
  target: 'map',
  view: new ol.View({
    center: ol.proj.transform(center,'EPSG:4326','EPSG:3857'),
    zoom: zoom
  }),
  layers: [baseLayer,selectionLayerGroup,layerGroup]
});

const view = map.getView();
var firstUpdate = true;
const updatePermalink = function () {
  if (firstUpdate) {
    // do not update the URL when the view was changed in the 'popstate' handler
    firstUpdate = false;
    return;
  }
   
  const center = ol.proj.transform(view.getCenter(),'EPSG:3857', 'EPSG:4326');
    zoom: 12
  const hash =
    '#map=' +
    view.getZoom().toFixed(2) +
    '/' +
    center[0].toFixed(2) +
    '/' +
    center[1].toFixed(2);
  const state = {
    zoom: view.getZoom(),
    center: view.getCenter()
  };
  window.history.replaceState(state, 'map', hash);
};

map.on('moveend', updatePermalink);

const popup = new ol.Overlay({
  element: document.getElementById('popup'),
});
const element = popup.getElement();
map.addOverlay(popup);

map.on(['click'], function (event) {

  if(map.getView().getZoom() <= censusSubdivisionsLayer.getMinZoom() || map.getView().getZoom() >  censusSubdivisionsLayer.getMaxZoom()) {
    censusSubdivisionsSelection = null;
    censusSubdivisionsSelectionLayer.changed();      
  }
  else {
    censusSubdivisionsLayer.getFeatures(event.pixel).then(function (features) {
      var feature = null;
      if (features.length) {
        feature = features[0];
      } 
      censusSubdivisionsSelection = feature;
      displayPopup(event, feature);
      censusSubdivisionsSelectionLayer.changed();    
    });
  } 

  if(map.getView().getZoom() <= disseminationAreasLayer.getMinZoom() || map.getView().getZoom() >  disseminationAreasLayer.getMaxZoom()) {
    disseminationAreasSelection = null;
    disseminationAreasSelectionLayer.changed();      
  }
  else {
    disseminationAreasLayer.getFeatures(event.pixel).then(function (features) {
      var feature = null;
      if (features.length) {
        feature = features[0];
      } 
      disseminationAreasSelection = feature;
      displayPopup(event, feature);
      disseminationAreasSelectionLayer.changed();    
    });
  } 
  
  if(map.getView().getZoom() <= disseminationBlocksLayer.getMinZoom() || map.getView().getZoom() >  disseminationBlocksLayer.getMaxZoom()) {
    disseminationBlocksSelection = null;
    disseminationBlocksSelectionLayer.changed();      
  }
  else {
    disseminationBlocksLayer.getFeatures(event.pixel).then(function (features) {
      var feature = null;
      if (features.length) {
        feature = features[0];
      } 
      disseminationBlocksSelection = feature;
      displayPopup(event, feature);
      disseminationBlocksSelectionLayer.changed();    
    });
  }  
});

function displayPopup(event, feature) {
  const coordinate = event.coordinate;
  popup.setPosition(coordinate);
  let popover = bootstrap.Popover.getInstance(element);
  
  if (popover) {
    popover.dispose();
  }
  var title = "";

  if(feature) {
    if(feature.getProperties().layer == "public.census_agg_census_subdivisions_2021_v")
      title = "Municipality"
    else if(feature.getProperties().layer == "public.census_agg_dissemination_areas_2021_v")
      title = "Dissemination Areas"
    else if(feature.getProperties().layer == "public.census_agg_dissemination_blocks_2021_v")
      title = "Dissemination Blocks"
    popover = new bootstrap.Popover(element, {
      animation: false,
      container: element,
      content: '<p>Name: ' + feature.getProperties().name + '</br>Population: ' + parseInt(feature.getProperties().population2021, 10).toLocaleString('en-US') + '</br>Area: ' + feature.getProperties().computedarea.toLocaleString('en-US') + 'km²</br>Density: ' + (Math.round(feature.getProperties().density2021 * 100) / 100).toLocaleString('en-US') + ' persons/km²</br>Dwellings: ' + parseInt(feature.getProperties().privatedwelling2021, 10).toLocaleString('en-US') + '</p>',
      html: true,
      placement: 'top',
      title: title
    });
    popover.show();
  }

}