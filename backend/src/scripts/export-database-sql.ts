import fs from 'fs';
import path from 'path';
import { connectDB, getPool, closeDB } from '../config/db';

function formatSqlValue(val: unknown, dataType: string): string {
  if (val === null || val === undefined) return 'NULL';
  const dt = dataType.toLowerCase();

  if (dt === 'bit') {
    return val ? '1' : '0';
  }
  if (['int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'float', 'real', 'money', 'smallmoney'].includes(dt)) {
    const num = Number(val);
    return Number.isFinite(num) ? String(num) : 'NULL';
  }
  if (dt === 'date') {
    const d = val instanceof Date ? val.toISOString().slice(0, 10) : String(val).slice(0, 10);
    return `'${d.replace(/'/g, "''")}'`;
  }
  if (dt.includes('time') && !dt.includes('datetime')) {
    if (val instanceof Date) {
      return `'${val.toISOString().slice(11, 19)}'`;
    }
    return `'${String(val).replace(/'/g, "''")}'`;
  }
  if (dt.includes('datetime')) {
    const d = val instanceof Date ? val.toISOString().replace('T', ' ').replace('Z', '') : String(val);
    return `'${d.replace(/'/g, "''")}'`;
  }
  if (dt === 'uniqueidentifier') {
    return `'${String(val).replace(/'/g, "''")}'`;
  }
  if (Buffer.isBuffer(val)) {
    return `0x${val.toString('hex')}`;
  }
  const str = String(val).replace(/'/g, "''");
  if (dt.startsWith('n')) {
    return `N'${str}'`;
  }
  return `'${str}'`;
}

function formatColumnType(col: {
  data_type: string;
  max_length: number;
  precision: number;
  scale: number;
}): string {
  const dt = col.data_type.toLowerCase();
  if (['nvarchar', 'nchar'].includes(dt)) {
    const len = col.max_length === -1 ? 'MAX' : String(col.max_length / 2);
    return `[${dt}](${len})`;
  }
  if (['varchar', 'char', 'varbinary', 'binary'].includes(dt)) {
    const len = col.max_length === -1 ? 'MAX' : String(col.max_length);
    return `[${dt}](${len})`;
  }
  if (['decimal', 'numeric'].includes(dt)) {
    return `[${dt}](${col.precision}, ${col.scale})`;
  }
  if (['datetime2', 'time', 'datetimeoffset'].includes(dt)) {
    return `[${dt}](${col.scale})`;
  }
  return `[${dt}]`;
}

async function exportDatabaseSql() {
  await connectDB();
  const pool = getPool();

  const lines: string[] = [];
  const nowStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  lines.push(`USE [master]`);
  lines.push(`GO`);
  lines.push(`/****** Object:  Database [DaNangGo]    Script Date: ${nowStr} ******/`);
  lines.push(`IF DB_ID(N'DaNangGo') IS NULL`);
  lines.push(`BEGIN`);
  lines.push(`    CREATE DATABASE [DaNangGo];`);
  lines.push(`END`);
  lines.push(`GO`);
  lines.push(`USE [DaNangGo]`);
  lines.push(`GO`);
  lines.push(`SET ANSI_NULLS ON`);
  lines.push(`GO`);
  lines.push(`SET QUOTED_IDENTIFIER ON`);
  lines.push(`GO`);
  lines.push(``);

  // 1. Custom schemas (e.g. planner)
  const schemasRes = await pool.request().query<{ name: string }>(`
    SELECT name FROM sys.schemas
    WHERE name NOT IN ('dbo', 'guest', 'INFORMATION_SCHEMA', 'sys')
      AND name NOT LIKE 'db_%'
    ORDER BY name
  `);
  for (const s of schemasRes.recordset) {
    lines.push(`IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'${s.name}')`);
    lines.push(`    EXEC(N'CREATE SCHEMA [${s.name}]');`);
    lines.push(`GO`);
  }
  lines.push(``);

  // 2. Get all user tables
  const tablesRes = await pool.request().query<{
    object_id: number;
    schema_name: string;
    table_name: string;
  }>(`
    SELECT t.object_id, s.name AS schema_name, t.name AS table_name
    FROM sys.tables t
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE t.is_ms_shipped = 0 AND t.name <> 'sysdiagrams'
    ORDER BY s.name, t.name
  `);

  const tables = tablesRes.recordset;

  // 3. Columns per table
  const colsRes = await pool.request().query<{
    object_id: number;
    column_id: number;
    column_name: string;
    data_type: string;
    max_length: number;
    precision: number;
    scale: number;
    is_nullable: boolean;
    is_identity: boolean;
    seed_value: number | null;
    increment_value: number | null;
    is_computed: boolean;
    computed_definition: string | null;
    is_persisted: boolean | null;
  }>(`
    SELECT
      c.object_id,
      c.column_id,
      c.name AS column_name,
      ty.name AS data_type,
      c.max_length,
      c.precision,
      c.scale,
      c.is_nullable,
      c.is_identity,
      CAST(ic.seed_value AS int) AS seed_value,
      CAST(ic.increment_value AS int) AS increment_value,
      c.is_computed,
      cc.definition AS computed_definition,
      cc.is_persisted
    FROM sys.columns c
    JOIN sys.types ty ON ty.user_type_id = c.user_type_id
    LEFT JOIN sys.identity_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    LEFT JOIN sys.computed_columns cc ON cc.object_id = c.object_id AND cc.column_id = c.column_id
    ORDER BY c.object_id, c.column_id
  `);

  // Primary Keys & Unique Constraints
  const kcRes = await pool.request().query<{
    parent_object_id: number;
    constraint_name: string;
    type: string;
    type_desc: string;
    cols: string;
  }>(`
    SELECT
      kc.parent_object_id,
      kc.name AS constraint_name,
      kc.type,
      i.type_desc,
      STRING_AGG(QUOTENAME(c.name) + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE ' ASC' END, ', ')
        WITHIN GROUP (ORDER BY ic.key_ordinal) AS cols
    FROM sys.key_constraints kc
    JOIN sys.indexes i ON i.object_id = kc.parent_object_id AND i.index_id = kc.unique_index_id
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    GROUP BY kc.parent_object_id, kc.name, kc.type, i.type_desc
    ORDER BY kc.parent_object_id, kc.type, kc.name
  `);

  for (const tbl of tables) {
    const tblCols = colsRes.recordset.filter((c) => c.object_id === tbl.object_id);
    const tblKcs = kcRes.recordset.filter((k) => k.parent_object_id === tbl.object_id);

    lines.push(`/****** Object:  Table [${tbl.schema_name}].[${tbl.table_name}] ******/`);
    lines.push(`IF OBJECT_ID(N'[${tbl.schema_name}].[${tbl.table_name}]', N'U') IS NULL`);
    lines.push(`BEGIN`);
    lines.push(`CREATE TABLE [${tbl.schema_name}].[${tbl.table_name}](`);

    const itemDefs: string[] = [];
    for (const c of tblCols) {
      if (c.is_computed && c.computed_definition) {
        itemDefs.push(`\t[${c.column_name}] AS ${c.computed_definition}${c.is_persisted ? ' PERSISTED' : ''}`);
      } else {
        const typeStr = formatColumnType(c);
        const idStr = c.is_identity ? ` IDENTITY(${c.seed_value ?? 1},${c.increment_value ?? 1})` : '';
        const nullStr = c.is_nullable ? 'NULL' : 'NOT NULL';
        itemDefs.push(`\t[${c.column_name}] ${typeStr}${idStr} ${nullStr}`);
      }
    }

    for (const kc of tblKcs) {
      const kind = kc.type === 'PK' ? 'PRIMARY KEY' : 'UNIQUE';
      itemDefs.push(`\tCONSTRAINT [${kc.constraint_name}] ${kind} ${kc.type_desc} (${kc.cols})`);
    }

    lines.push(itemDefs.join(',\n'));
    lines.push(`) ON [PRIMARY]`);
    lines.push(`END`);
    lines.push(`GO`);
  }

  lines.push(``);

  // 4. Default Constraints
  const dfRes = await pool.request().query<{
    schema_name: string;
    table_name: string;
    constraint_name: string;
    column_name: string;
    definition: string;
  }>(`
    SELECT
      s.name AS schema_name,
      t.name AS table_name,
      dc.name AS constraint_name,
      c.name AS column_name,
      dc.definition
    FROM sys.default_constraints dc
    JOIN sys.tables t ON t.object_id = dc.parent_object_id
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE t.is_ms_shipped = 0 AND t.name <> 'sysdiagrams'
    ORDER BY s.name, t.name, c.column_id
  `);

  for (const df of dfRes.recordset) {
    lines.push(`IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE parent_object_id = OBJECT_ID(N'[${df.schema_name}].[${df.table_name}]') AND parent_column_id = COLUMNPROPERTY(OBJECT_ID(N'[${df.schema_name}].[${df.table_name}]'), N'${df.column_name}', 'ColumnId'))`);
    lines.push(`    ALTER TABLE [${df.schema_name}].[${df.table_name}] ADD CONSTRAINT [${df.constraint_name}] DEFAULT ${df.definition} FOR [${df.column_name}];`);
    lines.push(`GO`);
  }

  lines.push(``);

  // 5. Non-constraint Indexes
  const ixRes = await pool.request().query<{
    schema_name: string;
    table_name: string;
    index_name: string;
    is_unique: boolean;
    type_desc: string;
    filter_definition: string | null;
    key_cols: string;
  }>(`
    SELECT
      s.name AS schema_name,
      t.name AS table_name,
      i.name AS index_name,
      i.is_unique,
      i.type_desc,
      i.filter_definition,
      STRING_AGG(QUOTENAME(c.name) + CASE WHEN ic.is_descending_key = 1 THEN ' DESC' ELSE ' ASC' END, ', ')
        WITHIN GROUP (ORDER BY ic.key_ordinal) AS key_cols
    FROM sys.indexes i
    JOIN sys.tables t ON t.object_id = i.object_id
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.is_included_column = 0
    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE t.is_ms_shipped = 0 AND t.name <> 'sysdiagrams'
      AND i.is_primary_key = 0 AND i.is_unique_constraint = 0 AND i.name IS NOT NULL
    GROUP BY s.name, t.name, i.name, i.is_unique, i.type_desc, i.filter_definition
    ORDER BY s.name, t.name, i.name
  `);

  for (const ix of ixRes.recordset) {
    const uniq = ix.is_unique ? 'UNIQUE ' : '';
    const whereClause = ix.filter_definition ? ` WHERE ${ix.filter_definition}` : '';
    lines.push(`IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[${ix.schema_name}].[${ix.table_name}]') AND name = N'${ix.index_name}')`);
    lines.push(`    CREATE ${uniq}${ix.type_desc} INDEX [${ix.index_name}] ON [${ix.schema_name}].[${ix.table_name}] (${ix.key_cols})${whereClause};`);
    lines.push(`GO`);
  }

  lines.push(``);

  // 6. Export Data for All Tables (Topological Order + Disable FKs/Checks during insert)
  lines.push(`-- =====================================================================`);
  lines.push(`-- DỮ LIỆU ĐẦY ĐỦ (SEED DATA CHO TOÀN BỘ BẢNG TRONG DANANGGO)`);
  lines.push(`-- =====================================================================`);

  // Order tables so parent tables come first
  const priorityOrder = [
    'dbo.roles',
    'dbo.districts',
    'dbo.cuisines',
    'dbo.tastes',
    'dbo.attraction_categories',
    'dbo.amenities',
    'dbo.transport_modes',
    'dbo.vip_tiers',
    'dbo.vip_offers',
    'dbo.subscription_packages',
    'dbo.users',
    'dbo.partner_profiles',
    'dbo.user_preferences',
    'dbo.user_memberships',
    'dbo.places',
    'dbo.accommodations',
    'dbo.room_types',
    'dbo.accommodation_amenities',
    'dbo.restaurants',
    'dbo.menu_items',
    'dbo.menu_item_tastes',
    'dbo.attractions',
    'dbo.place_images',
    'dbo.opening_hours',
    'dbo.reviews',
    'dbo.review_images',
    'dbo.user_favorites',
    'dbo.itinerary_catalog_places',
    'dbo.itinerary_catalog_preferences',
    'dbo.itineraries',
    'dbo.itinerary_days',
    'dbo.itinerary_items',
    'dbo.itinerary_alternatives',
    'planner.itineraries',
    'dbo.surveys',
    'dbo.survey_questions',
    'dbo.survey_question_options',
    'dbo.survey_responses',
    'dbo.survey_answers',
    'dbo.events',
  ];

  const sortedTables = [...tables].sort((a, b) => {
    const keyA = `${a.schema_name}.${a.table_name}`;
    const keyB = `${b.schema_name}.${b.table_name}`;
    const idxA = priorityOrder.indexOf(keyA);
    const idxB = priorityOrder.indexOf(keyB);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return keyA.localeCompare(keyB);
  });

  let totalExportedRows = 0;

  for (const tbl of sortedTables) {
    const tblCols = colsRes.recordset.filter((c) => c.object_id === tbl.object_id && !c.is_computed);
    if (tblCols.length === 0) continue;

    const hasIdentity = tblCols.some((c) => c.is_identity);
    const colListSql = tblCols.map((c) => `[${c.column_name}]`).join(', ');
    const orderByCol = tblCols[0].column_name;

    const dataRes = await pool.request().query<Record<string, unknown>>(
      `SELECT ${colListSql} FROM [${tbl.schema_name}].[${tbl.table_name}] ORDER BY [${orderByCol}]`
    );

    if (dataRes.recordset.length === 0) continue;

    totalExportedRows += dataRes.recordset.length;
    lines.push(``);
    lines.push(`/****** Data for Table [${tbl.schema_name}].[${tbl.table_name}] (${dataRes.recordset.length} rows) ******/`);
    if (hasIdentity) {
      lines.push(`SET IDENTITY_INSERT [${tbl.schema_name}].[${tbl.table_name}] ON;`);
      lines.push(`GO`);
    }

    for (const row of dataRes.recordset) {
      const vals = tblCols.map((c) => formatSqlValue(row[c.column_name], c.data_type)).join(', ');
      lines.push(`INSERT INTO [${tbl.schema_name}].[${tbl.table_name}] (${colListSql}) VALUES (${vals});`);
    }

    if (hasIdentity) {
      lines.push(`GO`);
      lines.push(`SET IDENTITY_INSERT [${tbl.schema_name}].[${tbl.table_name}] OFF;`);
    }
    lines.push(`GO`);
  }

  lines.push(``);
  lines.push(`-- =====================================================================`);
  lines.push(`-- RÀNG BUỘC KHÓA NGOẠI (FOREIGN KEYS) & CHECK CONSTRAINTS`);
  lines.push(`-- =====================================================================`);

  // 7. Foreign Keys
  const fkRes = await pool.request().query<{
    schema_name: string;
    table_name: string;
    fk_name: string;
    ref_schema: string;
    ref_table: string;
    delete_referential_action_desc: string;
    parent_cols: string;
    ref_cols: string;
  }>(`
    SELECT
      s1.name AS schema_name,
      t1.name AS table_name,
      fk.name AS fk_name,
      s2.name AS ref_schema,
      t2.name AS ref_table,
      fk.delete_referential_action_desc,
      STRING_AGG(QUOTENAME(c1.name), ', ') WITHIN GROUP (ORDER BY fkc.constraint_column_id) AS parent_cols,
      STRING_AGG(QUOTENAME(c2.name), ', ') WITHIN GROUP (ORDER BY fkc.constraint_column_id) AS ref_cols
    FROM sys.foreign_keys fk
    JOIN sys.tables t1 ON t1.object_id = fk.parent_object_id
    JOIN sys.schemas s1 ON s1.schema_id = t1.schema_id
    JOIN sys.tables t2 ON t2.object_id = fk.referenced_object_id
    JOIN sys.schemas s2 ON s2.schema_id = t2.schema_id
    JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    JOIN sys.columns c1 ON c1.object_id = fkc.parent_object_id AND c1.column_id = fkc.parent_column_id
    JOIN sys.columns c2 ON c2.object_id = fkc.referenced_object_id AND c2.column_id = fkc.referenced_column_id
    WHERE t1.is_ms_shipped = 0 AND t1.name <> 'sysdiagrams'
    GROUP BY s1.name, t1.name, fk.name, s2.name, t2.name, fk.delete_referential_action_desc
    ORDER BY s1.name, t1.name, fk.name
  `);

  for (const fk of fkRes.recordset) {
    const onDelete =
      fk.delete_referential_action_desc === 'CASCADE'
        ? ' ON DELETE CASCADE'
        : fk.delete_referential_action_desc === 'SET_NULL'
          ? ' ON DELETE SET NULL'
          : '';
    lines.push(`IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID(N'[${fk.schema_name}].[${fk.table_name}]') AND name = N'${fk.fk_name}')`);
    lines.push(`    ALTER TABLE [${fk.schema_name}].[${fk.table_name}] WITH CHECK ADD CONSTRAINT [${fk.fk_name}] FOREIGN KEY(${fk.parent_cols}) REFERENCES [${fk.ref_schema}].[${fk.ref_table}] (${fk.ref_cols})${onDelete};`);
    lines.push(`GO`);
  }

  // 8. Check Constraints
  const ckRes = await pool.request().query<{
    schema_name: string;
    table_name: string;
    ck_name: string;
    definition: string;
  }>(`
    SELECT
      s.name AS schema_name,
      t.name AS table_name,
      ck.name AS ck_name,
      ck.definition
    FROM sys.check_constraints ck
    JOIN sys.tables t ON t.object_id = ck.parent_object_id
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE t.is_ms_shipped = 0 AND t.name <> 'sysdiagrams'
    ORDER BY s.name, t.name, ck.name
  `);

  for (const ck of ckRes.recordset) {
    lines.push(`IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID(N'[${ck.schema_name}].[${ck.table_name}]') AND name = N'${ck.ck_name}')`);
    lines.push(`    ALTER TABLE [${ck.schema_name}].[${ck.table_name}] WITH CHECK ADD CONSTRAINT [${ck.ck_name}] CHECK ${ck.definition};`);
    lines.push(`GO`);
  }

  lines.push(``);
  lines.push(`USE [master]`);
  lines.push(`GO`);
  lines.push(`ALTER DATABASE [DaNangGo] SET READ_WRITE`);
  lines.push(`GO`);

  const outPath = path.resolve(__dirname, '../../../database.sql');
  fs.writeFileSync(outPath, lines.join('\r\n'), 'utf8');
  console.log(`✅ Đã xuất thành công file database.sql (${lines.length} dòng, ${totalExportedRows} bản ghi dữ liệu) tại: ${outPath}`);

  await closeDB();
}

exportDatabaseSql().catch((err) => {
  console.error('Lỗi khi xuất database.sql:', err);
  process.exit(1);
});
