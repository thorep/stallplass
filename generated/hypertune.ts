/* eslint-disable */

import * as sdk from "hypertune";

export const queryCode = `query FullQuery{root{kampanje forum aiwaittime showCompressionInfoFrontend rabattkode}}`;

export const query: sdk.Query<sdk.ObjectValueWithVariables> = {"variableDefinitions":{},"fragmentDefinitions":{},"fieldQuery":{"Query":{"type":"InlineFragment","objectTypeName":"Query","selection":{"root":{"fieldArguments":{"__isPartialObject__":true},"fieldQuery":{"Root":{"type":"InlineFragment","objectTypeName":"Root","selection":{"kampanje":{"fieldArguments":{},"fieldQuery":null},"forum":{"fieldArguments":{},"fieldQuery":null},"aiwaittime":{"fieldArguments":{},"fieldQuery":null},"showCompressionInfoFrontend":{"fieldArguments":{},"fieldQuery":null},"rabattkode":{"fieldArguments":{},"fieldQuery":null}}}}}}}}};

export const vercelFlagDefinitions = {"kampanje":{"options":[{"label":"Off","value":false},{"label":"On","value":true}],"origin":"https://app.hypertune.com/projects/6066/main/draft/logic?selected_field_path=root%3Ekampanje"},"forum":{"options":[{"label":"Off","value":false},{"label":"On","value":true}],"origin":"https://app.hypertune.com/projects/6066/main/draft/logic?selected_field_path=root%3Eforum"},"aiwaittime":{"options":[],"origin":"https://app.hypertune.com/projects/6066/main/draft/logic?selected_field_path=root%3Eaiwaittime"},"showCompressionInfoFrontend":{"options":[{"label":"Off","value":false},{"label":"On","value":true}],"origin":"https://app.hypertune.com/projects/6066/main/draft/logic?selected_field_path=root%3EshowCompressionInfoFrontend"},"rabattkode":{"options":[{"label":"Off","value":false},{"label":"On","value":true}],"origin":"https://app.hypertune.com/projects/6066/main/draft/logic?selected_field_path=root%3Erabattkode"}};

export type RootFlagValues = {
  "kampanje": boolean;
  "forum": boolean;
  "aiwaittime": number;
  "showCompressionInfoFrontend": boolean;
  "rabattkode": boolean;
}

export type FlagValues = {
  "kampanje": boolean;
  "forum": boolean;
  "aiwaittime": number;
  "showCompressionInfoFrontend": boolean;
  "rabattkode": boolean;
}

export type FlagPaths = keyof FlagValues & string;

export const flagFallbacks: FlagValues = {
  "kampanje": false,
  "forum": false,
  "aiwaittime": 0,
  "showCompressionInfoFrontend": false,
  "rabattkode": false,
}

export function decodeFlagValues<TFlagPaths extends keyof FlagValues & string>(
  encodedValues: string,
  flagPaths: TFlagPaths[]
): Pick<FlagValues, TFlagPaths> {
  return sdk.decodeFlagValues({ flagPaths, encodedValues })
}

export type VariableValues = {};

export type User = {
  id: string;
  name: string;
  email: string;
}

export const EnvironmentEnumValues = [
  "development",
  "production",
  "test"
] as const;
export type Environment = typeof EnvironmentEnumValues[number];

/**
 * This `Context` input type is used for the `context` argument on your root field.
 * It contains details of the current `user` and `environment`.
 * 
 * You can define other custom input types with fields that are primitives, enums 
 * or other input types.
 */
export type Context = {
  user: User;
  environment: Environment;
}

export type RootArgs = {
  context: Context;
}

export type EmptyObject = {};

export type Root = {
  kampanje: boolean;
  forum: boolean;
  aiwaittime: number;
  showCompressionInfoFrontend: boolean;
  rabattkode: boolean;
}

const rootFallback = {kampanje:false,forum:false,aiwaittime:0,showCompressionInfoFrontend:false,rabattkode:false};

export class RootNode extends sdk.Node {
  override typeName = "Root" as const;

