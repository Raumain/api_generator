import express, { type Request, type Response, type Router } from "express";
import { param, validationResult } from "express-validator";
import {
	create__CAP_TABLE__,
	delete__CAP_TABLE__,
	getAll__CAP_TABLE__,
	get__CAP_TABLE__ById,
	update__CAP_TABLE__,
} from "./repository";

// Define schema fields that will be used for validation
const __TABLE__ValidationRules = {
	__COLUMNS__,
};

const __TABLE__Router: Router = express.Router();

// GET all
__TABLE__Router.get("/", async (req: Request, res: Response) => {
	try {
		const __TABLE__ = await getAll__CAP_TABLE__();
		return res.status(200).json({ __TABLE__ });
	} catch (error) {
		console.error("Error fetching __TABLE__:", error);
		return res.status(500).json({ error: "Failed to fetch __TABLE__" });
	}
});

// GET by ID
__TABLE__Router.get(
	"/:id",
	[param("id").isString()],
	async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const __TABLE__ = await get__CAP_TABLE__ById(req.params.id);

			if (!__TABLE__) {
				return res.status(404).json({ error: "__TABLE__ not found" });
			}

			return res.status(200).json({ __TABLE__ });
		} catch (error) {
			console.error("Error fetching __TABLE__:", error);
			return res.status(500).json({ error: "Failed to fetch __TABLE__" });
		}
	},
);

// POST new
__TABLE__Router.post("/", async (req: Request, res: Response) => {
	try {
		const __TABLE__ = await create__CAP_TABLE__(req.body);

		if (!__TABLE__) {
			return res.status(400).json({ error: "__TABLE__ not created" });
		}

		return res.status(200).json({ id: __TABLE__.id });
	} catch (error) {
		console.error("Error creating __TABLE__:", error);
		return res.status(500).json({ error: "Failed to create __TABLE__" });
	}
});

// PUT update
__TABLE__Router.put(
	"/:id",
	[param("id").isString()],
	async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const __TABLE__ = await update__CAP_TABLE__(req.params.id, req.body);
			if (!__TABLE__) {
				return res.status(404).json({ error: "__TABLE__ not found" });
			}

			return res.status(200).json({ id: __TABLE__.id });
		} catch (error) {
			console.error("Error updating __TABLE__:", error);
			return res.status(500).json({ error: "Failed to update __TABLE__" });
		}
	},
);

// DELETE
__TABLE__Router.delete(
	"/:id",
	[param("id").isString()],
	async (req: Request, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const __TABLE__ = await delete__CAP_TABLE__(req.params.id);
			if (!__TABLE__) {
				return res.status(404).json({ error: "__TABLE__ not found" });
			}

			return res.status(200).json({ id: __TABLE__.id });
		} catch (error) {
			console.error("Error deleting __TABLE__:", error);
			return res.status(500).json({ error: "Failed to delete __TABLE__" });
		}
	},
);

export default __TABLE__Router;
