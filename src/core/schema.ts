import { createParseContext, invalid, ok } from "./context.js";
import type {
  InternalResult,
  ParseContext
} from "./context.js";
import { ValdixError } from "./error.js";
import type {
  IssueInput,
  ParseOptions,
  SchemaMetadata,
  SafeParseResult,
  SuperRefinementContext,
  ValdixIssue
} from "./types.js";
import { isPlainObject } from "./utils.js";

export abstract class BaseSchema<TOutput, TInput = TOutput> {
  public parse(input: TInput, options?: ParseOptions): TOutput {
    const result = this.safeParse(input, options);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  public safeParse(
    input: TInput,
    options?: ParseOptions
  ): SafeParseResult<TOutput> {
    const ctx = createParseContext(options);
    const result = this._parse(input, ctx);

    if (result.ok && ctx.issues.length === 0) {
      return {
        success: true,
        data: result.value
      };
    }

    return {
      success: false,
      error: new ValdixError(ctx.issues)
    };
  }

  public async parseAsync(input: TInput, options?: ParseOptions): Promise<TOutput> {
    const result = await this.safeParseAsync(input, options);
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  public async safeParseAsync(
    input: TInput,
    options?: ParseOptions
  ): Promise<SafeParseResult<TOutput>> {
    const ctx = createParseContext(options);
    const result = await this._parseAsync(input, ctx);

    if (result.ok && ctx.issues.length === 0) {
      return {
        success: true,
        data: result.value
      };
    }

    return {
      success: false,
      error: new ValdixError(ctx.issues)
    };
  }

  public optional(): OptionalSchema<BaseSchema<TOutput, TInput>> {
    return new OptionalSchema(this as BaseSchema<TOutput, TInput>);
  }

  public nullable(): NullableSchema<BaseSchema<TOutput, TInput>> {
    return new NullableSchema(this as BaseSchema<TOutput, TInput>);
  }

  public nullish(): BaseSchema<TOutput | null | undefined, TInput | null | undefined> {
    return this.optional().nullable() as BaseSchema<
      TOutput | null | undefined,
      TInput | null | undefined
    >;
  }

  public default(
    value: TOutput | (() => TOutput)
  ): DefaultSchema<BaseSchema<TOutput, TInput>> {
    return new DefaultSchema(this as BaseSchema<TOutput, TInput>, value);
  }

  public catch(
    value: TOutput | ((input: unknown) => TOutput)
  ): CatchSchema<BaseSchema<TOutput, TInput>> {
    return new CatchSchema(this as BaseSchema<TOutput, TInput>, value);
  }

  public refine(
    check: (value: TOutput) => boolean | string | IssueInput,
    fallbackMessage?: string
  ): RefinementSchema<BaseSchema<TOutput, TInput>> {
    return new RefinementSchema(
      this as BaseSchema<TOutput, TInput>,
      check,
      fallbackMessage
    );
  }

  public refineAsync(
    check: (value: TOutput) => Promise<boolean | string | IssueInput>,
    fallbackMessage?: string
  ): AsyncRefinementSchema<BaseSchema<TOutput, TInput>> {
    return new AsyncRefinementSchema(
      this as BaseSchema<TOutput, TInput>,
      check,
      fallbackMessage
    );
  }

  public superRefine(
    check: (
      value: TOutput,
      context: SuperRefinementContext
    ) => void
  ): SuperRefinementSchema<BaseSchema<TOutput, TInput>> {
    return new SuperRefinementSchema(
      this as BaseSchema<TOutput, TInput>,
      check
    );
  }

  public superRefineAsync(
    check: (
      value: TOutput,
      context: SuperRefinementContext
    ) => Promise<void>
  ): AsyncSuperRefinementSchema<BaseSchema<TOutput, TInput>> {
    return new AsyncSuperRefinementSchema(
      this as BaseSchema<TOutput, TInput>,
      check
    );
  }

  public transform<TNext>(
    transformer: (value: TOutput) => TNext
  ): TransformSchema<BaseSchema<TOutput, TInput>, TNext> {
    return new TransformSchema(
      this as BaseSchema<TOutput, TInput>,
      transformer
    );
  }

  public trim(this: BaseSchema<string, TInput>): BaseSchema<string, TInput> {
    return this.transform((value) => value.trim()) as BaseSchema<string, TInput>;
  }

  public toLowerCase(this: BaseSchema<string, TInput>): BaseSchema<string, TInput> {
    return this.transform((value) => value.toLowerCase()) as BaseSchema<string, TInput>;
  }

  public toUpperCase(this: BaseSchema<string, TInput>): BaseSchema<string, TInput> {
    return this.transform((value) => value.toUpperCase()) as BaseSchema<string, TInput>;
  }

  public pipe<TNext>(
    schema: BaseSchema<TNext, TOutput>
  ): PipelineSchema<BaseSchema<TOutput, TInput>, BaseSchema<TNext, TOutput>> {
    return new PipelineSchema(this as BaseSchema<TOutput, TInput>, schema);
  }

  public array(): ArraySchema<BaseSchema<TOutput, TInput>> {
    return new ArraySchema(this as BaseSchema<TOutput, TInput>);
  }

  public or<TNext extends BaseSchema<any, any>>(
    schema: TNext
  ): UnionSchema<[BaseSchema<TOutput, TInput>, TNext]> {
    return new UnionSchema([this as BaseSchema<TOutput, TInput>, schema]);
  }

  public and<TNext extends BaseSchema<any, any>>(
    schema: TNext
  ): IntersectionSchema<BaseSchema<TOutput, TInput>, TNext> {
    return new IntersectionSchema(
      this as BaseSchema<TOutput, TInput>,
      schema
    );
  }

  public metadata(metadata: SchemaMetadata): MetadataSchema<BaseSchema<TOutput, TInput>> {
    return new MetadataSchema(this as BaseSchema<TOutput, TInput>, metadata);
  }

  public brand<TBrand extends string>(): BrandSchema<BaseSchema<TOutput, TInput>, TBrand> {
    return new BrandSchema(this as BaseSchema<TOutput, TInput>);
  }

  public abstract _parse(
    input: unknown,
    context: ParseContext
  ): InternalResult<TOutput>;

  public async _parseAsync(
    input: unknown,
    context: ParseContext
  ): Promise<InternalResult<TOutput>> {
    return this._parse(input, context);
  }
}

export type InputOf<TSchema extends BaseSchema<any, any>> =
  TSchema extends BaseSchema<any, infer TInput>
    ? TInput
    : never;

export type OutputOf<TSchema extends BaseSchema<any, any>> =
  TSchema extends BaseSchema<infer TOutput, any>
    ? TOutput
    : never;

export type Infer<TSchema extends BaseSchema<any, any>> = OutputOf<TSchema>;

export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

export class OptionalSchema<
  TSchema extends BaseSchema<any, any>
> extends BaseSchema<OutputOf<TSchema> | undefined, InputOf<TSchema> | undefined> {
  public constructor(private readonly inner: TSchema) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<OutputOf<TSchema> | undefined> {
    if (typeof input === "undefined") {
      return ok(undefined);
    }
    return this.inner._parse(input, ctx);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<OutputOf<TSchema> | undefined>> {
    if (typeof input === "undefined") {
      return ok(undefined);
    }
    return this.inner._parseAsync(input, ctx);
  }

  public unwrap(): TSchema {
    return this.inner;
  }
}

export class NullableSchema<
  TSchema extends BaseSchema<any, any>
> extends BaseSchema<OutputOf<TSchema> | null, InputOf<TSchema> | null> {
  public constructor(private readonly inner: TSchema) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<OutputOf<TSchema> | null> {
    if (input === null) {
      return ok(null);
    }
    return this.inner._parse(input, ctx);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<OutputOf<TSchema> | null>> {
    if (input === null) {
      return ok(null);
    }
    return this.inner._parseAsync(input, ctx);
  }
}

export class DefaultSchema<
  TSchema extends BaseSchema<any, any>
> extends BaseSchema<OutputOf<TSchema>, InputOf<TSchema> | undefined> {
  public constructor(
    private readonly inner: TSchema,
    private readonly fallback: OutputOf<TSchema> | (() => OutputOf<TSchema>)
  ) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<OutputOf<TSchema>> {
    const value = typeof input === "undefined"
      ? typeof this.fallback === "function"
        ? (this.fallback as () => OutputOf<TSchema>)()
        : this.fallback
      : input;

    return this.inner._parse(value, ctx);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<OutputOf<TSchema>>> {
    const value = typeof input === "undefined"
      ? typeof this.fallback === "function"
        ? (this.fallback as () => OutputOf<TSchema>)()
        : this.fallback
      : input;

    return this.inner._parseAsync(value, ctx);
  }
}

export class CatchSchema<
  TSchema extends BaseSchema<any, any>
> extends BaseSchema<OutputOf<TSchema>, InputOf<TSchema>> {
  public constructor(
    private readonly inner: TSchema,
    private readonly fallback: OutputOf<TSchema> | ((input: unknown) => OutputOf<TSchema>)
  ) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<OutputOf<TSchema>> {
    const subContext = ctx.fork();
    const parsed = this.inner._parse(input, subContext);
    if (parsed.ok && subContext.issues.length === 0) {
      return parsed;
    }

    return ok(
      typeof this.fallback === "function"
        ? (this.fallback as (raw: unknown) => OutputOf<TSchema>)(input)
        : this.fallback
    );
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<OutputOf<TSchema>>> {
    const subContext = ctx.fork();
    const parsed = await this.inner._parseAsync(input, subContext);
    if (parsed.ok && subContext.issues.length === 0) {
      return parsed;
    }

    return ok(
      typeof this.fallback === "function"
        ? (this.fallback as (raw: unknown) => OutputOf<TSchema>)(input)
        : this.fallback
    );
  }
}

export class RefinementSchema<
  TSchema extends BaseSchema<any, any>
> extends BaseSchema<OutputOf<TSchema>, InputOf<TSchema>> {
  public constructor(
    private readonly inner: TSchema,
    private readonly check: (value: OutputOf<TSchema>) => boolean | string | IssueInput,
    private readonly fallbackMessage?: string
  ) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<OutputOf<TSchema>> {
    const parsed = this.inner._parse(input, ctx);
    if (!parsed.ok) {
      return invalid;
    }

    let result: boolean | string | IssueInput;
    try {
      result = this.check(parsed.value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: this.fallbackMessage ?? "Refinement threw an error."
      });
      return invalid;
    }

    if (result === true) {
      return parsed;
    }

    if (result === false) {
      if (typeof this.fallbackMessage === "string") {
        ctx.addIssue({
          code: "custom",
          message: this.fallbackMessage
        });
      } else {
        ctx.addIssue({
          code: "custom"
        });
      }
      return invalid;
    }

    if (typeof result === "string") {
      ctx.addIssue({
        code: "custom",
        message: result
      });
      return invalid;
    }

    const issue: IssueInput = {
      ...result,
      code: result.code ?? "custom"
    };

    if (typeof result.message === "string") {
      issue.message = result.message;
    } else if (typeof this.fallbackMessage === "string") {
      issue.message = this.fallbackMessage;
    }

    ctx.addIssue(issue);
    return invalid;
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<OutputOf<TSchema>>> {
    const parsed = await this.inner._parseAsync(input, ctx);
    if (!parsed.ok) {
      return invalid;
    }

    let result: boolean | string | IssueInput;
    try {
      result = this.check(parsed.value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: this.fallbackMessage ?? "Refinement threw an error."
      });
      return invalid;
    }

    if (result === true) {
      return parsed;
    }

    if (result === false) {
      if (typeof this.fallbackMessage === "string") {
        ctx.addIssue({
          code: "custom",
          message: this.fallbackMessage
        });
      } else {
        ctx.addIssue({
          code: "custom"
        });
      }
      return invalid;
    }

    if (typeof result === "string") {
      ctx.addIssue({
        code: "custom",
        message: result
      });
      return invalid;
    }

    const issue: IssueInput = {
      ...result,
      code: result.code ?? "custom"
    };

    if (typeof result.message === "string") {
      issue.message = result.message;
    } else if (typeof this.fallbackMessage === "string") {
      issue.message = this.fallbackMessage;
    }

    ctx.addIssue(issue);
    return invalid;
  }
}

export class TransformSchema<
  TSchema extends BaseSchema<any, any>,
  TNext
> extends BaseSchema<TNext, InputOf<TSchema>> {
  public constructor(
    private readonly inner: TSchema,
    private readonly transformValue: (value: OutputOf<TSchema>) => TNext
  ) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<TNext> {
    const parsed = this.inner._parse(input, ctx);
    if (!parsed.ok) {
      return invalid;
    }

    try {
      return ok(this.transformValue(parsed.value));
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Transform failed."
      });
      return invalid;
    }
  }

  public async _parseAsync(input: unknown, ctx: ParseContext): Promise<InternalResult<TNext>> {
    const parsed = await this.inner._parseAsync(input, ctx);
    if (!parsed.ok) {
      return invalid;
    }

    try {
      return ok(this.transformValue(parsed.value));
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Transform failed."
      });
      return invalid;
    }
  }
}

export class PipelineSchema<
  TFirst extends BaseSchema<any, any>,
  TSecond extends BaseSchema<any, OutputOf<TFirst>>
> extends BaseSchema<OutputOf<TSecond>, InputOf<TFirst>> {
  public constructor(
    private readonly first: TFirst,
    private readonly second: TSecond
  ) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<OutputOf<TSecond>> {
    const firstParsed = this.first._parse(input, ctx);
    if (!firstParsed.ok) {
      return invalid;
    }

    return this.second._parse(firstParsed.value, ctx);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<OutputOf<TSecond>>> {
    const firstParsed = await this.first._parseAsync(input, ctx);
    if (!firstParsed.ok) {
      return invalid;
    }

    return this.second._parseAsync(firstParsed.value, ctx);
  }
}

export class PreprocessSchema<
  TInput,
  TSchema extends BaseSchema<any, any>
> extends BaseSchema<OutputOf<TSchema>, TInput> {
  public constructor(
    private readonly preprocess: (input: TInput) => unknown,
    private readonly inner: TSchema
  ) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<OutputOf<TSchema>> {
    const preprocessed = this.preprocess(input as TInput);
    return this.inner._parse(preprocessed, ctx);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<OutputOf<TSchema>>> {
    const preprocessed = this.preprocess(input as TInput);
    return this.inner._parseAsync(preprocessed, ctx);
  }
}

type ArrayRule =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number }
  | { kind: "length"; value: number };

type UniqueSelector<TItem extends BaseSchema<any, any>> =
  ((value: OutputOf<TItem>, index: number) => unknown) | undefined;

export class ArraySchema<
  TItem extends BaseSchema<any, any>
> extends BaseSchema<OutputOf<TItem>[], InputOf<TItem>[]> {
  public constructor(
    private readonly item: TItem,
    private readonly rules: readonly ArrayRule[] = [],
    private readonly uniqueSelector: UniqueSelector<TItem> = undefined
  ) {
    super();
  }

  private with(rule: ArrayRule): ArraySchema<TItem> {
    return new ArraySchema(
      this.item,
      [...this.rules, rule],
      this.uniqueSelector
    );
  }

  public min(value: number): ArraySchema<TItem> {
    return this.with({ kind: "min", value });
  }

  public max(value: number): ArraySchema<TItem> {
    return this.with({ kind: "max", value });
  }

  public length(value: number): ArraySchema<TItem> {
    return this.with({ kind: "length", value });
  }

  public nonempty(): ArraySchema<TItem> {
    return this.min(1);
  }

  public unique(
    selector?: (value: OutputOf<TItem>, index: number) => unknown
  ): ArraySchema<TItem> {
    const extractor =
      selector ?? ((value: OutputOf<TItem>) => value as unknown);
    return new ArraySchema(this.item, this.rules, extractor);
  }

  public getItemSchema(): TItem {
    return this.item;
  }

  public withItem<TNext extends BaseSchema<any, any>>(
    item: TNext
  ): ArraySchema<TNext> {
    return new ArraySchema(
      item,
      this.rules,
      this.uniqueSelector as UniqueSelector<TNext>
    );
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<OutputOf<TItem>[]> {
    if (!Array.isArray(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "array",
        received: typeof input
      });
      return invalid;
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && input.length < rule.value) {
        ctx.addIssue({
          code: "too_small",
          kind: "array",
          minimum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "max" && input.length > rule.value) {
        ctx.addIssue({
          code: "too_big",
          kind: "array",
          maximum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "length" && input.length !== rule.value) {
        ctx.addIssue({
          code: "invalid_tuple_length",
          minimum: rule.value,
          maximum: input.length
        });
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    const output: OutputOf<TItem>[] = new Array(input.length);
    let hasError = false;

    for (let index = 0; index < input.length; index += 1) {
      ctx.path.push(index);
      const parsed = this.item._parse(input[index], ctx);
      ctx.path.pop();

      if (parsed.ok) {
        output[index] = parsed.value;
      } else {
        hasError = true;
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    if (!hasError && this.uniqueSelector) {
      const seen = new Set<unknown>();

      for (let index = 0; index < output.length; index += 1) {
        const value = output[index] as OutputOf<TItem>;
        let key: unknown;

        try {
          key = this.uniqueSelector(value, index);
        } catch {
          ctx.path.push(index);
          ctx.addIssue({
            code: "invalid_array",
            validation: "unique"
          });
          ctx.path.pop();
          hasError = true;
          if (ctx.abortEarly) {
            return invalid;
          }
          continue;
        }

        if (seen.has(key)) {
          ctx.path.push(index);
          ctx.addIssue({
            code: "invalid_array",
            validation: "unique"
          });
          ctx.path.pop();
          hasError = true;
          if (ctx.abortEarly) {
            return invalid;
          }
          continue;
        }

        seen.add(key);
      }
    }

    if (hasError) {
      return invalid;
    }

    return ok(output);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<OutputOf<TItem>[]>> {
    if (!Array.isArray(input)) {
      ctx.addIssue({
        code: "invalid_type",
        expected: "array",
        received: typeof input
      });
      return invalid;
    }

    for (const rule of this.rules) {
      if (rule.kind === "min" && input.length < rule.value) {
        ctx.addIssue({
          code: "too_small",
          kind: "array",
          minimum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "max" && input.length > rule.value) {
        ctx.addIssue({
          code: "too_big",
          kind: "array",
          maximum: rule.value,
          inclusive: true
        });
        if (ctx.abortEarly) {
          return invalid;
        }
        continue;
      }

      if (rule.kind === "length" && input.length !== rule.value) {
        ctx.addIssue({
          code: "invalid_tuple_length",
          minimum: rule.value,
          maximum: input.length
        });
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    const output: OutputOf<TItem>[] = new Array(input.length);
    let hasError = false;

    for (let index = 0; index < input.length; index += 1) {
      ctx.path.push(index);
      const parsed = await this.item._parseAsync(input[index], ctx);
      ctx.path.pop();

      if (parsed.ok) {
        output[index] = parsed.value;
      } else {
        hasError = true;
        if (ctx.abortEarly) {
          return invalid;
        }
      }
    }

    if (!hasError && this.uniqueSelector) {
      const seen = new Set<unknown>();

      for (let index = 0; index < output.length; index += 1) {
        const value = output[index] as OutputOf<TItem>;
        let key: unknown;

        try {
          key = this.uniqueSelector(value, index);
        } catch {
          ctx.path.push(index);
          ctx.addIssue({
            code: "invalid_array",
            validation: "unique"
          });
          ctx.path.pop();
          hasError = true;
          if (ctx.abortEarly) {
            return invalid;
          }
          continue;
        }

        if (seen.has(key)) {
          ctx.path.push(index);
          ctx.addIssue({
            code: "invalid_array",
            validation: "unique"
          });
          ctx.path.pop();
          hasError = true;
          if (ctx.abortEarly) {
            return invalid;
          }
          continue;
        }

        seen.add(key);
      }
    }

    if (hasError) {
      return invalid;
    }

    return ok(output);
  }
}

export type UnionOptions = readonly [BaseSchema<any, any>, ...BaseSchema<any, any>[]];

export class UnionSchema<
  TOptions extends UnionOptions
> extends BaseSchema<OutputOf<TOptions[number]>, InputOf<TOptions[number]>> {
  public constructor(private readonly options: TOptions) {
    super();
  }

  public _parse(input: unknown, ctx: ParseContext): InternalResult<OutputOf<TOptions[number]>> {
    const collected: ValdixIssue[][] = [];

    for (const option of this.options) {
      const branchCtx = ctx.fork();
      const parsed = option._parse(input, branchCtx);

      if (parsed.ok && branchCtx.issues.length === 0) {
        return ok(parsed.value as OutputOf<TOptions[number]>);
      }

      collected.push(branchCtx.issues);
    }

    ctx.addIssue({
      code: "invalid_union",
      unionErrors: collected
    });

    if (!ctx.abortEarly) {
      for (const branchIssues of collected) {
        ctx.issues.push(...branchIssues);
      }
    }

    return invalid;
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<OutputOf<TOptions[number]>>> {
    const collected: ValdixIssue[][] = [];

    for (const option of this.options) {
      const branchCtx = ctx.fork();
      const parsed = await option._parseAsync(input, branchCtx);

      if (parsed.ok && branchCtx.issues.length === 0) {
        return ok(parsed.value as OutputOf<TOptions[number]>);
      }

      collected.push(branchCtx.issues);
    }

    ctx.addIssue({
      code: "invalid_union",
      unionErrors: collected
    });

    if (!ctx.abortEarly) {
      for (const branchIssues of collected) {
        ctx.issues.push(...branchIssues);
      }
    }

    return invalid;
  }
}

const mergeIntersection = (left: unknown, right: unknown): unknown => {
  if (isPlainObject(left) && isPlainObject(right)) {
    return { ...left, ...right };
  }

  if (Object.is(left, right)) {
    return left;
  }

  return Symbol.for("valdix.intersection.invalid");
};

export class IntersectionSchema<
  TLeft extends BaseSchema<any, any>,
  TRight extends BaseSchema<any, any>
> extends BaseSchema<OutputOf<TLeft> & OutputOf<TRight>, InputOf<TLeft> & InputOf<TRight>> {
  public constructor(
    private readonly left: TLeft,
    private readonly right: TRight
  ) {
    super();
  }

  public _parse(
    input: unknown,
    ctx: ParseContext
  ): InternalResult<OutputOf<TLeft> & OutputOf<TRight>> {
    const leftCtx = ctx.fork();
    const rightCtx = ctx.fork();

    const leftParsed = this.left._parse(input, leftCtx);
    const rightParsed = this.right._parse(input, rightCtx);

    if (!leftParsed.ok || leftCtx.issues.length > 0) {
      ctx.addIssue({
        code: "invalid_intersection"
      });
      if (!ctx.abortEarly) {
        ctx.issues.push(...leftCtx.issues);
      }
      return invalid;
    }

    if (!rightParsed.ok || rightCtx.issues.length > 0) {
      ctx.addIssue({
        code: "invalid_intersection"
      });
      if (!ctx.abortEarly) {
        ctx.issues.push(...rightCtx.issues);
      }
      return invalid;
    }

    const merged = mergeIntersection(leftParsed.value, rightParsed.value);
    if (typeof merged === "symbol") {
      ctx.addIssue({
        code: "invalid_intersection",
        message: "Intersection values cannot be merged."
      });
      return invalid;
    }

    return ok(merged as OutputOf<TLeft> & OutputOf<TRight>);
  }

  public async _parseAsync(
    input: unknown,
    ctx: ParseContext
  ): Promise<InternalResult<OutputOf<TLeft> & OutputOf<TRight>>> {
    const leftCtx = ctx.fork();
    const rightCtx = ctx.fork();

    const [leftParsed, rightParsed] = await Promise.all([
      this.left._parseAsync(input, leftCtx),
      this.right._parseAsync(input, rightCtx)
    ]);

    if (!leftParsed.ok || leftCtx.issues.length > 0) {
      ctx.addIssue({
        code: "invalid_intersection"
      });
      if (!ctx.abortEarly) {
        ctx.issues.push(...leftCtx.issues);
      }
      return invalid;
    }

    if (!rightParsed.ok || rightCtx.issues.length > 0) {
      ctx.addIssue({
        code: "invalid_intersection"
      });
      if (!ctx.abortEarly) {
        ctx.issues.push(...rightCtx.issues);
      }
      return invalid;
    }

    const merged = mergeIntersection(leftParsed.value, rightParsed.value);
    if (typeof merged === "symbol") {
      ctx.addIssue({
        code: "invalid_intersection",
        message: "Intersection values cannot be merged."
      });
      return invalid;
    }

    return ok(merged as OutputOf<TLeft> & OutputOf<TRight>);
  }
}
