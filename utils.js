import * as topojson from "topojson-client";

var id_key = null;
var file_name_key = null; // Corr_Dec_1

var n_nodes = null;
const node_info = [];

function init_node(node_index) {
  node_info[node_index] = {
    component: null, // component containing this node
    neighbours: null, // pleonastic, isn't it?
    neighbour_area: null, // adjacent area, if null, it doesn't have any
    vcn_degree: null, // means "virtual cut node degree", if 1 it is a cut node, if null it hasn't been calculated
    n_components_ar: null, // means "number of components after removal", they are resulting from this virtual cut node removal
    slc_size_ar: null, // means "second largest component size after removal", it is resulting from this virtual cut node removal
    min_steps_fna: null, // means "minimum steps from nearest area"
    n_shortest_path_in: null, // means "number of shortest path that involve the node", higher is better
    //TODO: chindren_vcn: null,  // means "children virtual cut nodes"
    //TODO: enclave: null,  // is it really helpful?
    //TODO: nb_centrality: null, // is it really helpful?
    score: null
  };
}

function init_neighbors(node_index, neighbors) {
  node_info[node_index].neighbors = neighbors;
}

function init_component(corridor, node_index, component_index) {
  node_info[node_index].component = component_index;

  let neighbors = null;
  if (node_info[node_index].neighbors === null) {
    neighbors = node_info[node_index].neighbors;
  }
  else {
    neighbors = topojson.neighbors(corridor.objects[file_name_key].geometries)[node_index];
    init_neighbors(node_index, neighbors);
  }

  for (let new_node_index in neighbors) {
    if (node_info[new_node_index].component === null) {
      init_component(corridor, node, component_index);
    }
  }
}

function init(corridor) {
  id_key = "OBJECTID"; //todo: generalize
  file_name_key = Object.keys(corridor.objects)[0];
  n_nodes = corridor.objects[file_name_key].geometries.length;

  let n_components = 0;

  for (let node_index = 0; node_index < n_nodes; node_index++) {
    init_node(node_index);
  }

  for (let node_index = 0; node_index < n_nodes; node_index++) {
    if (node_info[node_index].component === null) {
      init_component(corridor, node_index, n_components);
      n_components++;
    }
  }
}

export function compute_vcn(corridor) {
  let t0 = performance.now();
  init(corridor);
  let t1 = performance.now();
  console.log(t1 - t0);
}
