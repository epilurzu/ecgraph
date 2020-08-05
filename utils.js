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

/*******************************/

function is_equal_set(as, bs) {
  if (as.size !== bs.size) return false;
  for (var a of as) if (!bs.has(a)) return false;
  return true;
}

function remove_duplicate_set(list) {
  let final_list = [];

  for (let a_set of list) {
    let contains = false;
    for (let b_set of final_list) {
      if (is_equal_set(b_set, a_set)) {
        contains = true;
        break;
      }
    }
    if (!contains) {
      final_list.push(a_set);
    }
  }
  return final_list;
}

function is_child(possible_child, component, black_list) {
  let starting_node = null;
  let temp_black_list = [...black_list];
  temp_black_list.push(possible_child);
  loop:
  for (let node of temp_black_list) {
    for (let neighbor of node_info[node].neighbors) {
      if (!temp_black_list.includes(neighbor)) {
        starting_node = neighbor;
        break loop;
      }
    }
  }

  if (starting_node == null) {
    return false;
  }

  let subcomponent = get_subcomponent(new Set(), temp_black_list, starting_node);

  if (subcomponent.size < component.size - 1) {
    return true;
  }

  return false;
}

function _find_children(component, black_list, degree, loop) {
  if (loop == degree - 1) {
    let orphans = [];
    for (let node of component) {
      if (node_info[node].vcn_degree >= degree) { // vcn with lower degree are not suitable matches
        if (is_child(node, component, black_list)) {
          let children = new Set();
          children.add(node)
          orphans.push(children);
        }
      }
    }

    return orphans.length > 0 ? orphans : null;
  }
  else {
    let families = [];

    for (let node of component) {
      if (node_info[node].vcn_degree >= degree) { // vcn with lower degree are not suitable matches
        let subcomponent = new Set(component);
        subcomponent.delete(node);

        let temp_black_list = [...black_list];
        temp_black_list.push(node);

        // list of set
        let orphans = _find_children(subcomponent, temp_black_list, degree, loop + 1);

        if (orphans == null) {
          continue;
        }

        for (let children of orphans) { // todo: generalize for n
          children.add(node);
          families.push(children);
        }
      }
    }

    families = remove_duplicate_set(families);

    return families.length > 0 ? families : null;
  }
}

function find_children(parent) {
  if (node_info[parent].vcn_degree <= 1 || node_info[parent].vcn_degree == null) {
    return null;
  }

  let subcomponent = get_subcomponent(new Set(), [parent], node_info[parent].neighbors[0]);
  let degree = node_info[parent].vcn_degree;
  let children = _find_children(subcomponent, [parent], degree, 1);

  if (children == null) {
    console.error("no children found");
  }

  return children;
}

/*******************************/


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
