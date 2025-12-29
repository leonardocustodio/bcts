/**
 * Text pattern parser.
 *
 * @module parse/value/text-parser
 */

import type { Lexer } from "../token";
import type { Pattern } from "../../pattern";
import type { Result } from "../../error";
import { Ok } from "../../error";
import { anyText } from "../../pattern";

/**
 * Parse a text pattern from the `text` keyword.
 */
export const parseText = (_lexer: Lexer): Result<Pattern> => {
  // `text` keyword was already consumed
  return Ok(anyText());
};
