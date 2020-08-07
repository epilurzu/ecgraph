import fs from "file-system";
import compute_vcn from "./utils";


export function cli(args) {
    let rawdata = fs.readFileSync(args[2]);
    let corridor = JSON.parse(rawdata);

    compute_vcn(corridor);
}