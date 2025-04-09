import { Elysia, t } from "elysia";
import { Type, type Static } from "@sinclair/typebox";
import { db } from "../../db";

const projectSchema = t.Object({
	name: t.String(),
	description: t.Nullable(t.String()),
	status: t.Union([
		t.Literal("active"),
		t.Literal("on_hold"),
		t.Literal("completed"),
	]),
	start_date: t.Date(),
	end_date: t.Nullable(t.Date()),
	created_by: t.String(),
	updated_by: t.String(),
});

const projectsRouter = new Elysia({ prefix: "/projects" })
	.get(
		"/",
		async () => {
			try {
				const projects = await db.selectFrom("projects").selectAll().execute();
				return { projects };
			} catch (error) {
				console.error("Error fetching projects:", error);
				return { error: "Failed to fetch projects" };
			}
		},
		{},
	)
	.get(
		"/:id",
		async ({ params }) => {
			try {
				const project = await db
					.selectFrom("projects")
					.selectAll()
					.where("id", "=", params.id)
					.executeTakeFirst();

				if (!project) {
					return { error: "Project not found" };
				}

				return { project };
			} catch (error) {
				console.error("Error fetching project:", error);
				return { error: "Failed to fetch project" };
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
		async ({ body }: { body: Static<typeof projectSchema> }) => {
			try {
				const newProject = await db
					.insertInto("projects")
					.values(body)
					.returning("id")
					.executeTakeFirst();

				return { message: "Project created successfully", id: newProject?.id };
			} catch (error) {
				console.error("Error creating project:", error);
				return { error: "Failed to create project" };
			}
		},
		{
			body: projectSchema,
		},
	)
	.put(
		"/:id",
		async ({
			params,
			body,
		}: {
			params: { id: string };
			body: Partial<Static<typeof projectSchema>>;
		}) => {
			try {
				await db
					.updateTable("projects")
					.set(body)
					.where("id", "=", params.id)
					.execute();

				return { message: "Project updated successfully" };
			} catch (error) {
				console.error("Error updating project:", error);
				return { error: "Failed to update project" };
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Partial(projectSchema),
		},
	)
	.delete(
		"/:id",
		async ({ params }) => {
			try {
				await db.deleteFrom("projects").where("id", "=", params.id).execute();

				return { message: "Project deleted successfully" };
			} catch (error) {
				console.error("Error deleting project:", error);
				return { error: "Failed to delete project" };
			}
		},
		{
			params: t.Object({
				id: t.String(),
			}),
		},
	);

export default projectsRouter;
