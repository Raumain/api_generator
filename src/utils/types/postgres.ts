export function pgTypeToTypebox(pgType: string) {
	try {
		switch (pgType) {
			case "uuid":
			case "character varying":
			case "varchar":
			case "text":
			case "bytea":
				return "t.String()";
			case "integer":
			case "smallint":
			case "bigint":
				return "t.Integer()";
			case "numeric":
			case "real":
			case "double precision":
				return "t.Number()";
			case "boolean":
				return "t.Boolean()";
			case "date":
			case "timestamp without time zone":
			case "timestamp with time zone":
				return 't.String({ format: "date-time" })';
			case "json":
			case "jsonb":
				return "t.Any()";
			default:
				console.warn(
					`Unknown PostgreSQL type: ${pgType}, defaulting to t.Unknown()`,
				);
				return "t.Unknown()";
		}
	} catch (error) {
		console.error(
			`Error converting PostgreSQL type ${pgType}: ${error instanceof Error ? error.message : String(error)}`,
		);
		throw error;
	}
}

export function pgTypeToTs(pgType: string): string {
	switch (pgType) {
		case "uuid":
		case "character varying":
		case "varchar":
		case "text":
		case "char":
		case "name":
			return "string";
		case "integer":
		case "smallint":
		case "bigint":
		case "real":
		case "numeric":
		case "double precision":
			return "number";
		case "boolean":
			return "boolean";
		case "json":
		case "jsonb":
			return "any";
		case "date":
		case "timestamp without time zone":
		case "timestamp with time zone":
			return "string"; // Or consider 'Date' if you parse it
		case "bytea":
			return "Buffer";
		default:
			return "unknown";
	}
}
