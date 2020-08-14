import fs from "file-system";
import ecgraph from "./ecgraph";


export function cli(args) {
    let corridor_raw = fs.readFileSync(args[2]);
    let corridor = JSON.parse(corridor_raw);


    let areas_raw = fs.readFileSync(args[3]);
    let areas = JSON.parse(areas_raw);


    let primary_key = args[4];

    ecgraph(corridor, areas, primary_key);
}