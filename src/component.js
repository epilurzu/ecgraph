import Node from "./node";

var ALONE = 0;
var APPENDIX = -1;

export default class Component {
    constructor(_id, _node_id, _all_neighbors) {
        this.id = _id;
        this.nodes = {};
        this.size = 0;

        this.init(_node_id, _all_neighbors);

    }

    init(_node_id, _all_neighbors) {
        let neighbors = this.get_neighbors(_node_id, _all_neighbors);

        let node = new Node(_node_id, this.id, neighbors);

        this.add(node);

        for (let neighbor of neighbors) {
            if (!this.contains(neighbor)) {
                this.init(neighbor, _all_neighbors);
            }
        }
    }

    get_neighbors(_node_id, _all_neighbors) {
        return _all_neighbors[_node_id];
    }

    set_vcn_degree() {

        this.spot_alone();

        this.spot_appendix();

        this.spot_cut_node();
    }

    spot_alone() {
        for (let [id, node] of Object.entries(this.nodes)) {
            if (node.vcn_degree == null) {
                if (node.neighbors.size == 0) {
                    node.vcn_degree = ALONE;
                }
            }
        }
    }

    spot_appendix() {
        let found_appendix = true;

        while (found_appendix) {
            found_appendix = false;
            for (let [id, node] of Object.entries(this.nodes)) {
                if (node.vcn_degree == null) {
                    if (node.neighbors.size == 1) {
                        node.vcn_degree = APPENDIX;
                        found_appendix = true;
                    }
                }
            }
            // TODO: quick fix, it can't be iterate before spot neighbors_areas
            // TODO: It can also be optimised starting from actual appendix
            found_appendix = false;
        }
    }

    spot_cut_node() {
        for (let [id, node] of Object.entries(this.nodes)) {
            if (node.vcn_degree == null) {
                if (this.is_cutnode(node)) {
                    node.vcn_degree = 1;
                }
            }
        }
    }

    is_cutnode(_node) {
        let neighbor_values = _node.neighbors.values();
        let starting_neighbor = neighbor_values.next().value;
        let black_list = new Set([_node.id]);
        let subcomponent = this.get_subcomponent(starting_neighbor, black_list);

        let is_cutnode = subcomponent.size < (this.size - 1);

        return is_cutnode;
    }

    get_subcomponent(_starting_neighbor, black_list, subcomponent = new Set()) {
        subcomponent.add(_starting_neighbor);

        let node = this.get_node(_starting_neighbor);
        for (let neighbor of node.neighbors) {
            if (!black_list.has(neighbor) && !subcomponent.has(neighbor)) {
                subcomponent = this.get_subcomponent(neighbor, black_list, subcomponent);
            }
        }

        return subcomponent;
    }

    get_node(_node_id) {
        return this.nodes[_node_id];
    }

    add(_node) {
        this.size++;
        this.nodes[_node.id] = _node;
    }

    remove(_node) {
        this.size--;
        delete this.nodes[_node.id];
    }

    contains(_node_id) {
        return this.nodes[_node_id] != undefined;
    }
}

