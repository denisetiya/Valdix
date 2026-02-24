import { invalid, ok } from "../core/context.js";
import type { InternalResult, ParseContext } from "../core/context.js";
import {
  BaseSchema,
  type InputOf,
  type OutputOf
} from "../core/schema.js";
import { getValueType, hasOwn, isPlainObject } from "../core/utils.js";

export class DiscriminatedUnionSchema<
  TDiscriminator extends string,
  TOptions extends Record<string, BaseSchema<any, any>>
> extends BaseSchema<OutputOf<TOptions[keyof TOptions]>, InputOf<TOptions[keyof TOptions]>> {
  private readonly discriminatorValues: readonly string[];

  public constructor(
    private readonly discriminator: TDiscriminator,
    private readonly options: TOptions
  ) {
    super();
    this.discriminatorValues = Object.keys(options);
  }

  public _parse(
    input: unknown,
    ctx: ParseContext
  ): InternalResult<OutputOf<TOptions[keyof TOptions]>> {
    if (!isPlainObject(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "object",
        received: getValueType(input)
      });
      return invalid;
    }

    const discriminatorValue = input[this.discriminator];
    if (typeof discriminatorValue !== "string") {
      ctx.addIssue({
        code: "invalid_discriminator",
        discriminator: String(discriminatorValue),
        allowedDiscriminators: this.discriminatorValues
      });
      return invalid;
    }

    if (!hasOwn(this.options, discriminatorValue)) {
      ctx.addIssue({
        code: "invalid_discriminator",
        discriminator: discriminatorValue,
        allowedDiscriminators: this.discriminatorValues
      });
      return invalid;
    }

    const targetSchema = this.options[discriminatorValue]!;
    const parsed = targetSchema._parse(input, ctx);
    if (!parsed.ok) {
      return invalid;
    }

    return ok(parsed.value as OutputOf<TOptions[keyof TOptions]>);
  }
}
