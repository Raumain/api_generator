import { Elysia, t } from "elysia";
import { __TABLE__Base, __TABLE__Create } from "../../schemas/__TABLE__";
import {
	create__CAP_TABLE__,
	delete__CAP_TABLE__,
	getAll__CAP_TABLE__,
	get__CAP_TABLE__ById,
	update__CAP_TABLE__,
} from "./repository";


const __TABLE__Router = new Elysia({ prefix: "/__TABLE__" })
	.get(
		"/",
		async ({ status }) => {
			try {
				const __TABLE__ = await getAll__CAP_TABLE__();
				return { __TABLE__ };
			} catch (error) {
				console.error("Error fetching __TABLE__:", error);
				return status(500, { error: "Failed to fetch __TABLE__" });
			}
		},
		{
			response: {
				200: t.Object({
					__TABLE__: t.Array(__TABLE__Base),
				}),
				500: t.Object({
					error: t.String(),
				}),
			},
		},
	)
	.get(
		"/:id",
		async ({ params, status }) => {
			try {
				const __TABLE__ = await get__CAP_TABLE__ById(params.id);

				if (!__TABLE__) {
					return status(404, { error: "__TABLE__ not found" });
				}

				return { __TABLE__ };
			} catch (error) {
				console.error("Error fetching __TABLE__:", error);
				return status(500, { error: "Failed to fetch __TABLE__" });
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			response: {
				200: t.Object({
					__TABLE__: __TABLE__Base,
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
		async ({ body, status }) => {
			try {
				const __TABLE__ = await create__CAP_TABLE__(body);

				if (!__TABLE__) {
					return status(409, { error: "__TABLE__ not created" });
				}

				return { id: __TABLE__.id };
			} catch (error) {
				console.error("Error creating __TABLE__:", error);
				return status(500, { error: "Failed to create __TABLE__" });
			}
		},
		{
			body: __TABLE__Create,
			response: {
				200: t.Object({
					id: t.String(),
				}),
				409: t.Object({
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
		async ({ params, body, status }) => {
			try {
				const __TABLE__ = await update__CAP_TABLE__(params.id, body);
				if (!__TABLE__) {
					return status(404, { error: "__TABLE__ not found" });
				}

				return { id: __TABLE__.id };
			} catch (error) {
				console.error("Error updating __TABLE__:", error);
				return status(500, { error: "Failed to update __TABLE__" });
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Partial(__TABLE__Base),
			response: {
				200: t.Object({
					id: t.String(),
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
		async ({ params, status }) => {
			try {
				const __TABLE__ = await delete__CAP_TABLE__(params.id);
				if (!__TABLE__) {
					return status(404, { error: "__TABLE__ not found" });
				}

				return { id: __TABLE__.id };
			} catch (error) {
				console.error("Error deleting __TABLE__:", error);
				return status(500, { error: "Failed to delete __TABLE__" });
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
