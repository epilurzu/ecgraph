import * as topojson_server from "topojson-server";
import * as topojson_client from "topojson-client";
import * as topojson_simplify from "topojson-simplify";
import { point, distance, centroid, polygon, bboxPolygon } from "turf";

export function get_id(_node_id, _primary_key, _corridor_raw) {
  return _corridor_raw.objects[get_file_name(_corridor_raw)].geometries[_node_id].properties[_primary_key];
}

export function get_file_name(_corridor_raw) {
  return Object.keys(_corridor_raw.objects)[0];
}

export function get_all_neighbors(_corridor_raw) {
  return topojson_client.neighbors(get_raw_nodes(_corridor_raw));
}

export function certify_key(_corridor_raw, primary_key) {
  let keys = new Set();

  for (let node of get_raw_nodes(_corridor_raw)) {
    let key = node.properties[primary_key];

    if (keys.has(key)) {  // TOOD: if null, use index
      return null;
    }

    keys.add(key);
  }

  return primary_key;
}

export function get_raw_nodes(_corridor_raw) {
  return _corridor_raw.objects[get_file_name(_corridor_raw)].geometries;
}

export function get_bounding_box(_layer) {
  let min_x = 999;
  let min_y = 999;
  let max_x = -999;
  let max_y = -999;

  for (let patch of _layer.features) {
    if (patch.geometry == null) {
      continue;
    }

    for (let poligon of patch.geometry.coordinates) { // TODO: generalize
      for (let point of poligon) {
        let x = point[0];
        let y = point[1];

        if (x > max_x) {
          max_x = x;
        }
        else if (x < min_x) {
          min_x = x;
        }

        if (y > max_y) {
          max_y = y;
        }
        else if (y < min_y) {
          min_y = y;
        }
      }
    }
  }

  let bbox = [min_x, min_y, max_x, max_y];

  return bboxPolygon(bbox);
}

export function get_simpler_features(_topology, _accuracy) {
  let ps = topojson_simplify.presimplify(_topology);
  let sp = topojson_simplify.simplify(ps, _accuracy);
  return get_features(sp);
}

export function get_features(_topology) {
  return topojson_client.feature(_topology, _topology.objects[Object.keys(_topology.objects)[0]]);
}

export function get_topology(_features) {
  return topojson_server.topology({ foo: _features });
}

export function get_centroid(_coordinates) {
  let p = polygon(_coordinates);
  return centroid(p);
}

export function get_distance(centroid_1, centroid_2) {
  let p_1 = point(centroid_1);
  let p_2 = point(centroid_2);
  return distance(p_1, p_2);

}

export function get_shortest_distance_node(distances, visited) {
  let shortest = null;

  for (let [node_id, distance] of Object.entries(distances)) {
    let current_is_shortest = shortest === null || distance < distances[shortest];

    if (current_is_shortest && !visited.has(node_id)) {
      shortest = node_id;
    }
  }
  return shortest;
}

export function neighbours_to_string(_neighbors) {
  let str = "";
  for (let neighbor of _neighbors) {
    if (str == "") {
      str = String(neighbor);
    }
    else {
      str = str + ", " + String(neighbor);
    }
  }
  return str;
}

// return every combination of elements in source_array in arrays of length combo_length 
export function generate_combinations(source_array, combo_length) {
  const source_length = source_array.length;
  if (combo_length > source_length) return [];

  const combos = [];

  const makeNextCombos = (working_combo, current_index, remaining_count) => {
    const one_away_from_combo_length = remaining_count == 1;

    for (let source_index = current_index; source_index < source_length; source_index++) {
      const next = [...working_combo, source_array[source_index]];

      if (one_away_from_combo_length) {
        combos.push(next);
      }
      else {
        makeNextCombos(next, source_index + 1, remaining_count - 1);
      }
    }
  }

  makeNextCombos([], 0, combo_length);
  return combos;
}