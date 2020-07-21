import * as topojson from "topojson-client";

function union(setA, setB) {
  let _union = new Set(setA);
  for (let elem of setB) {
    _union.add(elem);
  }
  return _union;
}

function difference(setA, setB) {
  let _difference = new Set(setA);
  for (let elem of setB) {
    _difference.delete(elem);
    if (_difference.size == 0) {
      return _difference;
    }
  }
  return _difference;
}
/*
function get_id(patches, id_key, node_index) {
  return patches[node_index]["properties"][id_key];
}
*/
function _get_component(corridor, file_name_key, component, nodes) {
  component = union(component, nodes);

  let neighborhood = new Set();
  nodes.forEach((node) => {
    let neighbors = topojson.neighbors(corridor["objects"][file_name_key]["geometries"])[
      node
    ];
    neighbors.forEach((neighbor) => {
      neighborhood.add(neighbor);
    });
  });

  neighborhood = difference(neighborhood, component);

  if (neighborhood.size == 0) {
    return component;
  }

  return _get_component(corridor, file_name_key, component, neighborhood);
}

function get_component(corridor, file_name_key, node_index) {
  let component = new Set();
  component.add(node_index);

  let neighbors = topojson.neighbors(corridor["objects"][file_name_key]["geometries"])[
    node_index
  ];

  return _get_component(corridor, file_name_key, component, neighbors);
}

export function compute_vcn(corridor) {
  //const id_key = "OBJECTID";
  const file_name_key = Object.keys(corridor["objects"])[0];
  const patches = topojson.feature(corridor, corridor["objects"][file_name_key]).features;

  const components = [];

  mainloop:
  for (let node_index = 0; node_index < patches.length; node_index++) {
    for (let component_index = 0; component_index < components.length; component_index++) {
      if (components[component_index].has(node_index)) {
        continue mainloop;
      }
    }

    let component = get_component(corridor, file_name_key, node_index);
    components.push(component);
  }
}
