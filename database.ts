import { Pool } from "pg";

// Create a connection pool using pg
export const db = new Pool({
	user: "your_user",
	password: "your_password",
	host: "localhost",
	port: 5432,
	database: "your_database",
	max: 20,
	idleTimeoutMillis: 30000, // 30 seconds in milliseconds
	connectionTimeoutMillis: 30000, // 30 seconds in milliseconds
});

export const getTablesAndColumns = async () => {
	const query = `
    SELECT 
      t.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable
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

	// Use pg's query method instead of tagged template literals
	const { rows } = await db.query(query);

	// Group results by table
	const tables: Record<
		string,
		{
			columns: Array<{
				column_name: string;
				data_type: string;
				is_nullable: "YES" | "NO";
			}>;
		}
	> = {};

	for (const row of rows) {
		const { table_name, column_name, data_type, is_nullable } = row;
		if (!tables[table_name]) {
			tables[table_name] = { columns: [] };
		}
		if (column_name && data_type) {
			tables[table_name].columns.push({ column_name, data_type, is_nullable });
		}
	}

	return tables;
};
