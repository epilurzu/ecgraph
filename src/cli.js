import fs from "file-system";
import ECGraph from "./ecgraph";

export function cli() {
    let args = require('minimist')(process.argv.slice(2));
    if (args.c == undefined ||  // TODO: check if is a real path
        args.a == undefined ||
        args.o == undefined) {
        console.log("Some required json are missing")
        return;
    }

    let corridor_raw = fs.readFileSync(args.c);
    let corridor = JSON.parse(corridor_raw);

    let areas_raw = fs.readFileSync(args.a);
    let areas = JSON.parse(areas_raw);

    let primary_key = String(args.key);

    let accuracy = args.accuracy;

    let max_degree = args.max_degree;

    let max_distance = args.max_distance;

    let ecgrapg = new ECGraph(corridor, areas, primary_key, accuracy, max_degree, max_distance);

    let output_path = args.o;
    let data = JSON.stringify(ecgrapg.get_updated_corridor());
    fs.writeFileSync(output_path, data);

    console.log("Written in " + output_path);
}