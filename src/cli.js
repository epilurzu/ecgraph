import fs from "file-system";
import ECGraph from "./ecgraph";

export function cli(args) {
    let corridor_raw = fs.readFileSync(args[2]);
    let corridor = JSON.parse(corridor_raw);

    let areas_raw = fs.readFileSync(args[3]);
    let areas = JSON.parse(areas_raw);

    let primary_key = args[4];

    let accuracy = args[5];

    let ecgrapg = new ECGraph(corridor, areas, primary_key, accuracy);
}