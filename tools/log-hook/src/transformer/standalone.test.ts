import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import * as ts from 'typescript';
import { transformSourceFile } from './source-transformer';

const filename = join(__dirname, '../../../../packages/core/echo/echo-db/src/packlets/space/replicator-plugin.ts');
const source = readFileSync(filename).toString()

console.log(filename);

const sourceFile = ts.createSourceFile(
  filename,
  source,
  ts.ScriptTarget.ESNext,
  false,
  ts.ScriptKind.TS
)

const transformed = transformSourceFile(sourceFile, (ts as any).nullTransformationContext);

const output = ts.createPrinter().printFile(transformed);

console.log(output)