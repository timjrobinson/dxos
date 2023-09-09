//
// Copyright 2023 DXOS.org
//

import { faker } from '@faker-js/faker';
import React, { useEffect, useState } from 'react';

import '@dxosTheme';

import { Combobox, ComboboxInputProps, ComboboxRootProps } from './Combobox';

type Item = { id: string; text: string };

type StorybookComboboxProps = ComboboxRootProps & Pick<ComboboxInputProps, 'placeholder' | 'onChange'>;

const StorybookCombobox = ({ placeholder, onChange, ...rootProps }: StorybookComboboxProps) => {
  return (
    <Combobox.Root {...rootProps}>
      <Combobox.Label>Label</Combobox.Label>
      <Combobox.Anchor>
        <Combobox.Input {...{ placeholder }} />
        <Combobox.Trigger />
      </Combobox.Anchor>
      <Combobox.Content>
        {rootProps.items.map((item, index) => {
          return (
            <Combobox.Item key={item.id} item={item} index={index}>
              {item.text}
            </Combobox.Item>
          );
        })}
      </Combobox.Content>
    </Combobox.Root>
  );
};

const items: Item[] = faker.helpers
  .uniqueArray(faker.definitions.animal.fish, 100)
  .sort()
  .map((text) => ({
    id: faker.string.uuid(),
    text,
  }));

export default {
  component: StorybookCombobox,
  args: {
    adapter: (item: Item) => ({ id: item.id, text: item.text }),
  },
  decorators: [
    (Story: any) => (
      <div className='flex flex-col items-center h-screen w-full overflow-hidden'>
        <div className='flex w-60 m-8 bg-white'>
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    placeholder: 'Select...',
    onChange: (item: any) => console.log('onChange', item),
    items,
  },
};

export const Empty = {
  args: {},
};

export const TypeAhead = () => {
  const [text, setText] = useState<string>();
  const [selected, setSelected] = useState<Item | null>(null);
  const [matching, setMatching] = useState<Item[]>([]);

  useEffect(() => {
    console.log({ text });
    setMatching(
      text?.length ? items.filter((item) => item.text?.length && item.text?.toLowerCase().includes(text)) : [],
    );
  }, [text]);

  return (
    <div className='flex flex-col w-full bg-neutral-100 dark:bg-neutral-800'>
      <StorybookCombobox
        placeholder={'Select...'}
        items={matching}
        selectedItem={selected}
        onSelectedItemChange={({ selectedItem }) => setSelected(selectedItem)}
        onChange={({ target: { value } }) => setText(value?.toLowerCase())}
      />

      <div className='mt-16 p-2 font-mono text-xs truncate'>{selected?.id ?? 'NULL'}</div>
    </div>
  );
};
