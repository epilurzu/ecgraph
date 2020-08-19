import { intersect } from "turf";
import * as cliProgress from "cli-progress";

import { get_id, certify_key, get_raw_nodes, get_all_neighbors, get_features, get_simpler_features, get_topology, get_bounding_box } from "./utils";
import Component from "./component";

export default class ECGraph {
    constructor(_corridor_topology, _areas_topology, _primary_key = null, accuracy = 0.00001, max_degree = 2, max_distance = 3) {
        this.corridor_topology = _corridor_topology;
        _corridor_topology = null;
        this.primary_key = certify_key(this.corridor_topology, _primary_key);  // TOOD: if null, use index
        this.num_nodes = get_raw_nodes(this.corridor_topology).length;

        this.components = new Set();
        this.init_components();


        for (let component of this.components) {
            if (component.id == 1) {
                let i = component.shortest_path(6496, 6959);

                for (let e of i.path) {
                    console.log("or OBJECTID = " + get_id(e, this.primary_key, this.corridor_topology))
                }
            }
        }



        //this.areas_topology = this.filter_areas(_areas_topology, accuracy);
        //_areas_topology = null;
        //this.assign_areas(this.areas_topology, accuracy);
        //
        //this.init_vcn_low_degree();
        //this.init_vcn_high_degree(max_degree, max_distance);
        //
        //this.count();
    }

    init_components() {
        let progress_bar = new cliProgress.SingleBar({ format: 'Components\t{bar} {percentage}% | Time: {duration} s |  Node: {value}/{total}' }, cliProgress.Presets.shades_classic);
        progress_bar.start(this.num_nodes, 0);

        let all_neighbors = get_all_neighbors(this.corridor_topology);

        loop:
        for (let node_id = 0; node_id < this.num_nodes; node_id++) {
            for (let component of this.components) {
                if (component.contains(node_id)) {
                    continue loop;
                }
            }

            let component_id = this.components.size;
            let component = new Component(component_id, node_id, all_neighbors);
            this.components.add(component);

            progress_bar.increment(component.size);
        }

        progress_bar.stop();
    }

    filter_areas(_areas_topology, _accuracy) {
        process.stdout.write("Simplifying corridor...");
        let corridor_simplified = get_simpler_features(this.corridor_topology, _accuracy);
        process.stdout.write("\r\x1b[K")

        process.stdout.write("Simplifying areas...");
        let areas_simplified = get_simpler_features(_areas_topology, _accuracy);
        process.stdout.write("\r\x1b[K")

        let bounding_box = get_bounding_box(corridor_simplified);
        let valid_sites = new Set();

        let progress_bar = new cliProgress.SingleBar({ format: 'Filter Areas\t{bar} {percentage}% | Time: {duration} s |  Area: {value}/{total}' }, cliProgress.Presets.shades_classic);
        progress_bar.start(areas_simplified.features.length, 0);

        for (let feature of areas_simplified.features) {
            try {
                if (feature.geometry == null) {
                    continue;
                }

                if (intersect(feature, bounding_box) != null) {
                    valid_sites.add(feature.properties.SITECODE);
                }
            }
            catch (e) {
                //console.log(e)
            }
            progress_bar.increment();
        }
        progress_bar.stop()

        process.stdout.write("Getting areas features...");
        let areas = get_features(_areas_topology);
        process.stdout.write("\r\x1b[K")

        process.stdout.write("Filtering...");
        areas.features = areas.features.filter(feature => valid_sites.has(feature.properties.SITECODE));
        process.stdout.write("\r\x1b[K")

        process.stdout.write("Getting areas topology...");
        let areas_topology = get_topology(areas);
        process.stdout.write("\r\x1b[K")

        return areas_topology;
    }

