import { type Static, Type } from "@sinclair/typebox";
import { Elysia, t } from "elysia";
import { db } from "../../db";

const __TABLE__Schema = t.Object({
	__COLUMNS__,
});

const __TABLE__Router = new Elysia({ prefix: "/__TABLE__" })
	.get(
		"/",
		async () => {
			try {
				const __TABLE__ = await db
					.selectFrom("__RAW_TABLE__")
					.selectAll()
					.execute();
				return { __TABLE__ };
			} catch (error) {
				console.error("Error fetching __TABLE__:", error);
				return { error: "Failed to fetch __TABLE__" };
			}
		},
		{},
	)
	.get(
		"/:id",
		async ({ params }) => {
			try {
				const __TABLE__ = await db
					.selectFrom("__RAW_TABLE__")
					.selectAll()
					.where("id", "=", params.id)
					.executeTakeFirst();

				if (!__TABLE__) {
					return { error: "__TABLE__ not found" };
				}

				return { __TABLE__ };
			} catch (error) {
				console.error("Error fetching __TABLE__:", error);
				return { error: "Failed to fetch __TABLE__" };
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	)
	.post(
		"/",
		async ({ body }: { body: Static<typeof __TABLE__Schema> }) => {
			try {
				const __TABLE__ = await db
					.insertInto("__RAW_TABLE__")
					.values(body)
					.returning("id")
					.executeTakeFirst();

				return { message: "__TABLE__ created successfully", id: __TABLE__?.id };
			} catch (error) {
				console.error("Error creating __TABLE__:", error);
				return { error: "Failed to create __TABLE__" };
			}
		},
		{
			body: __TABLE__Schema,
		},
	)
	.put(
		"/:id",
		async ({
			params,
			body,
		}: {
			params: { id: string };
			body: Partial<Static<typeof __TABLE__Schema>>;
		}) => {
			try {
				await db
					.updateTable("__RAW_TABLE__")
					.set(body)
					.where("id", "=", params.id)
					.execute();

				return { message: "__TABLE__ updated successfully" };
			} catch (error) {
				console.error("Error updating __TABLE__:", error);
				return { error: "Failed to update __TABLE__" };
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Partial(__TABLE__Schema),
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			try {
				await db
					.deleteFrom("__RAW_TABLE__")
					.where("id", "=", params.id)
					.execute();

				return { message: "__TABLE__ deleted successfully" };
			} catch (error) {
				console.error("Error deleting __TABLE__:", error);
				return { error: "Failed to delete __TABLE__" };
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	);

export default __TABLE__Router;
