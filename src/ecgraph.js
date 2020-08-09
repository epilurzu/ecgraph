import * as topojson from "topojson-client";
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

export default function ecgraph(_corridor_raw, _primary_key = null) {
    corridor_raw = _corridor_raw;
    file_name = get_file_name();
    all_neighbors = get_all_neighbors();
    primary_key = certify_key(_primary_key);  // TOOD: if null, use index
    num_nodes = get_raw_nodes().length;

    init_components();
    init_vcn();

    count();
}

function count() {
    let alone = 0;
    let appendix = 0;
    let cutnode = 0;

    for (let component of components) {
        for (let [id, node] of Object.entries(component.nodes)) {
            if (node == undefined)
                continue;

            if (node.vcn_degree == 0)
                alone++;

            if (node.vcn_degree == -1)
                appendix++;

            if (node.vcn_degree == 1)
                cutnode++;
        }
    }

    console.log("alone: " + alone)
    console.log("appendix: " + appendix)
    console.log("cutnode: " + cutnode)
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

function get_all_neighbors() {
    return topojson.neighbors(get_raw_nodes());
}

function get_raw_nodes() {
    return corridor_raw.objects[file_name].geometries;
}

function get_id(node) {
    return corridor_raw.objects[file_name].geometries[node].properties[primary_key];
}

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

function get_file_name() {
    return Object.keys(corridor_raw.objects)[0];
}
