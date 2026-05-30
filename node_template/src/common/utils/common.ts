import bcrypt from 'bcrypt';
import logger from '../../config/logger';
import { MESSAGES } from './messages';
import { LOOKUP_MODEL } from '../schemas/lookups/lookup.schema';
import { EMPLOYEE_PROFILE_MODEL } from '../schemas/Employees/employee_onboarding.schema';

/* Encrypt/Hash Password */
async function encryptPassword(password: string): Promise<string> {
    try {
        const salt = await bcrypt.genSalt(12);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        logger.error('Error in Catch of encryptPassword()', { error });
        throw new Error(MESSAGES.INTERNAL_SERVER_ERROR);
    }
}

/* Compare Password Hash */
async function verifyPassword(input_password: string, encrypted_password: string): Promise<boolean> {
    try {
        const isMatch = await bcrypt.compare(input_password, encrypted_password);
        return isMatch ? true : false;
    } catch (error) {
        logger.error('Error in Catch of verifyPassword()', { error });
        throw new Error(MESSAGES.INTERNAL_SERVER_ERROR);
    }
}

const getLookupsByCategory = async (req: any, res: any) => {
    const { category_code } = req.params;
    const organization_id = req.user?.organization_id; // optional

    const lookups = await LOOKUP_MODEL.find({
        category_code: category_code.toUpperCase(),
        is_active: true,
        is_deleted: false,
        $or: [
            { scope: "PLATFORM" },
            {
                scope: "ORGANIZATION",
                organization_id
            }
        ]
    })
        .sort({ sort_order: 1 })
        .select("lookup_key lookup_value -_id");

    res.status(200).json({
        success: true,
        data: lookups
    });
};

const getManagerAndRoleByEmployeeUuid = async (empId: string, organization_id?: string) => {
    const employee = await EMPLOYEE_PROFILE_MODEL.findOne({
        _id: empId,
        is_active: true,
        is_deleted: false,
        organization_id
    }).select('job_details.reported_to job_details.role_id').lean();

    const manager_id = (employee as any)?.job_details?.reported_to || null;
    const role_id = (employee as any)?.job_details?.role_id || null;

    return { manager_id, role_id };
};

export { encryptPassword, verifyPassword, getLookupsByCategory, getManagerAndRoleByEmployeeUuid };
