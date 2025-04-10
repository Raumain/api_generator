import type { Static } from "@sinclair/typebox";
import { Elysia, t } from "elysia";
import {
	create__CAP_TABLE__,
	delete__CAP_TABLE__,
	getAll__CAP_TABLE__,
	get__CAP_TABLE__ById,
	update__CAP_TABLE__,
} from "./repository";

export const __TABLE__Schema = t.Object({
	__COLUMNS__,
});

const __TABLE__Router = new Elysia({ prefix: "/__TABLE__" })
	.get(
		"/",
		async () => {
			try {
				const __TABLE__ = await getAll__CAP_TABLE__();
				return { __TABLE__ };
			} catch (error) {
				console.error("Error fetching __TABLE__:", error);
				return { error: "Failed to fetch __TABLE__" };
			}
		},
		{
			response: {
				200: t.Object({
					__TABLE__: t.Array(__TABLE__Schema),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	)
	.get(
		"/:id",
		async ({ params }) => {
			try {
				const __TABLE__ = await get__CAP_TABLE__ById(params.id);

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
			response: {
				200: t.Object({
					__TABLE__: __TABLE__Schema,
				}),
				404: t.Object({
					error: t.String(),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	)
	.post(
		"/",
		async ({ body }: { body: Static<typeof __TABLE__Schema> }) => {
			try {
				const __TABLE__ = await create__CAP_TABLE__(body);

				if (!__TABLE__) {
					return { error: "__TABLE__ not created" };
				}

				return { id: __TABLE__.id };
			} catch (error) {
				console.error("Error creating __TABLE__:", error);
				return { error: "Failed to create __TABLE__" };
			}
		},
		{
			body: __TABLE__Schema,
			response: {
				200: t.Object({
					id: t.String(),
				}),
				400: t.Object({
					error: t.String(),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
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
				const __TABLE__ = await update__CAP_TABLE__(params.id, body);
				if (!__TABLE__) {
					return { error: "__TABLE__ not found" };
				}

				return { id: __TABLE__.id };
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
			response: {
				200: t.Object({
					id: t.String(),
				}),
				400: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			try {
				const __TABLE__ = await delete__CAP_TABLE__(params.id);
				if (!__TABLE__) {
					return { error: "__TABLE__ not found" };
				}

				return { id: __TABLE__.id };
			} catch (error) {
				console.error("Error deleting __TABLE__:", error);
				return { error: "Failed to delete __TABLE__" };
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			response: {
				200: t.Object({
					id: t.String(),
				}),
				400: t.Object({
					error: t.String(),
				}),
				404: t.Object({
					error: t.String(),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	);

export default __TABLE__Router;
