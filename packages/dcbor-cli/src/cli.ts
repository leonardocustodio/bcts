#!/usr/bin/env node
/**
 * dcbor CLI - Command line parser/validator for deterministic CBOR (dCBOR)
 */

import { Command } from "commander";
import { VERSION } from "./index.js";

const program = new Command();

program
  .name("dcbor")
  .description("Command line parser/validator for deterministic CBOR (dCBOR)")
  .version(VERSION);

program
  .argument("[input]", "Input dCBOR in the format specified by --in")
  .option("-i, --in <format>", "Input format: diag, hex, bin", "diag")
  .option("-o, --out <format>", "Output format: diag, hex, bin, none", "hex")
  .option("-a, --annotate", "Add annotations to output")
  .action((_input, _options) => {
    // TODO: Implement main conversion logic
    console.error("dcbor CLI is not yet implemented");
    process.exit(1);
  });

program
  .command("array")
  .description("Compose a dCBOR array from the provided elements")
  .argument("<elements...>", "Elements to compose into an array")
  .action((_elements) => {
    // TODO: Implement array composition
    console.error("array command is not yet implemented");
    process.exit(1);
  });

program
  .command("map")
  .description("Compose a dCBOR map from the provided keys and values")
  .argument("<pairs...>", "Key-value pairs to compose into a map")
  .action((_pairs) => {
    // TODO: Implement map composition
    console.error("map command is not yet implemented");
    process.exit(1);
  });

program.parse();
