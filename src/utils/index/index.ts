import { generateElysia } from "./elysia";
import { generateExpress } from "./express";

export const generateIndexFile = async ({
	destinationFolder,
	httpServer,
	tables,
}: {
	destinationFolder: string;
	httpServer: "express" | "elysia";
	tables: Record<
		string,
		{
			columns: Array<{
				column_name: string;
				data_type: string;
				is_nullable: "YES" | "NO";
			}>;
		}
	>;
}) => {
	switch (httpServer) {
		case "express":
			await generateExpress({ destinationFolder, tables });
			break;
		case "elysia":
			await generateElysia({ destinationFolder, tables });
			break;
		default:
			throw new Error(`Unsupported HTTP server: ${httpServer}`);
	}
};
