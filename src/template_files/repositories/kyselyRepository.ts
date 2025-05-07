import type { Static } from "@sinclair/typebox";
import { db } from "../../db";
import type {
	__TABLE__Base,
	__TABLE__Create,
} from "../../schemas/__TABLE__";

export const getAll__CAP_TABLE__ = async () => {
	const data = await db.selectFrom("__TABLE__").selectAll().execute();

	return data;
};

export const get__CAP_TABLE__ById = async (id: string) => {
	const data = await db
		.selectFrom("__TABLE__")
		.selectAll()
		.where("id", "=", id)
		.executeTakeFirst();

	return data;
};

export const create__CAP_TABLE__ = async (
	body: Static<typeof __TABLE__Create>,
) => {
	const data = await db
		.insertInto("__TABLE__")
		.values(body)
		.returning("id")
		.executeTakeFirst();

	return data;
};

export const update__CAP_TABLE__ = async (
	id: string,
	body: Partial<Static<typeof __TABLE__Base>>,
) => {
	const data = await db
		.updateTable("__TABLE__")
		.set(body)
		.where("id", "=", id)
		.returning("id")
		.executeTakeFirst();

	return data;
};

export const delete__CAP_TABLE__ = async (id: string) => {
	const data = await db
		.deleteFrom("__TABLE__")
		.where("id", "=", id)
		.returning("id")
		.executeTakeFirst();

	return data;
};
