import { SQL } from "bun";

export const db = new SQL({
	url: "postgres://your_user:your_password@localhost:5432/your_database",
	max: 20,
	idleTimeout: 30,
	maxLifetime: 0,
	connectionTimeout: 30,
});

export const getTablesAndColumns = async () => {
	const result = await db`
    SELECT 
      t.table_name,
      c.column_name,
      c.data_type
    FROM 
      information_schema.tables AS t
    LEFT JOIN 
      information_schema.columns AS c
    ON 
      t.table_name = c.table_name
    WHERE 
      t.table_schema = 'public'
    AND 
      t.table_type = 'BASE TABLE'
    ORDER BY 
      t.table_name, c.ordinal_position;
  `;

	// Group results by table
	const tables: Record<
		string,
		{ columns: Array<{ column_name: string; data_type: string }> }
	> = {};

	for (const row of result) {
		const { table_name, column_name, data_type } = row;
		if (!tables[table_name]) {
			tables[table_name] = { columns: [] };
		}
		if (column_name && data_type) {
			tables[table_name].columns.push({ column_name, data_type });
		}
	}

	return tables;
};

console.log(await getTablesAndColumns());