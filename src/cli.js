import fs from "file-system";
import ecgraph from "./ecgraph";


export function cli(args) {
    let rawdata = fs.readFileSync(args[2]);
    let corridor = JSON.parse(rawdata);
    let primary_key = args[3];

    ecgraph(corridor, primary_key);
}