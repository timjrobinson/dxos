//
// Copyright 2023 DXOS.org
//

import React, { type FC, useEffect, useMemo, useState } from 'react';

import { useFilteredObjects } from '@braneframe/plugin-search';
import { Table as TableType } from '@braneframe/types';
import { PublicKey } from '@dxos/keys';
import { Expando, type TypedObject, Schema, getSpaceForObject, useQuery } from '@dxos/react-client/echo';
import { DensityProvider } from '@dxos/react-ui';
import { Table, type TableDef } from '@dxos/react-ui-table';

// TODO(burdon): Remove deps.
import { getSchema, schemaPropMapper, TableColumnBuilder } from '../../schema';
import { TableSettings } from '../TableSettings';

// TODO(burdon): Factor out echo fn to update when changed.
const reactDeps = (...obj: TypedObject[]) => {
  return JSON.stringify(obj);
};

export type ObjectTableProps = {
  table: TableType;
};

export const ObjectTable: FC<ObjectTableProps> = ({ table }) => {
  const [, forceUpdate] = useState({});
  const space = getSpaceForObject(table);
  const objects = useQuery<TypedObject>(
    space,
    // TODO(dmaretskyi): Reference comparison broken by deepsignal wrapping.
    (object) => table.schema && (object.__schema as any)?.id === table.schema.id,
    // TODO(burdon): Toggle deleted.
    {},
    [table.schema],
  );

  const [newObject, setNewObject] = useState(new Expando({}, { schema: table.schema }));
  const rows = [...useFilteredObjects(objects), newObject];

  const tables = useQuery<TableType>(space, TableType.filter());
  const updateSchemaProp = (update: Schema.Prop) => {
    const idx = table.schema?.props.findIndex((prop) => prop.id === update.id);
    if (idx !== -1) {
      const current = table.schema?.props[idx];
      table.schema?.props.splice(idx, 1, { ...current, ...update });
    } else {
      table.schema?.props.push(update);
    }
  };

  const updateTableProp = (update: TableType.Prop) => {
    const idx = table.props?.findIndex((prop) => prop.id === update.id);
    if (idx !== -1) {
      const current = table.props![idx];
      table.props.splice(idx, 1, { ...current, ...update });
    } else {
      table.props.push(update);
    }
  };

  const columns = useMemo(() => {
    if (!space || !table.schema || !tables.length) {
      return [];
    }

    const tableDefs: TableDef[] = tables
      .filter((table) => table.schema)
      .map((table) => ({
        id: table.schema.id,
        name: table.schema.typename ?? table.title,
        columns: table.schema.props.map(schemaPropMapper(table)),
      }));

    const builder = new TableColumnBuilder(tableDefs, table.schema?.id, space!, {
      onColumnUpdate: (id, column) => {
        const { type, refTable, refProp, digits, label } = column;
        updateTableProp({ id, refProp, label });
        updateSchemaProp({
          id,
          type: getSchema(type),
          ref: type === 'ref' ? tables.find((table) => table.schema.id === refTable)?.schema : undefined,
          digits,
        });
        forceUpdate({});
      },
      onColumnDelete: (id) => {
        const idx = table.schema?.props.findIndex((prop) => prop.id === id);
        if (idx !== -1) {
          table.schema?.props.splice(idx, 1);
          forceUpdate({});
        }
      },
      onRowUpdate: (object, prop, value) => {
        object[prop] = value;
        if (object === newObject) {
          // TODO(burdon): Silent exception if try to add plain object directly.
          space!.db.add(newObject);
          setNewObject(new Expando({}, { schema: table.schema }));
        }
      },
      onRowDelete: (object) => {
        // TODO(burdon): Rename delete.
        space!.db.remove(object);
      },
    });

    return builder.createColumns();
  }, [space, tables, reactDeps(table, table.schema), newObject]);

  const handleColumnResize = (state: Record<string, number>) => {
    Object.entries(state).forEach(([id, size]) => {
      updateTableProp({ id, size });
    });
  };

  const debug = false;

  const [showSettings, setShowSettings] = useState(false);
  useEffect(() => {
    setShowSettings(!table.schema);
  }, [table]);

  if (!space) {
    return null;
  }

  const handleClose = (success: boolean) => {
    // TODO(burdon): If cancel then undo create?
    if (!success) {
      return;
    }

    if (!table.schema) {
      table.schema = space.db.add(
        new Schema({
          // TODO(burdon): How should user update schema?
          typename: `example.com/schema/${PublicKey.random().truncate()}`,
          props: [
            {
              id: 'title',
              type: Schema.PropType.STRING,
            },
          ],
        }),
      );
    }

    setShowSettings(false);
  };

  if (showSettings) {
    const { objects: schemas } = space.db.query(Schema.filter());
    return <TableSettings open={showSettings} table={table} schemas={schemas} onClose={handleClose} />;
  }

  return (
    <DensityProvider density='fine'>
      <div className='flex flex-col grow overflow-hidden'>
        <Table<TypedObject>
          keyAccessor={(row) => row.id ?? '__new'}
          columns={columns}
          data={rows}
          border
          onColumnResize={handleColumnResize}
          role='grid'
        />
        {debug && (
          <div className='flex text-xs'>
            <pre className='flex-1'>{JSON.stringify(table, undefined, 2)}</pre>
            <pre className='flex-1'>{JSON.stringify(table.schema, undefined, 2)}</pre>
          </div>
        )}
      </div>
    </DensityProvider>
  );
};
