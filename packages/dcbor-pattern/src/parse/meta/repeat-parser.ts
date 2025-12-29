/**
 * Repeat pattern parser (quantifiers).
 *
 * @module parse/meta/repeat-parser
 */

import type { Lexer } from "../token";
import type { Pattern } from "../../pattern";
import type { Result } from "../../error";
import { Ok } from "../../error";
import { Quantifier } from "../../quantifier";
import { Reluctance } from "../../reluctance";
import { repeatPattern } from "../../pattern/meta/repeat-pattern";

/**
 * Parse quantifier tokens that follow a grouped pattern.
 */
export const parseQuantifier = (
  pattern: Pattern,
  lexer: Lexer,
  forceRepeat: boolean,
): Result<Pattern> => {
  const peeked = lexer.peekToken();

  if (peeked === undefined || !peeked.ok) {
    // No quantifier found
    if (forceRepeat) {
      return Ok(wrapInRepeat(pattern, Quantifier.exactly(1)));
    }
    return Ok(pattern);
  }

  const token = peeked.value;

  switch (token.type) {
    case "RepeatZeroOrMore":
      lexer.next();
      return Ok(wrapInRepeat(pattern, Quantifier.zeroOrMore()));

    case "RepeatZeroOrMoreLazy":
      lexer.next();
      return Ok(wrapInRepeat(pattern, Quantifier.zeroOrMore(Reluctance.Lazy)));

    case "RepeatZeroOrMorePossessive":
      lexer.next();
      return Ok(wrapInRepeat(pattern, Quantifier.zeroOrMore(Reluctance.Possessive)));

    case "RepeatOneOrMore":
      lexer.next();
      return Ok(wrapInRepeat(pattern, Quantifier.oneOrMore()));

    case "RepeatOneOrMoreLazy":
      lexer.next();
      return Ok(wrapInRepeat(pattern, Quantifier.oneOrMore(Reluctance.Lazy)));

    case "RepeatOneOrMorePossessive":
      lexer.next();
      return Ok(wrapInRepeat(pattern, Quantifier.oneOrMore(Reluctance.Possessive)));

    case "RepeatZeroOrOne":
      lexer.next();
      return Ok(wrapInRepeat(pattern, Quantifier.zeroOrOne()));

    case "RepeatZeroOrOneLazy":
      lexer.next();
      return Ok(wrapInRepeat(pattern, Quantifier.zeroOrOne(Reluctance.Lazy)));

    case "RepeatZeroOrOnePossessive":
      lexer.next();
      return Ok(wrapInRepeat(pattern, Quantifier.zeroOrOne(Reluctance.Possessive)));

    case "Range":
      lexer.next();
      return Ok(wrapInRepeat(pattern, token.quantifier));

    default:
      // No quantifier found
      if (forceRepeat) {
        return Ok(wrapInRepeat(pattern, Quantifier.exactly(1)));
      }
      return Ok(pattern);
  }
};

/**
 * Wrap a pattern in a RepeatPattern with the given quantifier.
 */
const wrapInRepeat = (pattern: Pattern, quantifier: Quantifier): Pattern => ({
  kind: "Meta",
  pattern: { type: "Repeat", pattern: repeatPattern(pattern, quantifier) },
});
