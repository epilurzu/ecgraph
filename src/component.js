import { generate_combinations } from "./utils";

import Node from "./node";

var NEIGHBOR_OF_AREA = 0;
var APPENDIX = -1;
var ALONE = -2;

export default class Component {
    constructor(_id, _node_id, _all_neighbors) {
        this.id = _id;
        this.nodes = {};
        this.size = 0;

        this.init(_node_id, _all_neighbors);
    }

    /*** component initialization ***/
    init(_node_id, _all_neighbors) {
        let neighbors = this.get_neighbors_from_all(_node_id, _all_neighbors);

        let node = new Node(_node_id, this.id, neighbors);

        this.add(node);

        for (let neighbor of neighbors) {
            if (!this.contains(neighbor)) {
                this.init(neighbor, _all_neighbors);
            }
        }
    }

    get_neighbors_from_all(_node_id, _all_neighbors) {
        return _all_neighbors[_node_id];
    }
    /*** end component initialization ***/

    /*** spot and set nodes that are alone, appendix or cutnodes ***/
    spot_alone(_node_id) {
        if (this.get_node(_node_id).neighbors.size == 0) {
            this.get_node(_node_id).vcn_degree = ALONE;
        }
    }

    spot_appendix(_node_id) {
        if (this.get_node(_node_id).neighbors.size == 1) {
            this._spot_appendix(_node_id);
        }
    }

    _spot_appendix(_node_id) {
        this.get_node(_node_id).vcn_degree = APPENDIX;

        for (let neighbor_first_line of this.get_node(_node_id).neighbors) {
            if (this.get_node(neighbor_first_line).vcn_degree == null) {
                let not_appendix_neighbors = 0;
                for (let neighbor_second_line of this.get_node(neighbor_first_line).neighbors) {
                    if (this.get_node(neighbor_second_line).vcn_degree != APPENDIX) {
                        not_appendix_neighbors++;
                        if (not_appendix_neighbors > 1) {
                            break;
                        }
                    }
                }
                if (not_appendix_neighbors < 2) {
                    this._spot_appendix(neighbor_first_line);
                }
            }
        }
    }

    spot_cut_node(_node_id) {
        if (this.is_cutnode(this.get_node(_node_id))) {
            this.get_node(_node_id).vcn_degree = 1;
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
    /*** end spot and set nodes that are alone, appendix or cutnodes ***/

    /*** spot and set nodes that have degree 2 or more ***/
    spot_vcn(_parent, _degree, _max_distance) {
        let possible_children = this.get_possible_children(_parent, _degree, _max_distance);
        let families = generate_combinations([...possible_children], _degree - 1);

        for (let family of families) {
            let possible_vcn = new Set(family);
            possible_vcn.add(_parent);

            let starting_node = this.get_starting_node(possible_vcn);
            if (starting_node == null) {
                continue;
            }

            let subcomponent = this.get_subcomponent(starting_node, possible_vcn);
            if (subcomponent.size < (this.size - _degree)) {
                for (let node_id of possible_vcn) {
                    this.get_node(node_id).vcn_degree = _degree;
                }
                break;
            }
        }
    }

    // returns every neighbour inside _max_distance from _parent that has vcn_degree null, equal to _degree and is different from _parent
    get_possible_children(_parent, _degree, _max_distance, distance = 0, neighborhood = new Set(), last_row = null) {
        if (distance == _max_distance) {
            return neighborhood;
        }

        if (last_row == null) {
            last_row = new Set(this.get_node(_parent).neighbors);
        }

        let next_row = new Set();

        for (let node_id of last_row) {
            let neighbors = this.get_node(node_id).neighbors;
            for (let neighbor of neighbors) {
                if (this.get_node(neighbor).vcn_degree == null || this.get_node(neighbor).vcn_degree == _degree) {
                    if (neighbor != _parent) {
                        neighborhood.add(neighbor);
                        next_row.add(neighbor);
                    }
                }
            }
        }

        return this.get_possible_children(_parent, _degree, _max_distance, distance + 1, neighborhood, next_row);
    }

    get_starting_node(_possible_vcn) {
        for (let node_id of _possible_vcn) {
            for (let neighbor of this.get_node(node_id).neighbors) {
                if (!_possible_vcn.has(neighbor)) {
                    return neighbor;
                }
            }
        }

        return null;
    }
    /*** end spot and set nodes that have degree 2 or more ***/

    get_node(_node_id) {
        return this.nodes[_node_id];
    }

    set_neighbor_area(_node_id, _area_id) {
        this.get_node(_node_id).vcn_degree = NEIGHBOR_OF_AREA;
        this.get_node(_node_id).neighbors_areas.add(_area_id);
    }

    add(_node) {
        this.size++;
        this.nodes[_node.id] = _node;
    }

    remove(_node) {
        this.size--;
        delete this.get_node(_node.id);
    }

    contains(_node_id) {
        return this.get_node(_node_id) != undefined;
    }
}

