//
// Copyright 2023 DXOS.org
//

import * as ComboboxPrimitive from '@dxos/react-combobox';

type ComboboxRootProps<I = any> = ComboboxPrimitive.RootProps<I>;

const Root = ComboboxPrimitive.Root;

type ComboboxAnchorProps = ComboboxPrimitive.AnchorProps;

const Anchor = ComboboxPrimitive.Anchor;

type ComboboxTriggerProps = ComboboxPrimitive.TriggerProps;

const Trigger = ComboboxPrimitive.Trigger;

type ComboboxInputProps = ComboboxPrimitive.InputProps;

const Input = ComboboxPrimitive.Input;

type ComboboxLabelProps = ComboboxPrimitive.LabelProps;

const Label = ComboboxPrimitive.Label;

type ComboboxContentProps = ComboboxPrimitive.ContentProps;

const Content = ComboboxPrimitive.Content;

type ComboboxItemProps = ComboboxPrimitive.ItemProps;

const Item = ComboboxPrimitive.Item;

export const Combobox: {
  Root: typeof ComboboxPrimitive.Root;
  Anchor: typeof ComboboxPrimitive.Anchor;
  Trigger: typeof ComboboxPrimitive.Trigger;
  Input: typeof ComboboxPrimitive.Input;
  Label: typeof ComboboxPrimitive.Label;
  Content: typeof ComboboxPrimitive.Content;
  Item: typeof ComboboxPrimitive.Item;
} = {
  Root,
  Anchor,
  Trigger,
  Input,
  Label,
  Content,
  Item,
};

export type {
  ComboboxRootProps,
  ComboboxAnchorProps,
  ComboboxTriggerProps,
  ComboboxInputProps,
  ComboboxLabelProps,
  ComboboxContentProps,
  ComboboxItemProps,
};
