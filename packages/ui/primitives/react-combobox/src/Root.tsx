//
// Copyright 2023 DXOS.org
//

import { createContextScope, Scope } from '@radix-ui/react-context';
import { createMenuScope, MenuAnchorProps, MenuContentProps, MenuItemProps, MenuProps } from '@radix-ui/react-menu';
import * as MenuPrimitive from '@radix-ui/react-menu';
import { Primitive } from '@radix-ui/react-primitive';
import { Slot } from '@radix-ui/react-slot';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { GetItemPropsOptions, useCombobox, UseComboboxProps, UseComboboxReturnValue } from 'downshift';
import React, { ComponentPropsWithRef, forwardRef, useCallback } from 'react';

import {
  InputRoot,
  InputRootProps,
  TextInput,
  TextInputProps,
  Label as InputLabel,
  LabelProps as InputLabelProps,
} from '@dxos/react-input';

// Root

const COMBOBOX_NAME = 'Combobox';

type ScopedProps<P> = P & { __scopeCombobox?: Scope };

type ComboboxContextValue<I = any> = UseComboboxReturnValue<I>;

const useMenuScope = createMenuScope();
const [createComboboxContext] = createContextScope(COMBOBOX_NAME, [createMenuScope]);
const [ComboboxProvider, useComboboxContext] = createComboboxContext<ComboboxContextValue>(COMBOBOX_NAME);

type RootProps<I> = Omit<UseComboboxProps<I>, 'isOpen' | 'defaultIsOpen' | 'initialIsOpen' | 'onIsOpenChange'> &
  MenuProps &
  Pick<InputRootProps, 'id'> & {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?(open: boolean): void;
  };

const Root = <I = any,>({
  __scopeCombobox,
  id,
  children,
  open,
  onOpenChange,
  defaultOpen,
  dir,
  modal,
  ...hookProps
}: ScopedProps<RootProps<I>>) => {
  const menuScope = useMenuScope(__scopeCombobox);
  const [isOpen, setIsOpen] = useControllableState({
    prop: open,
    onChange: onOpenChange,
    defaultProp: defaultOpen,
  });

  const onIsOpenChange = useCallback<Exclude<UseComboboxProps<I>['onIsOpenChange'], undefined>>(
    ({ isOpen }) => setIsOpen(isOpen),
    [setIsOpen],
  );

  const comboboxContextValue = useCombobox<I>({
    isOpen,
    onIsOpenChange,
    ...hookProps,
  });

  return (
    <MenuPrimitive.Root {...{ open: isOpen, onOpenChange: setIsOpen, dir, modal }} {...menuScope}>
      <InputRoot id={id}>
        <ComboboxProvider scope={__scopeCombobox} {...comboboxContextValue}>
          {children}
        </ComboboxProvider>
      </InputRoot>
    </MenuPrimitive.Root>
  );
};

Root.displayName = COMBOBOX_NAME;

// Anchor

type AnchorProps = MenuAnchorProps;

const Anchor = MenuPrimitive.Anchor;

// Input

const COMBOBOX_INPUT_NAME = 'Combobox__Input';

type InputProps = TextInputProps;

const Input = forwardRef<HTMLInputElement, ScopedProps<InputProps>>(({ __scopeCombobox, ...props }, forwardedRef) => {
  const { getInputProps } = useComboboxContext(COMBOBOX_INPUT_NAME, __scopeCombobox);

  return <TextInput {...props} {...getInputProps({ ref: forwardedRef, ...props })} />;
});

Input.displayName = COMBOBOX_INPUT_NAME;

// Label

const COMBOBOX_LABEL_NAME = 'Combobox__Label';

type LabelProps = InputLabelProps;

const Label = forwardRef<HTMLLabelElement, ScopedProps<LabelProps>>(({ __scopeCombobox, ...props }, forwardedRef) => {
  const { getLabelProps } = useComboboxContext(COMBOBOX_LABEL_NAME, __scopeCombobox);

  return <InputLabel {...props} {...getLabelProps({ ref: forwardedRef, ...props })} />;
});

Label.displayName = COMBOBOX_LABEL_NAME;

// Trigger

const COMBOBOX_TRIGGER_NAME = 'Combobox__OpenTrigger';

type TriggerProps = ComponentPropsWithRef<typeof Primitive.button> & { asChild?: boolean };

const Trigger = forwardRef<HTMLButtonElement, ScopedProps<TriggerProps>>(
  ({ __scopeCombobox, asChild, ...props }, forwardedRef) => {
    const { getToggleButtonProps } = useComboboxContext(COMBOBOX_TRIGGER_NAME, __scopeCombobox);

    const Root = asChild ? Slot : Primitive.button;
    return <Root {...props} {...getToggleButtonProps({ ref: forwardedRef, ...props })} />;
  },
);

Trigger.displayName = COMBOBOX_TRIGGER_NAME;

// Content of the menu

const COMBOBOX_CONTENT_NAME = 'Combobox_Content';

type ContentProps = MenuContentProps;

const Content = forwardRef<HTMLDivElement, ScopedProps<ContentProps>>(({ __scopeCombobox, ...props }, forwardedRef) => {
  const { getMenuProps } = useComboboxContext(COMBOBOX_CONTENT_NAME, __scopeCombobox);

  return <MenuPrimitive.Content {...props} {...getMenuProps({ ...props, ref: forwardedRef })} />;
});

Content.displayName = COMBOBOX_CONTENT_NAME;

// Items in the menu

const COMBOBOX_ITEM_NAME = 'Combobox_Item';

type ItemProps<I = any> = MenuItemProps & GetItemPropsOptions<I>;

const Item = forwardRef<HTMLDivElement, ScopedProps<ItemProps>>(({ __scopeCombobox, ...props }, forwardedRef) => {
  const { getItemProps } = useComboboxContext(COMBOBOX_ITEM_NAME, __scopeCombobox);

  return <MenuPrimitive.Item {...props} {...getItemProps({ ...props, ref: forwardedRef })} />;
});

// Exports

export { Root, Anchor, Input, Label, Content, Item, useComboboxContext };

export type { RootProps, AnchorProps, InputProps, LabelProps, ContentProps, ItemProps };
