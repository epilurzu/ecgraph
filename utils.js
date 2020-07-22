import * as topojson from "topojson-client";

const scores = { nodes: [] };

function init_scores(n_patches) {
  for (let index = 0; index < n_patches; index++) {
    scores[index] = {
      neighbour_area: null, // adjacent area, if null, it doesn't have any
      vcn_degree: null, // means "virtual cut node degree", if 1 it is a cut node, if null it hasn't been calculated
      n_components_af: null, // means "number of components after removal", they are resulting from this virtual cut node removal
      slc_size_ar: null, // means "second largest component size after removal", it is resulting from this virtual cut node removal
      min_steps_fna: null, // means "minimum steps from nearest area"
      n_shortest_path_in: null, // means "number of shortest path that involve the node", higher is better
      //TODO: chindren_vcn: null,  // means "children virtual cut nodes"
      //TODO: enclave: null,       // is it really helpful?
      //TODO: nb_centrality: null, // is it really helpful?
      score: null,
    };
  }
  console.log(scores);
}

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
    let neighbors = topojson.neighbors(
      corridor["objects"][file_name_key]["geometries"]
    )[node];
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

  let neighbors = topojson.neighbors(
    corridor["objects"][file_name_key]["geometries"]
  )[node_index];

  return _get_component(corridor, file_name_key, component, neighbors);
}

export function compute_vcn(corridor) {
  //const id_key = "OBJECTID";
  const file_name_key = Object.keys(corridor["objects"])[0];
  const patches = topojson.feature(corridor, corridor["objects"][file_name_key])
    .features;
  init_scores(patches.length);

  const components = [];
  /*
  mainloop: for (
    let node_index = 0;
    node_index < patches.length;
    node_index++
  ) {
    for (
      let component_index = 0;
      component_index < components.length;
      component_index++
    ) {
      if (components[component_index].has(node_index)) {
        continue mainloop;
      }
    }

    let component = get_component(corridor, file_name_key, node_index);
    components.push(component);
  }

*/
}