  getRootArgs(): RootArgs {
    const { step } = this.props;
    return (step?.type === 'GetFieldStep' ? step.fieldArguments : {}) as RootArgs;
  }

  get({ fallback = rootFallback as Root}: { fallback?: Root } = {}): Root {
    const getQuery = sdk.mergeFieldQueryAndArgs(
      query.fragmentDefinitions,
      sdk.getFieldQueryForPath(query.fragmentDefinitions, query.fieldQuery, ["Query", "root"]), 
      null,
    );
    return this.getValue({ query: getQuery, fallback }) as Root;
  }

  /**
   * [Open in Hypertune UI]({@link https://app.hypertune.com/projects/6066/main/draft/logic?selected_field_path=root%3Ekampanje})
   */
  kampanje({ args = {}, fallback }: { args?: EmptyObject; fallback: boolean; }): boolean {
    const props0 = this.getFieldNodeProps("kampanje", { fieldArguments: args });
    const expression0 = props0.expression;

    if (
      expression0 &&
      expression0.type === "BooleanExpression"
    ) {
      const node = new sdk.BooleanNode(props0);
      return node.get({ fallback });
    }

    const node = new sdk.BooleanNode(props0);
    node._logUnexpectedTypeError();
    return node.get({ fallback });
  }

  /**
   * [Open in Hypertune UI]({@link https://app.hypertune.com/projects/6066/main/draft/logic?selected_field_path=root%3Eforum})
   */
  forum({ args = {}, fallback }: { args?: EmptyObject; fallback: boolean; }): boolean {
    const props0 = this.getFieldNodeProps("forum", { fieldArguments: args });
    const expression0 = props0.expression;

    if (
      expression0 &&
      expression0.type === "BooleanExpression"
    ) {
      const node = new sdk.BooleanNode(props0);
      return node.get({ fallback });
    }

    const node = new sdk.BooleanNode(props0);
    node._logUnexpectedTypeError();
    return node.get({ fallback });
  }

  /**
   * [Open in Hypertune UI]({@link https://app.hypertune.com/projects/6066/main/draft/logic?selected_field_path=root%3Eaiwaittime})
   */
  aiwaittime({ args = {}, fallback }: { args?: EmptyObject; fallback: number; }): number {
    const props0 = this.getFieldNodeProps("aiwaittime", { fieldArguments: args });
    const expression0 = props0.expression;

    if (
      expression0 &&
      expression0.type === "IntExpression"
    ) {
      const node = new sdk.IntNode(props0);
      return node.get({ fallback });
    }

    const node = new sdk.IntNode(props0);
    node._logUnexpectedTypeError();
    return node.get({ fallback });
  }

  /**
   * [Open in Hypertune UI]({@link https://app.hypertune.com/projects/6066/main/draft/logic?selected_field_path=root%3EshowCompressionInfoFrontend})
   */
  showCompressionInfoFrontend({ args = {}, fallback }: { args?: EmptyObject; fallback: boolean; }): boolean {
    const props0 = this.getFieldNodeProps("showCompressionInfoFrontend", { fieldArguments: args });
    const expression0 = props0.expression;

    if (
      expression0 &&
      expression0.type === "BooleanExpression"
    ) {
      const node = new sdk.BooleanNode(props0);
      return node.get({ fallback });
    }

    const node = new sdk.BooleanNode(props0);
    node._logUnexpectedTypeError();
    return node.get({ fallback });
  }

  /**
   * [Open in Hypertune UI]({@link https://app.hypertune.com/projects/6066/main/draft/logic?selected_field_path=root%3Erabattkode})
   */
  rabattkode({ args = {}, fallback }: { args?: EmptyObject; fallback: boolean; }): boolean {
    const props0 = this.getFieldNodeProps("rabattkode", { fieldArguments: args });
    const expression0 = props0.expression;

    if (
      expression0 &&
      expression0.type === "BooleanExpression"
    ) {
      const node = new sdk.BooleanNode(props0);
      return node.get({ fallback });
    }

    const node = new sdk.BooleanNode(props0);
    node._logUnexpectedTypeError();
    return node.get({ fallback });
  }
}

