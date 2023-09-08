//
// Copyright 2023 DXOS.org
//

import { CaretDown, CaretUp } from '@phosphor-icons/react';
import { useCombobox } from 'downshift';
import React from 'react';

import { useThemeContext } from '../../hooks';
import { ThemedClassName } from '../../util';
import { Button } from '../Buttons';
import { Input } from '../Input';

type ValueAdapter<T> = (value: T) => { id: string; text: string };

type SelectorProps<T> = ThemedClassName<{
  placeholder?: string;
  values?: T[]; // TODO(burdon): Rename items.
  value?: T;
  adapter: ValueAdapter<T>;
  onChange?: (value: T | undefined) => void;
  onInputChange?: (text?: string) => void;
}>;

/**
 * Type-ahead selector.
 * https://www.downshift-js.com
 */
// TODO(burdon): Rename Combobox?
// TODO(burdon): Break into components (only way to override classes without slots)?
//   Similarly, provide a simplified "no frills" wrapped form of <Select />, etc.
const Selector = <T,>({
  classNames,
  placeholder,
  values,
  value,
  adapter,
  onChange,
  onInputChange,
}: SelectorProps<T>) => {
  const { tx } = useThemeContext();

  // https://www.downshift-js.com/use-combobox
  // prettier-ignore
  const {
    isOpen,
    selectedItem,
    highlightedIndex,
    getInputProps,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
  } = useCombobox<T>({
    items: values ?? [],
    selectedItem: value ?? null,
    itemToString: (selectedItem) => selectedItem ? adapter(selectedItem).text : '',
    onInputValueChange: ({ inputValue }) => onInputChange?.(inputValue),
    onSelectedItemChange: ({ selectedItem }) => onChange?.(selectedItem === null ? undefined : selectedItem),
  });

  // TODO(burdon): Each cell is re-rendered.
  // console.log(selectedItem);

  // TODO(burdon): Use portal to match width and height?
  // TODO(burdon): Show as DIV unless focused (performance and to see ellipsis values)?
  return (
    <div className={tx('selector.root', 'selector__root', {}, classNames)}>
      {/* TODO(burdon): Should all classes (even purely functional ones) move into theme? */}
      <div className='flex items-center gap-1'>
        <Input.Root>
          <Input.TextInput
            {...getInputProps()}
            placeholder={placeholder}
            variant='subdued'
            classNames={tx('selector.input', 'selector__input', {}, classNames)}
          />
        </Input.Root>
        <Button
          {...getToggleButtonProps()}
          aria-label='toggle menu'
          variant='ghost'
          classNames={tx('selector.button', 'selector__button', {}, classNames)}
        >
          {/* TODO(burdon): SelectPrimitive.Icon? */}
          {(isOpen && <CaretUp />) || <CaretDown />}
        </Button>
      </div>

      {/* TODO(burdon): Use Popover to manage viewport width, etc? */}
      {/* <Popover.Root open={isOpen}> */}
      {/*  <Popover.Content> */}
      {/*    <Popover.Viewport> */}
      {/* ERROR: @react-refresh:267 downshift: The ref prop "ref" from getMenuProps was not applied correctly on your element. */}
      <ul
        {...getMenuProps()}
        className={tx('selector.content', 'selector__content', { isOpen: isOpen && values?.length }, classNames)}
      >
        {values?.map((value, index) => {
          const { id, text } = adapter(value);
          return (
            <li
              key={id}
              data-selected={selectedItem === value ? 'true' : undefined}
              data-highlighted={highlightedIndex === index ? 'true' : undefined}
              {...getItemProps({
                index,
                item: value,
                className: tx('selector.item', 'selector__item', {}, classNames),
              })}
            >
              {text}
            </li>
          );
        })}
      </ul>
      {/* </Popover.Viewport> */}
      {/* </Popover.Content> */}
      {/* </Popover.Root> */}
    </div>
  );
};

export { Selector };

export type { SelectorProps };