    assign_areas(_areas_topology, _accuracy) {
        process.stdout.write("Simplifying corridor...");
        let corridor_simplified = get_simpler_features(this.corridor_topology, _accuracy);
        process.stdout.write("\r\x1b[K")

        process.stdout.write("Simplifying areas...");
        let areas_simplified = get_simpler_features(_areas_topology, _accuracy);
        process.stdout.write("\r\x1b[K")

        let progress_bar = new cliProgress.SingleBar(
            { format: 'Assign Areas\t{bar} {percentage}% | Time: {duration} s |  Node: {value}/{total}' },
            cliProgress.Presets.shades_classic);
        progress_bar.start(this.num_nodes, 0);


        for (let [node_id, patch] of Object.entries(corridor_simplified.features)) {
            for (let area of areas_simplified.features) {
                if (patch.geometry == null || area.geometry == null) {
                    continue;
                }

                try {
                    if (intersect(area, patch) != null) {
                        for (let component of this.components) {
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

    init_vcn_low_degree() {
        let progress_bar = new cliProgress.SingleBar({ format: 'Isolated \t{bar} {percentage}% | Time: {duration} s |  Node: {value}/{total}' }, cliProgress.Presets.shades_classic);
        progress_bar.start(this.num_nodes, 0);

        for (let component of this.components) {
            for (let [id, node] of Object.entries(component.nodes)) {
                if (node.vcn_degree == null) {
                    component.spot_alone(node.id);
                }
                progress_bar.increment();
            }
        }
        progress_bar.stop();


        progress_bar = new cliProgress.SingleBar({ format: 'Appendices\t{bar} {percentage}% | Time: {duration} s |  Node: {value}/{total}' }, cliProgress.Presets.shades_classic);
        progress_bar.start(this.num_nodes, 0);

        for (let component of this.components) {
            for (let [id, node] of Object.entries(component.nodes)) {
                if (node.vcn_degree == null) {
                    component.spot_appendix(node.id);
                }
                progress_bar.increment();
            }
        }
        progress_bar.stop();


        progress_bar = new cliProgress.SingleBar({ format: 'Cut nodes\t{bar} {percentage}% | Time: {duration} s |  Node: {value}/{total}' }, cliProgress.Presets.shades_classic);
        progress_bar.start(this.num_nodes, 0);

        for (let component of this.components) {
            for (let [id, node] of Object.entries(component.nodes)) {
                if (node.vcn_degree == null) {
                    component.spot_cut_node(node.id);
                }
                progress_bar.increment();
            }
        }
        progress_bar.stop();
    }

    init_vcn_high_degree(_max_degree, _max_distance) {
        for (let degree = 2; degree <= _max_degree; degree++) {
            let progress_bar = new cliProgress.SingleBar({ format: 'vcn degree ' + degree + '\t{bar} {percentage}% | Time: {duration} s |  Node: {value}/{total}' }, cliProgress.Presets.shades_classic);
            progress_bar.start(this.num_nodes, 0);

            for (let component of this.components) {
                for (let [id, node] of Object.entries(component.nodes)) {
                    if (node.vcn_degree == null) {
                        component.spot_vcn(node.id, degree, _max_distance);
                    }
                    progress_bar.increment();
                }
            }
            progress_bar.stop();
        }
    }







    count() {

        let still_null = 0
        let neighbor_of_area = 0;
        let appendix = 0;
        let alone = 0;
        let cutnode = 0;
        let vcn_d2 = 0;
        let vcn_d3 = 0;
        let vcn_d4 = 0;

        for (let component of this.components) {
            for (let [id, node] of Object.entries(component.nodes)) {
                if (node == undefined)
                    continue;

                if (node.vcn_degree == 4)
                    vcn_d4++;

                if (node.vcn_degree == 3)
                    vcn_d3++;

                if (node.vcn_degree == 2)
                    vcn_d2++;

                if (node.vcn_degree == 1)
                    cutnode++;

                if (node.vcn_degree == 0)
                    neighbor_of_area++;

                if (node.vcn_degree == -1)
                    appendix++;

                if (node.vcn_degree == -2)
                    alone++;

                if (node.vcn_degree == null)
                    still_null++;


            }
        }

        console.log("vcn degree 4:    \t" + vcn_d4);
        console.log("vcn degree 3:    \t" + vcn_d3);
        console.log("vcn degree 2:    \t" + vcn_d2);
        console.log("cutnode:         \t" + cutnode);
        console.log("neighbor of area:\t" + neighbor_of_area);
        console.log("appendix:        \t" + appendix);
        console.log("alone:           \t" + alone);
        console.log("null:            \t" + still_null);
    }
}