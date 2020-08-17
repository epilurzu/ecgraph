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

    set_vcn_low_degree() {

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
        for (let [id, node] of Object.entries(this.nodes)) {
            if (node.vcn_degree == null) {
                if (node.neighbors.size == 1) {
                    this.set_appendix(id);
                }
            }
        }
    }

    set_appendix(_node_id) {
        this.nodes[_node_id].vcn_degree = APPENDIX;

        for (let neighbor_d1 of this.nodes[_node_id].neighbors) {
            if (this.nodes[neighbor_d1].vcn_degree == null) {
                let not_appendix_neighbors = 0;
                for (let neighbor_d2 of this.nodes[neighbor_d1].neighbors) {
                    if (this.nodes[neighbor_d2].vcn_degree != APPENDIX) {
                        not_appendix_neighbors++;
                        if (not_appendix_neighbors > 1) {
                            break;
                        }
                    }
                }
                if (not_appendix_neighbors < 2) {
                    this.set_appendix(neighbor_d1);
                }
            }
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

    set_vcn_high_degree(_max_degree, _max_distance) {
        for (let degree = 2; degree <= _max_degree; degree++) {
            for (let [id, node] of Object.entries(this.nodes)) {
                if (this.get_node(node.id).vcn_degree == null) {
                    this.spot_vcn(node.id, degree, _max_distance);
                }
            }
        }
    }

    spot_vcn(_parent, _degree, _max_distance) {
        let neighbors = this.get_valid_neighborhood(_parent, _degree, _max_distance);
        let families = this.generateCombinations([...neighbors], _degree - 1);

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

    get_valid_neighborhood(_parent, _degree, _max_distance, distance = 0, neighborhood = new Set(), last_row = null) {
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

        return this.get_valid_neighborhood(_parent, _degree, _max_distance, distance + 1, neighborhood, next_row);
    }

    get_starting_node(_possible_vcn) {
        for (let node_id of _possible_vcn) {
            for (let neighbor of this.nodes[node_id].neighbors) {
                if (!_possible_vcn.has(neighbor)) {
                    return neighbor;
                }
            }
        }

        return null;
    }

    set_neighbor_area(_node_id, _area_id) {
        this.nodes[_node_id].vcn_degree = NEIGHBOR_OF_AREA;
        this.nodes[_node_id].neighbors_areas.add(_area_id);
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

    //TODO: move to utils
    generateCombinations(sourceArray, comboLength) {
        const sourceLength = sourceArray.length;
        if (comboLength > sourceLength) return [];

        const combos = []; // Stores valid combinations as they are generated.

        // Accepts a partial combination, an index into sourceArray, 
        // and the number of elements required to be added to create a full-length combination.
        // Called recursively to build combinations, adding subsequent elements at each call depth.
        const makeNextCombos = (workingCombo, currentIndex, remainingCount) => {
            const oneAwayFromComboLength = remainingCount == 1;

            // For each element that remaines to be added to the working combination.
            for (let sourceIndex = currentIndex; sourceIndex < sourceLength; sourceIndex++) {
                // Get next (possibly partial) combination.
                const next = [...workingCombo, sourceArray[sourceIndex]];

                if (oneAwayFromComboLength) {
                    // Combo of right length found, save it.
                    combos.push(next);
                }
                else {
                    // Otherwise go deeper to add more elements to the current partial combination.
                    makeNextCombos(next, sourceIndex + 1, remainingCount - 1);
                }
            }
        }

        makeNextCombos([], 0, comboLength);
        return combos;
    }
}

