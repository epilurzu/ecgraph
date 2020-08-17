export default class Node {
    constructor(_id, _component_id, _neighbors) {
        this.id = _id;
        this.component_id = _component_id;
        this.neighbors = new Set(_neighbors);
        this.neighbors_areas = new Set();
        this.vcn_degree = null;
    }
}