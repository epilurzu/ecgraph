import * as turf from "turf";
import * as topojson_client from "topojson-client";
import * as topojson_simplify from "topojson-simplify";
import * as cliProgress from "cli-progress";
import Component from "./component";

var corridor_raw = null;
var corridor_initialized = null;
var corridor_updated = null;

var all_neighbors = [];

var num_nodes = null;

var file_name = null;
var primary_key = null;
var components = new Set();
var num_components = null;

export default function ecgraph(_corridor_raw, _areas_raw, _primary_key = "OBJECTID", weight = 0.00001) {
    corridor_raw = _corridor_raw;
    file_name = get_file_name();
    all_neighbors = get_all_neighbors();
    primary_key = certify_key(_primary_key);  // TOOD: if null, use index
    num_nodes = get_raw_nodes().length;

    init_components();
    assign_areas(_areas_raw, weight);
    init_vcn();

    count();
}

function assign_areas(_areas_raw, _weight) {
    let corridor = get_simpler_features(corridor_raw, _weight);
    let areas = get_simpler_features(_areas_raw, _weight);
    areas = filter_areas(get_bounding_box(corridor), areas);

    const progress_bar = new cliProgress.SingleBar({ format: 'Assign Areas\t{bar} {percentage}% | Time: {duration} s |  Node: {value}/{total}' }, cliProgress.Presets.shades_classic);
    progress_bar.start(num_nodes, 0);


    for (let [node_id, patch] of Object.entries(corridor.features)) {

        for (let area of areas.features) {
            if (patch.geometry == null || area.geometry == null) {
                continue;
            }

            try {
                if (turf.intersect(area, patch) != null) {
                    for (let component of components) {
                        if (component.contains(node_id)) {
                            component.set_neighbor_area(node_id, area.properties.SITECODE);
                            break;
                        }
                    }
                }
            }
            catch (e) {
                //console.error(e);
            }

        }

        progress_bar.increment();
    }

    progress_bar.stop();
}

//TODO: move to utils
function get_simpler_features(_topology, _weight) {
    let ps = topojson_simplify.presimplify(_topology);
    let sp = topojson_simplify.simplify(ps, _weight);
    return topojson_client.feature(sp, sp.objects[Object.keys(sp.objects)[0]]);
}

//TODO: move to utils
function get_bounding_box(_layer) {
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

    return turf.bboxPolygon(bbox);
}

//TODO: move to utils
function filter_areas(_bounding_box, _areas) {
    let areas = {
        type: 'FeatureCollection',
        features: []
    };

    const progress_bar = new cliProgress.SingleBar({ format: 'Filter Areas\t{bar} {percentage}% | Time: {duration} s |  Area: {value}/{total}' }, cliProgress.Presets.shades_classic);
    progress_bar.start(_areas.features.length, 0);

    for (let area of _areas.features) {
        try {
            if (area.geometry == null) {
                continue;
            }

            if (turf.intersect(area, _bounding_box) != null) {
                areas.features.push(area);
            }
        }
        catch (e) {
            //console.log(e)
        }
        progress_bar.increment();
    }
    progress_bar.stop()

    return areas;
}

function count() {

    var neighbor_of_area = 0;
    let appendix = 0;
    let alone = 0;
    let cutnode = 0;

    for (let component of components) {
        for (let [id, node] of Object.entries(component.nodes)) {
            if (node == undefined)
                continue;

            if (node.vcn_degree == 1)
                cutnode++;

            if (node.vcn_degree == 0)
                neighbor_of_area++;

            if (node.vcn_degree == -1)
                appendix++;

            if (node.vcn_degree == -2)
                alone++;


        }
    }

    console.log("cutnode:\t\t" + cutnode)
    console.log("neighbor of area:\t" + neighbor_of_area)
    console.log("appendix:\t\t" + appendix)
    console.log("alone:\t\t\t" + alone)
}

function init_components() {
    const progress_bar = new cliProgress.SingleBar({ format: 'Components\t{bar} {percentage}% | Time: {duration} s |  Node: {value}/{total}' }, cliProgress.Presets.shades_classic);
    progress_bar.start(num_nodes, 0);

    loop:
    for (let node_id = 0; node_id < num_nodes; node_id++) {
        for (let component of components) {
            if (component.contains(node_id)) {
                continue loop;
            }
        }

        let component_id = components.size;
        let component = new Component(component_id, node_id, all_neighbors);
        components.add(component);

        progress_bar.increment(component.size);
    }

    progress_bar.stop();
    num_components = components.size;
}

function init_vcn() {
    const progress_bar = new cliProgress.SingleBar({ format: 'Cut nodes\t{bar} {percentage}% | Time: {duration} s |  Component: {value}/{total}' }, cliProgress.Presets.shades_classic);
    progress_bar.start(num_components, 0);

    loop:
    for (let component of components) {
        progress_bar.increment();

        component.set_vcn_degree();
    }

    progress_bar.stop();
}

//TODO: move to utils
function get_all_neighbors() {
    return topojson_client.neighbors(get_raw_nodes());
}

//TODO: move to utils
function get_raw_nodes() {
    return corridor_raw.objects[file_name].geometries;
}

function get_id(node) {
    return corridor_raw.objects[file_name].geometries[node].properties[primary_key];
}

//TODO: move to utils
function certify_key(primary_key) {
    let keys = new Set();

    for (let node of get_raw_nodes()) {
        let key = node.properties[primary_key];

        if (keys.has(key)) {
            return null;
        }

        keys.add(key);
    }

    return primary_key;
}

//TODO: move to utils
function get_file_name() {
    return Object.keys(corridor_raw.objects)[0];
}
