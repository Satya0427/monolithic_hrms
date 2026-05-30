import { async_error_handler } from "../../../common/utils/async_error_handler";
import { LOOKUP_MODEL } from "../../../common/schemas/lookups/lookup.schema";
import { apiDataResponse, apiResponse } from "../../../common/utils/api_response";

const getLookupsByCategory = async (req: any, res: any) => {
    const { category_code } = req.params;
    const organization_id = req.user?.organization_id; // optional

    const lookups = await LOOKUP_MODEL.find({
        category_code: category_code.toUpperCase(),
        is_active: true,
        is_deleted: false,
    })
        .sort({ sort_order: 1 })
        .select("lookup_key lookup_value -_id");

    res.status(200).json(apiDataResponse(200, 'Success', lookups));
};

const getBulkLookups = async_error_handler(async (req: any, res: any) => {
    try {
        const { categories } = req.body;

        // ===== Validate Input =====
        if (!Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json(apiResponse(400, "categories array is required"));
        }

        // Normalize categories
        const normalizedCategories = categories.map((c: string) =>
            c.trim().toUpperCase()
        );

        // ===== Aggregate Lookups =====
        const lookups = await LOOKUP_MODEL.aggregate([
            {
                $match: {
                    category_code: { $in: normalizedCategories },
                }
            },
            {
                $sort: { sort_order: 1 }
            },
            {
                $group: {
                    _id: "$category_code",
                    values: {
                        $push: {
                            lookup_key: "$lookup_key",
                            lookup_value: "$lookup_value",
                            is_default: "$is_default",
                            metadata: "$metadata"
                        }
                    }
                }
            }
        ]);

        // ===== Transform Response =====
        const response = lookups.reduce((acc: any, cur: any) => {
            acc[cur._id] = cur.values;
            return acc;
        }, {});

        res.status(200).json(apiDataResponse(200, 'Success', response));

    } catch (error) {
        console.error("getBulkLookups error:", error);
        return res.status(500).json(apiResponse(500, "Failed to fetch lookups"));
    }
});


export {
    getLookupsByCategory,
    getBulkLookups
}
