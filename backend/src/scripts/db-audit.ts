import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { closeDB, connectDB, getPool } from '../config/db';

async function main(): Promise<void> {
  await connectDB();
  const pool = getPool();

  const tables = await pool.request().query<{
    schema_name: string;
    table_name: string;
    row_count: number;
  }>(`
    SELECT s.name AS schema_name, t.name AS table_name,
      SUM(CASE WHEN p.index_id IN (0, 1) THEN p.rows ELSE 0 END) AS row_count
    FROM sys.tables AS t
    JOIN sys.schemas AS s ON s.schema_id = t.schema_id
    LEFT JOIN sys.partitions AS p ON p.object_id = t.object_id
    GROUP BY s.name, t.name
    ORDER BY s.name, t.name
  `);
  const columns = await pool.request().query<{
    schema_name: string;
    table_name: string;
    column_name: string;
    data_type: string;
    max_length: number;
    precision_value: number;
    scale_value: number;
    is_nullable: boolean;
    is_identity: boolean;
  }>(`
    SELECT TABLE_SCHEMA AS schema_name, TABLE_NAME AS table_name,
      COLUMN_NAME AS column_name, DATA_TYPE AS data_type,
      CHARACTER_MAXIMUM_LENGTH AS max_length,
      NUMERIC_PRECISION AS precision_value, NUMERIC_SCALE AS scale_value,
      CONVERT(bit, CASE WHEN IS_NULLABLE = 'YES' THEN 1 ELSE 0 END) AS is_nullable,
      CONVERT(bit, COLUMNPROPERTY(OBJECT_ID(QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME)), COLUMN_NAME, 'IsIdentity')) AS is_identity
    FROM INFORMATION_SCHEMA.COLUMNS
    ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION
  `);
  const primaryKeys = await pool.request().query<{
    schema_name: string; table_name: string; constraint_name: string; column_name: string; key_ordinal: number;
  }>(`
    SELECT s.name AS schema_name, t.name AS table_name, kc.name AS constraint_name,
      c.name AS column_name, ic.key_ordinal
    FROM sys.key_constraints AS kc
    JOIN sys.tables AS t ON t.object_id = kc.parent_object_id
    JOIN sys.schemas AS s ON s.schema_id = t.schema_id
    JOIN sys.index_columns AS ic ON ic.object_id = t.object_id AND ic.index_id = kc.unique_index_id
    JOIN sys.columns AS c ON c.object_id = t.object_id AND c.column_id = ic.column_id
    WHERE kc.type = 'PK'
    ORDER BY s.name, t.name, kc.name, ic.key_ordinal
  `);
  const foreignKeys = await pool.request().query<{
    schema_name: string; table_name: string; constraint_name: string; column_name: string;
    referenced_schema: string; referenced_table: string; referenced_column: string;
  }>(`
    SELECT ps.name AS schema_name, pt.name AS table_name, fk.name AS constraint_name,
      pc.name AS column_name, rs.name AS referenced_schema, rt.name AS referenced_table,
      rc.name AS referenced_column
    FROM sys.foreign_keys AS fk
    JOIN sys.foreign_key_columns AS fkc ON fkc.constraint_object_id = fk.object_id
    JOIN sys.tables AS pt ON pt.object_id = fk.parent_object_id
    JOIN sys.schemas AS ps ON ps.schema_id = pt.schema_id
    JOIN sys.columns AS pc ON pc.object_id = pt.object_id AND pc.column_id = fkc.parent_column_id
    JOIN sys.tables AS rt ON rt.object_id = fk.referenced_object_id
    JOIN sys.schemas AS rs ON rs.schema_id = rt.schema_id
    JOIN sys.columns AS rc ON rc.object_id = rt.object_id AND rc.column_id = fkc.referenced_column_id
    ORDER BY ps.name, pt.name, fk.name
  `);
  const indexes = await pool.request().query<{
    schema_name: string; table_name: string; index_name: string; is_unique: boolean;
    is_primary_key: boolean; filter_definition: string | null; columns: string;
  }>(`
    SELECT s.name AS schema_name, t.name AS table_name, i.name AS index_name,
      i.is_unique, i.is_primary_key, i.filter_definition,
      STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal, ic.index_column_id) AS columns
    FROM sys.indexes AS i
    JOIN sys.tables AS t ON t.object_id = i.object_id
    JOIN sys.schemas AS s ON s.schema_id = t.schema_id
    LEFT JOIN sys.index_columns AS ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
    LEFT JOIN sys.columns AS c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.name IS NOT NULL AND i.is_hypothetical = 0
    GROUP BY s.name, t.name, i.name, i.is_unique, i.is_primary_key, i.filter_definition
    ORDER BY s.name, t.name, i.name
  `);
  const checks = await pool.request().query<{
    schema_name: string; table_name: string; constraint_name: string; definition: string;
  }>(`
    SELECT s.name AS schema_name, t.name AS table_name, cc.name AS constraint_name, cc.definition
    FROM sys.check_constraints AS cc
    JOIN sys.tables AS t ON t.object_id = cc.parent_object_id
    JOIN sys.schemas AS s ON s.schema_id = t.schema_id
    ORDER BY s.name, t.name, cc.name
  `);
  const roles = await pool.request().query<{ role_id: number; role_name: string }>(`
    SELECT role_id, role_name FROM dbo.roles ORDER BY role_id
  `);

  const formatTable = (schema: string, table: string) => `[${schema}].[${table}]`;
  const tableRows = tables.recordset;
  const columnRows = columns.recordset;
  const sections: string[] = [
    '# Database audit',
    '',
    `- Database: \`${process.env.DB_NAME || 'DaNangGo'}\``,
    `- Audited at (UTC): ${new Date().toISOString()}`,
    `- Tables discovered: ${tableRows.length}`,
    '',
    '## Tables and row counts',
    '',
    '| Table | Rows |',
    '| --- | ---: |',
    ...tableRows.map((row) => `| ${formatTable(row.schema_name, row.table_name)} | ${row.row_count} |`),
    '',
    '## Columns',
    '',
    '| Table | Column | SQL type | NULL | Identity |',
    '| --- | --- | --- | --- | --- |',
    ...columnRows.map((column) => {
      const length = column.max_length === -1 ? 'max' : column.max_length > 0 && ['nvarchar', 'nchar'].includes(column.data_type.toLowerCase()) ? column.max_length / 2 : column.max_length;
      const type = ['nvarchar', 'varchar', 'nchar', 'char', 'varbinary', 'binary'].includes(column.data_type.toLowerCase())
        ? `${column.data_type}(${length})`
        : ['decimal', 'numeric'].includes(column.data_type.toLowerCase())
          ? `${column.data_type}(${column.precision_value},${column.scale_value})`
          : column.data_type;
      return `| ${formatTable(column.schema_name, column.table_name)} | ${column.column_name} | ${type} | ${column.is_nullable ? 'YES' : 'NO'} | ${column.is_identity ? 'YES' : 'NO'} |`;
    }),
    '',
    '## Primary keys',
    '',
    ...primaryKeys.recordset.map((row) => `- ${formatTable(row.schema_name, row.table_name)}.${row.constraint_name}: \`${row.column_name}\` (ordinal ${row.key_ordinal})`),
    ...(primaryKeys.recordset.length ? [] : ['- None found.']),
    '',
    '## Foreign keys',
    '',
    ...foreignKeys.recordset.map((row) => `- ${formatTable(row.schema_name, row.table_name)}.${row.constraint_name}: \`${row.column_name}\` → ${formatTable(row.referenced_schema, row.referenced_table)}.\`${row.referenced_column}\``),
    ...(foreignKeys.recordset.length ? [] : ['- None found.']),
    '',
    '## Indexes',
    '',
    ...indexes.recordset.map((row) => `- ${formatTable(row.schema_name, row.table_name)}.${row.index_name}: ${row.is_unique ? 'UNIQUE ' : ''}${row.is_primary_key ? 'PRIMARY KEY ' : ''}(${row.columns || ''})${row.filter_definition ? ` WHERE ${row.filter_definition}` : ''}`),
    ...(indexes.recordset.length ? [] : ['- None found.']),
    '',
    '## CHECK constraints',
    '',
    ...checks.recordset.map((row) => `- ${formatTable(row.schema_name, row.table_name)}.${row.constraint_name}: \`${row.definition}\``),
    ...(checks.recordset.length ? [] : ['- None found.']),
    '',
    '## Auth design comparison and decisions',
    '',
  ];

  const tableByName = new Map(tableRows.map((row) => [row.table_name.toLowerCase(), row]));
  const authTargetColumns: Record<string, string[]> = {
    users: ['user_id', 'public_id', 'role_id (or role)', 'full_name', 'email', 'phone', 'password_hash', 'status', 'email_verified', 'failed_login_count', 'locked_until', 'last_login_at', 'created_at', 'updated_at'],
    roles: ['role_id', 'role name/code column (inspect listed columns)'],
    partner_profiles: ['partner_id', 'user_id', 'business_name', 'service_type', 'tax_code', 'address', 'approval_status', 'created_at'],
    refresh_tokens: ['token_id', 'user_id', 'token_hash', 'expires_at', 'revoked_at', 'user_agent', 'ip', 'created_at'],
    password_reset_tokens: ['id', 'user_id', 'token_hash', 'expires_at', 'used_at', 'created_at'],
  };
  for (const [tableName, targets] of Object.entries(authTargetColumns)) {
    const existing = tableByName.has(tableName);
    const existingColumns = new Set(columnRows.filter((c) => c.table_name.toLowerCase() === tableName).map((c) => c.column_name.toLowerCase()));
    sections.push(`- \`${tableName}\`: ${existing ? 'exists' : 'missing table'}.`);
    if (existing) {
      const missing = targets.filter((target) => !target.includes('(') && !existingColumns.has(target.toLowerCase()));
      sections.push(`  - Missing target columns: ${missing.length ? missing.map((name) => `\`${name}\``).join(', ') : 'none by name; review listed types and role mapping.'}`);
    } else {
      sections.push(`  - Target columns to create if still needed after review: ${targets.map((name) => `\`${name}\``).join(', ')}.`);
    }
  }
  sections.push(
    '',
    '### Role mapping',
    '',
    `Existing roles (${roles.recordset.length} rows): ${roles.recordset.map((role) => `\`${role.role_id}: ${role.role_name}\``).join(', ') || 'none'}.`,
    '',
    'The existing `users.role_id` FK to `roles.role_id` must remain. Map USER/PARTNER/ADMIN to role IDs 1/2/3 via case-insensitive `role_name`; do not add duplicate role rows. Existing labels are title case (`User`, `Partner`, `Admin`).',
    '',
    '### Compatibility notes',
    '',
    '- `users.email` is currently `varchar(150) NOT NULL` with a UNIQUE index; `phone` is nullable. This matches the updated product decision: email is required at registration, phone is optional, and the existing email column/index can remain unchanged. The migration adds a filtered UNIQUE index for phone.',
    '- `users.status` is `varchar(20) NOT NULL` and its current CHECK allows only ACTIVE/LOCKED. The target adds PENDING; the constraint must be adjusted additively and checked against current data before the application uses it.',
    '- `partner_profiles` already exists and has a UNIQUE `user_id` plus FK to users, existing approval status constraint, and `business_name NVARCHAR(75)` (shorter than target). Preserve those constraints and use additive changes only after reviewing type/length needs.',
    '- Registration requires an email and accepts an optional phone number. Login lookup must accept either `users.email` or `users.phone`; no additional email column or placeholder email is needed.',
    '- `bookings.user_id` exists but no declared FK to `users` was found; leave that relationship untouched during auth schema work unless separately approved and audited.',
    '- Both `users` and `partner_profiles` currently have zero rows; `roles` has three rows. Existing dependent FK tables are preserved as listed below.',
    '',
    '### Existing user references',
    '',
    ...foreignKeys.recordset.filter((row) => row.referenced_table.toLowerCase() === 'users').map((row) => `- ${formatTable(row.schema_name, row.table_name)}.${row.column_name} → users.${row.referenced_column} (${row.constraint_name})`),
    ...(foreignKeys.recordset.some((row) => row.referenced_table.toLowerCase() === 'users') ? [] : ['- No declared foreign keys to users were found.']),
    '',
    '## TypeScript baseline (before audit files)',
    '',
    '### Backend',
    '',
    'Command: `npx tsc --noEmit` (backend). Failed before changes. Existing diagnostics include TS1295/TS1287 because CommonJS package/module settings conflict with `verbatimModuleSyntax`; places.routes.ts also has TS1484 type-only import errors and TS2345 for `req.params.id` (`string | string[] | undefined`).',
    '',
    '### Frontend',
    '',
    'Command: `npx tsc --noEmit` (frontend). Could not complete: no usable local TypeScript executable was available, and npx attempted to fetch package `tsc` from npm, which failed with EACCES. No files were modified at the time of either baseline check.',
    '',
    '## Phase 0 verification after fixes',
    '',
    'Backend `npx tsc --noEmit` now passes. Minimal fixes: `backend/tsconfig.json` enables Node ambient types and disables `verbatimModuleSyntax`, which conflicted with the existing CommonJS package; `places.routes.ts` validates the Express 5 route parameter before parsing it. These do not change runtime module format.',
    '',
    'Frontend typecheck remains unavailable because `frontend/node_modules` is absent and npm registry access failed with EACCES; install dependencies in the frontend workspace before running its compiler.',
    '',
  );

  const outputPath = resolve(process.cwd(), '../docs/database-audit.md');
  await writeFile(outputPath, `${sections.join('\n')}\n`, 'utf8');
  console.log(`Database audit written to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error('Database audit failed:', error);
  process.exitCode = 1;
}).finally(async () => {
  await closeDB();
});
