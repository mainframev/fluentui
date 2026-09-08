/** A DOM data attribute name. */
export type DataAttributeName = `data-${string}`;

type KebabToCamelCase<Value extends string> = Value extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<KebabToCamelCase<Tail>>}`
  : Value;

type DataAttributeKeys<Value> = Extract<keyof NonNullable<Value>, DataAttributeName>;

/** Maps camel-cased property names to the data attributes declared by a slot value. */
export type DataAttributeConstants<Value> = {
  readonly [Attribute in DataAttributeKeys<Value> as Attribute extends `data-${infer Name}`
    ? KebabToCamelCase<Name>
    : never]-?: Attribute;
};

type SlotNames<State extends { components: object }> = Extract<keyof State['components'], keyof State>;

/** Maps component slots to their declared data attribute names. */
export type SlotDataAttributes<State extends { components: object }> = {
  readonly [SlotName in SlotNames<State> as DataAttributeKeys<State[SlotName]> extends never
    ? never
    : SlotName]-?: DataAttributeConstants<State[SlotName]>;
};
