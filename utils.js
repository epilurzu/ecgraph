import * as topojson from "topojson-client";

const scores = { nodes: [] };

function init_scores(n_patches) {
  for (let index = 0; index < n_patches; index++) {
    scores["nodes"][index] = {
      component: null, // component containing this node
      neighbour_area: null, // adjacent area, if null, it doesn't have any
      vcn_degree: null, // means "virtual cut node degree", if 1 it is a cut node, if null it hasn't been calculated
      n_components_af: null, // means "number of components after removal", they are resulting from this virtual cut node removal
      slc_size_ar: null, // means "second largest component size after removal", it is resulting from this virtual cut node removal
      min_steps_fna: null, // means "minimum steps from nearest area"
      n_shortest_path_in: null, // means "number of shortest path that involve the node", higher is better
      //TODO: chindren_vcn: null,  // means "children virtual cut nodes"
      //TODO: enclave: null,       // is it really helpful?
      //TODO: nb_centrality: null, // is it really helpful?
      score: null
    };
  }
}

function assign_components(components) {
  for (let component_index = 0; component_index < components.length; component_index++) {
    for (let node_index of components[component_index]) {
      scores.nodes[node_index].component = component_index;
    }
  }
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
function get_component(corridor, file_name_key, component, nodes) {
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

  return get_component(corridor, file_name_key, component, neighborhood);
}

function get_components(corridor, n_patches, file_name_key) {
  const components = [];

  mainloop: for (
    let node_index = 0;
    node_index < n_patches;
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

    let component = get_component(corridor, file_name_key, new_component, neighbors);
    components.push(component);
  }

  return components;
}

export function compute_vcn(corridor) {
  //const id_key = "OBJECTID";
  const file_name_key = Object.keys(corridor.objects)[0];
  const patches = topojson.feature(corridor, corridor.objects[file_name_key])
    .features;
  const n_patches = patches.length;
  init_scores(n_patches);

  const components = get_components(corridor, n_patches, file_name_key);
  assign_components(components);

  console.log(components)
  console.log(scores)
}
