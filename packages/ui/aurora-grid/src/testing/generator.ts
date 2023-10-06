//
// Copyright 2023 DXOS.org
//

// TODO(wittjosiah): Copied from @dxos/plugin-debug.

import type { Faker } from '@faker-js/faker';

import { Schema as SchemaType, Space } from '@dxos/client/echo';
import { Expando } from '@dxos/echo-schema';
import { invariant } from '@dxos/invariant';

export const Status = ['pending', 'active', 'done'];
export const Priority = [1, 2, 3, 4, 5];

export class Generator {
  private _faker!: Faker;

  constructor(private readonly _space: Space) {
    invariant(this._space);
  }

  async initialize() {
    // TODO(burdon): Async import Generator instead?
    const { faker } = await import('@faker-js/faker');
    this._faker = faker;
    return this;
  }

  // TODO(burdon): Silent fail if try to set __foo property.
  createProjects(options = { projects: 20 }) {
    // TODO(burdon): Get or create schema.
    const project = new SchemaType({
      props: [
        {
          id: 'title',
          type: SchemaType.PropType.STRING,
        },
        {
          id: 'repo',
          type: SchemaType.PropType.STRING,
        },
        {
          id: 'status',
          type: SchemaType.PropType.STRING,
        },
        {
          id: 'priority',
          type: SchemaType.PropType.NUMBER,
        },
      ],
    });

    const projects = this._faker.helpers
      .uniqueArray(this._faker.commerce.productName, options.projects)
      .map((title: string) => {
        // TODO(burdon): Create batch.
        return this._space.db.add(
          new Expando(
            {
              title,
              repo: this._faker.datatype.boolean({ probability: 0.3 }) ? this._faker.internet.url() : undefined,
              status: this._faker.helpers.arrayElement(Status),
              priority: this._faker.helpers.arrayElement(Priority),
            },
            { schema: project },
          ),
        );
      });

    return { project, projects };
  }
}
