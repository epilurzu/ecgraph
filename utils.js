import * as topojson from "topojson-client";

var id_key = null;
var file_name_key = null;
var patches = null;

const node_indexes = [];
const scores = { nodes: [] };

const components = [];

function init_global_variables(corridor) {
  id_key = "OBJECTID"; //todo: generalize
  file_name_key = Object.keys(corridor.objects)[0];
  patches = topojson.feature(corridor, corridor.objects[file_name_key])
    .features;

  for (let index = 0; index < patches.length; index++) {
    node_indexes.push(index);

    scores["nodes"][index] = {
      component: null, // component containing this node
      neighbour_area: null, // adjacent area, if null, it doesn't have any
      vcn_degree: null, // means "virtual cut node degree", if 1 it is a cut node, if null it hasn't been calculated
      n_components_af: null, // means "number of components after removal", they are resulting from this virtual cut node removal
      slc_size_ar: null, // means "second largest component size after removal", it is resulting from this virtual cut node removal
      min_steps_fna: null, // means "minimum steps from nearest area"
      n_shortest_path_in: null, // means "number of shortest path that involve the node", higher is better
      //TODO: chindren_vcn: null,  // means "children virtual cut nodes"
      //TODO: enclave: null,  // is it really helpful?
      //TODO: nb_centrality: null, // is it really helpful?
      score: null
    };
  }
}

function assign_components() {
  for (let component_index = 0; component_index < components.length; component_index++) {
    for (let node_index of components[component_index]) {
      scores.nodes[node_index].component = component_index;
    }
  }
}
/*
function assign_vcn_degree() {
  let node_to_check = node_indexes;
  while (node_to_check.length != 0) {
    for (let node_index in node_indexes) {
      let component_index = scores.nodes[node_index].component;
      let component = components[component_index];
      if (splits_component(component, node_index){
        //update score
        console.log(+ " is cutnode");
        node_to_check = [];
      }
    }
  }
}
*/
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

function get_id(node_index) {
  return patches[node_index]["properties"][id_key];
}

function get_component(corridor, component, nodes) {
  component = union(component, nodes);

  let neighborhood = new Set();
  nodes.forEach((node) => {
    let neighbors = topojson.neighbors(
      corridor.objects[file_name_key].geometries
    )[node];
    neighbors.forEach((neighbor) => {
      neighborhood.add(neighbor);
    });
  });

  neighborhood = difference(neighborhood, component);

  if (neighborhood.size == 0) {
    return component;
  }

  return get_component(corridor, component, neighborhood);
}

function init_components(corridor) {

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

    let new_component = new Set();
    new_component.add(node_index);

    let neighbors = topojson.neighbors(
      corridor.objects[file_name_key].geometries
    )[node_index];

    let component = get_component(corridor, new_component, neighbors);
    components.push(component);
  }
}

export function compute_vcn(corridor) {
  init_global_variables(corridor);

  init_components(corridor);
  assign_components();

  //neighbour_area: null, // todo

  //assign_vcn_degree();

  //n_components_af: null, // means "number of components after removal", they are resulting from this virtual cut node removal
  //slc_size_ar: null, // means "second largest component size after removal", it is resulting from this virtual cut node removal
  //min_steps_fna: null, // means "minimum steps from nearest area"
  //n_shortest_path_in: null, // means "number of shortest path that involve the node", higher is better
  //chindren_vcn: null,  // means "children virtual cut nodes"
  //enclave: null,       // is it really helpful?
  //nb_centrality: null, // is it really helpful?
  //score: null

  console.log(scores)
  console.log(components)
}