/**
 * This is your project schema expressed in GraphQL.
 * 
 * Define `Boolean` fields for feature flags, custom `enum` fields for flags with 
 * more than two states, `Int` fields for numeric flags like timeouts and limits, 
 * `String` fields to manage in-app copy, `Void` fields for analytics events, and 
 * fields with custom object and list types for more complex app configuration, 
 * e.g. to use Hypertune as a CMS.
 * 
 * Once you've changed your schema, set your flag logic in the Logic view.
 */
export type Source = {
  /**
   * You can add arguments to any field in your schema, which you can then use when
   * setting its logic, including the logic of any nested fields. Your root field 
   * already has a `context` argument. Since all flags are nested under the root 
   * field, this context will be available to all of them.
   */
  root: Root;
}

const sourceFallback = {root:{kampanje:false,forum:false,aiwaittime:0,showCompressionInfoFrontend:false,rabattkode:false}};

export type GetQueryRootArgs = {
  args: RootArgs;
}

export type GetQueryArgs = {
  root: GetQueryRootArgs;
}

/**
 * This is your project schema expressed in GraphQL.
 * 
 * Define `Boolean` fields for feature flags, custom `enum` fields for flags with 
 * more than two states, `Int` fields for numeric flags like timeouts and limits, 
 * `String` fields to manage in-app copy, `Void` fields for analytics events, and 
 * fields with custom object and list types for more complex app configuration, 
 * e.g. to use Hypertune as a CMS.
 * 
 * Once you've changed your schema, set your flag logic in the Logic view.
 */
export class SourceNode extends sdk.Node {
  override typeName = "Query" as const;

  get({ args, fallback = sourceFallback as Source}: { args: GetQueryArgs; fallback?: Source }): Source {
    const getQuery = sdk.mergeFieldQueryAndArgs(
      query.fragmentDefinitions,
      sdk.getFieldQueryForPath(query.fragmentDefinitions, query.fieldQuery, []), 
      args,
    );
    return this.getValue({ query: getQuery, fallback }) as Source;
  }

  /**
   * You can add arguments to any field in your schema, which you can then use when
   * setting its logic, including the logic of any nested fields. Your root field 
   * already has a `context` argument. Since all flags are nested under the root 
   * field, this context will be available to all of them.
   */
  root({ args }: { args: RootArgs; }): RootNode {
    const props0 = this.getFieldNodeProps("root", { fieldArguments: args });
    const expression0 = props0.expression;

    if (
      expression0 &&
      expression0.type === "ObjectExpression" &&
      expression0.objectTypeName === "Root"
    ) {
      return new RootNode(props0);
    }

    const node = new RootNode(props0);
    node._logUnexpectedTypeError();
    return node;
  }
}

export type DehydratedState = sdk.DehydratedState<Source, VariableValues>

const sources: { [key: string]: SourceNode } = {};

export type CreateSourceOptions = {
  token: string; 
  variableValues?: VariableValues;
  override?: sdk.DeepPartial<Source> | null;
  key?: string;
} & sdk.CreateOptions

export function createSource({
  token,
  variableValues = {},
  override,
  key,
  ...options
}: CreateSourceOptions): SourceNode {
  const sourceKey =
    key ?? (typeof window === "undefined" ? "server" : "client");

  if (!sources[sourceKey]) {
    sources[sourceKey] = sdk.create({
      NodeConstructor: SourceNode,
      token,
      variableValues,
      override,
      options,
    });
  }

  return sources[sourceKey];
}

export const emptySource = new SourceNode({
  context: null,
  logger: null,
  parent: null,
  step: null,
  expression: null,
  initDataHash: null,
});

export function createSourceForServerOnly({
  token,
  variableValues = {},
  override,
  key,
  ...options
}: CreateSourceOptions): SourceNode {
  return typeof window === "undefined"
    ? createSource({ token, variableValues, override, ...options })
    : emptySource;
}

/**
 * @deprecated use createSource instead.
 */
export const initHypertune = createSource
/**
 * @deprecated use SourceNode instead.
 */
export type QueryNode = SourceNode;
/**
 * @deprecated use Source instead.
 */
export type Query = Source;
