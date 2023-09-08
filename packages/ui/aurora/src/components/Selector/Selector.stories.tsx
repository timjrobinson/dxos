//
// Copyright 2023 DXOS.org
//

import { faker } from '@faker-js/faker';
import React, { useEffect, useState } from 'react';

import '@dxosTheme';

import { Selector, SelectorValue } from './Selector';

const values: SelectorValue[] = faker.helpers
  .uniqueArray(faker.definitions.animal.fish, 100)
  .sort()
  .map((text) => ({
    id: faker.string.uuid(),
    text,
  }));

export default {
  component: Selector,
  decorators: [
    (Story: any) => (
      <div className='flex flex-col items-center h-screen w-full overflow-hidden'>
        <div className='flex w-[250px] m-8 bg-white'>
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
    onChange: (value: any) => console.log('onChange', value),
    values,
  },
};

export const Empty = {
  args: {},
};

export const TypeAhead = () => {
  const [text, setText] = useState<string>();
  const [selected, setSelected] = useState<SelectorValue>();
  const [matching, setMatching] = useState<SelectorValue[]>();
  useEffect(() => {
    console.log('???');
    setMatching(
      text?.length ? values.filter((value) => value.text?.length && value.text?.toLowerCase().includes(text)) : [],
    );
  }, [text]);

  return (
    <Selector
      placeholder={'Select...'}
      values={matching}
      value={selected}
      onChange={setSelected}
      onInputChange={(text) => setText(text?.toLowerCase())}
    />
  );
};
