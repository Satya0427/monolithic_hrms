import cron from 'node-cron';
import mongoose from 'mongoose';
import { LEAVE_POLICY_MODEL } from '../common/schemas/leave-attendance/leave-configs/leave-policies.schema';
import { EMPLOYEE_PROFILE_MODEL } from '../common/schemas/Employees/employee_onboarding.schema';
import { LEAVE_LEDGER_MODEL } from '../common/schemas/leave-attendance/leave-configs/leave-ledger.schema';

cron.schedule('*/2 * * * *', async () => {
    console.log(' Leave Credit Cron Started');

    const today = new Date();
    const accrualDate = new Date(today.getFullYear(), today.getMonth(), 1);

    const policies = await LEAVE_POLICY_MODEL.find({
        status: 'ACTIVE',
        effective_from: { $lte: accrualDate },
        $or: [
            { effective_to: { $gte: accrualDate } },
            { effective_to: { $exists: false } },
            { effective_to: null }
        ]
    });

    for (const policy of policies) {
        for (const rule of policy.leave_rules) {
            if (rule?.accrual?.frequency !== 'MONTHLY') continue;

            const employees = await EMPLOYEE_PROFILE_MODEL.find({
                organization_id: policy.organization_id,
                is_active: true,
                'job_details.joiningDate': { $lte: accrualDate }
            });

            for (const employee of employees) {
                const creditAmount = rule?.accrual?.credit_amount;
                if (creditAmount == null) continue;

                const exists = await LEAVE_LEDGER_MODEL.findOne({
                    employee_uuid: new mongoose.Types.ObjectId(employee._id),
                    leave_type_id: new mongoose.Types.ObjectId(rule.leave_type_id),
                    entry_type: 'CREDIT',
                    effective_date: accrualDate
                });

                if (exists) continue;

                await LEAVE_LEDGER_MODEL.create({
                    organization_id: new mongoose.Types.ObjectId(policy.organization_id),
                    employee_uuid: new mongoose.Types.ObjectId(employee._id),
                    leave_type_id: new mongoose.Types.ObjectId(rule.leave_type_id),
                    entry_type: 'CREDIT',
                    quantity: creditAmount,
                    effective_date: accrualDate,
                    reference_type: 'POLICY_ACCRUAL',
                    reference_id: new mongoose.Types.ObjectId(policy._id)
                });
            }
        }
    }

    console.log('✅ Leave Credit Cron Completed');
});
