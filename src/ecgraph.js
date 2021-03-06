import { intersect } from "turf";
import * as cliProgress from "cli-progress";

import { get_id, get_file_name, certify_key, get_raw_nodes, get_all_neighbors, get_features, get_simpler_features, get_topology, get_bounding_box, neighbours_to_string } from "./utils";
import Component from "./component";

export default class ECGraph {
    constructor(_corridor_topology, _areas_topology, _primary_key = null, accuracy = 0.00001, max_degree = 2, max_distance = 3) {
        this.corridor_topology = _corridor_topology;
        _corridor_topology = null;
        this.primary_key = certify_key(this.corridor_topology, _primary_key);  // TODO: if null, use index
        this.num_nodes = get_raw_nodes(this.corridor_topology).length;

        this.components = new Set();
        this.init_components();

        this.areas_topology = this.filter_areas(_areas_topology, accuracy);
        _areas_topology = null;
        this.assign_areas(this.areas_topology, accuracy);

        this.isolated();
        this.appendices();

        this.set_distances();
        this.shortest_path_scores();

        this.cut_nodes();
        this.virtual_cut_nodes(max_degree, max_distance);

        this.set_score();

        this.count();
    }

    init_components() {
        process.stdout.write("Initializing components...");
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
        }
        process.stdout.write("\r\x1b[K");
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


        process.stdout.write("Filtering areas...");
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
        }
        process.stdout.write("\r\x1b[K")

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

    isolated() {
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
    }

    appendices() {
        let progress_bar = new cliProgress.SingleBar({ format: 'Appendices\t{bar} {percentage}% | Time: {duration} s |  Node: {value}/{total}' }, cliProgress.Presets.shades_classic);
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
    }

    set_distances() {
        process.stdout.write("Getting corridor features...");
        let corridor = get_features(this.corridor_topology);
        process.stdout.write("\r\x1b[K")

        process.stdout.write("Assigning centroids...");
        for (let component of this.components) {
            for (let [id, node] of Object.entries(component.nodes)) {
                if (node.vcn_degree >= 0 || node.vcn_degree == null) {
                    component.init_centroids(node.id, corridor);
                }
            }
        }
        process.stdout.write("\r\x1b[K")

        process.stdout.write("Setting distances...");
        for (let component of this.components) {
            for (let [id, node] of Object.entries(component.nodes)) {
                if (node.vcn_degree >= 0 || node.vcn_degree == null) {
                    component.set_distances(node.id);
                }
            }
        }
        process.stdout.write("\r\x1b[K")
    }

    shortest_path_scores() {
        let tot_shortest_paths = 0;
        let sp_info = {};

        process.stdout.write("Identifying start and end nodes...");
        for (let component of this.components) {
            let pairs = component.get_pairs_of_edge_nodes();
            if (pairs.size > 0) {
                tot_shortest_paths = tot_shortest_paths + pairs.size;
                sp_info[component.id] = pairs;
            }
        }
        process.stdout.write("\r\x1b[K")

        let progress_bar = new cliProgress.SingleBar({ format: 'Shortest paths\t{bar} {percentage}% | Time: {duration} s |  Shortest Path: {value}/{total}' }, cliProgress.Presets.shades_classic);
        progress_bar.start(tot_shortest_paths, 0);

        for (let [component_id, pairs] of Object.entries(sp_info)) {
            for (let component of this.components) {
                if (component_id == component.id) {

                    let n_shortest_path = pairs.size;

                    for (let pair of pairs) {
                        let start_node = pair[0];
                        let end_node = pair[1];
                        component.shortest_path(start_node, end_node);
                        progress_bar.increment();
                    }

                    component.normalize_sp_score(n_shortest_path);
                }
            }
        }
        progress_bar.stop();
    }

    cut_nodes() {
        let progress_bar = new cliProgress.SingleBar({ format: 'Cut nodes\t{bar} {percentage}% | Time: {duration} s |  Node: {value}/{total}' }, cliProgress.Presets.shades_classic);
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

    virtual_cut_nodes(_max_degree, _max_distance) {
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

    set_score() {
        for (let component of this.components) {
            component.set_scores()
        }
    }

    get_updated_corridor() {
        let corridor = this.corridor_topology;

        for (let [id, node] of Object.entries(corridor.objects[get_file_name(corridor)].geometries)) {
            for (let component of this.components) {
                if (component.contains(id)) {
                    let component_id = component.get_node(id).component_id;
                    //let neighbors = [...component.get_node(id).neighbors].map(node => get_id(node, this.primary_key, this.corridor_topology));
                    //neighbors = neighbours_to_string(neighbors);
                    let neighbors_area = neighbours_to_string(component.get_node(id).neighbors_areas);
                    let sp_score = component.get_node(id).sp_score;
                    let vcn_degree = component.get_node(id).vcn_degree;
                    let score = component.get_node(id).score;

                    node.properties["component"] = component_id;
                    //node.properties["neighborsN"] = neighbors; // Too big, exceeds 254-byte limit for strings in shp files
                    node.properties["neighbor_A"] = neighbors_area;
                    node.properties["sp_score"] = sp_score;
                    node.properties["vcn_degree"] = vcn_degree;
                    node.properties["score"] = score;
                }
            }
        }
        return corridor;
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

        console.log("null:            \t" + still_null);
        console.log("alone:           \t" + alone);
        console.log("appendix:        \t" + appendix);
        console.log("neighbor of area:\t" + neighbor_of_area);
        console.log("cutnode:         \t" + cutnode);
        console.log("vcn degree 2:    \t" + vcn_d2);
        console.log("vcn degree 3:    \t" + vcn_d3);
        console.log("vcn degree 4:    \t" + vcn_d4);
    }
}