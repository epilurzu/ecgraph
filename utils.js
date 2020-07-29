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
    score: null,
  };
}

function init_neighbors(node_index, neighbors) {
  node_info[node_index].neighbors = neighbors;
}

function init_component(corridor, node_index, component_index) {
  node_info[node_index].component = component_index;

  let neighbors = null;
  if (node_info[node_index].neighbors != null) {
    neighbors = node_info[node_index].neighbors;
  } else {
    neighbors = topojson.neighbors(corridor.objects[file_name_key].geometries)[
      node_index
    ];
    init_neighbors(node_index, neighbors);
  }

  for (let neighbor of neighbors) {
    if (node_info[neighbor].component == null) {
      init_component(corridor, neighbor, component_index);
    }
  }
}

function get_component_minus_node(component, removed_node, node_index) {
  let neighbors_to_check = node_info[node_index].neighbors;
  neighbors_to_check = neighbors_to_check.filter((n) => n != removed_node);

  for (let neighbor of neighbors_to_check) {
    if (!component.has(neighbor)) {
      component.add(neighbor);
      component = get_component_minus_node(component, removed_node, neighbor);
    }
  }

  return component;
}

function b(component, node_index, degree) {
  for (let neighbor of node_info[node_index].neighbors) {
    if (!component.has(neighbor)) {
      node_info[node_index].vcn_degree = degree;
      return true;
    }
  }
  return false;
}

function a(component, node_index, degree, iteration) {
  if (iteration == 1) {
    let found = b(component, node_index, degree);
    return found;
  } else {
    for (let node_to_remove of component) {
      let component_to_check = component.filter((n) => n != node_to_remove);
      let found = a(component_to_check, node_index, degree, iteration - 1);
      if (found) {
        if (node_info[node_to_remove].vcn_degree == null) {
          // if this node has already a degree it's fine, but if it has not, it's already possible to assign the current degree
          node_info[node_to_remove].vcn_degree = degree;
        }
        return true;
      }
    }
    return false;
  }
}

function init_vcn_degree(node_index, degree) {
  let component = new Set();
  if (node_info[node_index].neighbors.length == 0) {
    //should not enter at all, change this
    return;
  }
  let starting_neighbor = node_info[node_index].neighbors[0]; // init second largest component and n component
  component = get_component_minus_node(
    component,
    node_index,
    starting_neighbor
  );

  if (degree > 1) {
    a(component, node_index, degree, degree);
  } else {
    b(component, node_index, degree);
  }
}

function init(corridor) {
  id_key = "OBJECTID"; //todo: generalize
  file_name_key = Object.keys(corridor.objects)[0];
  n_nodes = corridor.objects[file_name_key].geometries.length;

  let n_components = 0;
  let t0 = performance.now();
  for (let node_index = 0; node_index < n_nodes; node_index++) {
    init_node(node_index);
  }
  let t1 = performance.now();
  console.log("init node: " + (t1 - t0) / 1000);
  t0 = performance.now();
  for (let node_index = 0; node_index < n_nodes; node_index++) {
    if (node_info[node_index].component === null) {
      init_component(corridor, node_index, n_components);
      n_components++;
    }
  }
  t1 = performance.now();
  console.log("init component: " + (t1 - t0) / 1000);
  /*
  t0 = performance.now();
  let degree = 1;
  let condition = true;
  while (condition) {
    for (let node_index = 0; node_index < n_nodes; node_index++) {
      if (node_info[node_index].vcn_degree == null) {
        //&& con vicini o con disposizione vicini che possono creare vcn
        init_vcn_degree(node_index, degree);
      }
    }
    degree++;
    condition = degree == 3; //tutti hanno un grado o raggiunto grado massimo o null senza vicini o con disposizione vicini che non creano mai vcn
  }
  t1 = performance.now();
  console.log("init vcn degree: " + (t1 - t0) / 1000);
  */
}

function n_cutnode() {
  let counter = 0;
  for (let node_index = 0; node_index < n_nodes; node_index++) {
    if (node_info[node_index].vcn_degree != null) {
      counter++;
    }
  }
  return counter;
}

export function compute_vcn(corridor) {
  //let t0 = performance.now();
  init(corridor);
  //let t1 = performance.now();
  console.log(n_cutnode());
  console.log(node_info);
  //console.log((t1 - t0) / 1000);
}
