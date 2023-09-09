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

import { InputRoot, InputRootProps, TextInput, TextInputProps, Label, LabelProps } from '@dxos/react-input';

// Root

const COMBOBOX_NAME = 'Combobox';

type ScopedProps<P> = P & { __scopeCombobox?: Scope };

type ComboboxContextValue<I = any> = UseComboboxReturnValue<I>;

const useMenuScope = createMenuScope();
const [createComboboxContext] = createContextScope(COMBOBOX_NAME, [createMenuScope]);
const [ComboboxProvider, useComboboxContext] = createComboboxContext<ComboboxContextValue>(COMBOBOX_NAME);

type ComboboxRootProps<I> = Omit<UseComboboxProps<I>, 'isOpen' | 'defaultIsOpen' | 'initialIsOpen' | 'onIsOpenChange'> &
  MenuProps &
  Pick<InputRootProps, 'id'> & {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?(open: boolean): void;
  };

const ComboboxRoot = <I = any,>({
  __scopeCombobox,
  id,
  children,
  open,
  onOpenChange,
  defaultOpen,
  dir,
  modal,
  ...hookProps
}: ScopedProps<ComboboxRootProps<I>>) => {
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

ComboboxRoot.displayName = COMBOBOX_NAME;

// Anchor

type ComboboxAnchorProps = MenuAnchorProps;

const ComboboxAnchor = MenuPrimitive.Anchor;

// Input

const COMBOBOX_INPUT_NAME = 'Combobox__Input';

type ComboboxInputProps = TextInputProps;

const ComboboxInput = forwardRef<HTMLInputElement, ScopedProps<ComboboxInputProps>>(
  ({ __scopeCombobox, ...props }, forwardedRef) => {
    const { getInputProps } = useComboboxContext(COMBOBOX_INPUT_NAME, __scopeCombobox);

    return <TextInput {...props} {...getInputProps({ ref: forwardedRef, ...props })} />;
  },
);

ComboboxInput.displayName = COMBOBOX_INPUT_NAME;

// Label

const COMBOBOX_LABEL_NAME = 'Combobox__Label';

type ComboboxLabelProps = LabelProps;

const ComboboxLabel = forwardRef<HTMLLabelElement, ScopedProps<ComboboxLabelProps>>(
  ({ __scopeCombobox, ...props }, forwardedRef) => {
    const { getLabelProps } = useComboboxContext(COMBOBOX_LABEL_NAME, __scopeCombobox);

    return <Label {...props} {...getLabelProps({ ref: forwardedRef, ...props })} />;
  },
);

ComboboxLabel.displayName = COMBOBOX_LABEL_NAME;

// Trigger

const COMBOBOX_TRIGGER_NAME = 'Combobox__OpenTrigger';

type ComboboxTriggerProps = ComponentPropsWithRef<typeof Primitive.button> & { asChild?: boolean };

const ComboboxTrigger = forwardRef<HTMLButtonElement, ScopedProps<ComboboxTriggerProps>>(
  ({ __scopeCombobox, asChild, ...props }, forwardedRef) => {
    const { getToggleButtonProps } = useComboboxContext(COMBOBOX_TRIGGER_NAME, __scopeCombobox);

    const Root = asChild ? Slot : Primitive.button;
    return <Root {...props} {...getToggleButtonProps({ ref: forwardedRef, ...props })} />;
  },
);

ComboboxTrigger.displayName = COMBOBOX_TRIGGER_NAME;

// Content of the menu

const COMBOBOX_CONTENT_NAME = 'Combobox_Content';

type ComboboxContentProps = MenuContentProps;

const ComboboxContent = forwardRef<HTMLDivElement, ScopedProps<ComboboxContentProps>>(
  ({ __scopeCombobox, ...props }, forwardedRef) => {
    const { getMenuProps } = useComboboxContext(COMBOBOX_CONTENT_NAME, __scopeCombobox);

    return <MenuPrimitive.Content {...props} {...getMenuProps({ ...props, ref: forwardedRef })} />;
  },
);

ComboboxContent.displayName = COMBOBOX_CONTENT_NAME;

// Items in the menu

const COMBOBOX_ITEM_NAME = 'Combobox_Item';

type ComboboxItemProps<I = any> = MenuItemProps & GetItemPropsOptions<I>;

const ComboboxItem = forwardRef<HTMLDivElement, ScopedProps<ComboboxItemProps>>(
  ({ __scopeCombobox, ...props }, forwardedRef) => {
    const { getItemProps } = useComboboxContext(COMBOBOX_ITEM_NAME, __scopeCombobox);

    return <MenuPrimitive.Item {...props} {...getItemProps({ ...props, ref: forwardedRef })} />;
  },
);

// Exports

export {
  ComboboxRoot,
  ComboboxAnchor,
  ComboboxInput,
  ComboboxLabel,
  ComboboxContent,
  ComboboxItem,
  useComboboxContext,
};

export type {
  ComboboxRootProps,
  ComboboxAnchorProps,
  ComboboxInputProps,
  ComboboxLabelProps,
  ComboboxContentProps,
  ComboboxItemProps,
};
