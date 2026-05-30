import cron from 'node-cron';
import { ATTENDANCE_RECORD_MODEL } from '../common/schemas/leave-attendance/attendance/attendance_records.schema';
import { EMPLOYEE_PROFILE_MODEL } from '../common/schemas/Employees/employee_onboarding.schema';

cron.schedule('*/2 * * * *', async () => {
    console.log("Midnight Attendance Cron Running");
    const today = startOfDay(new Date());
    const employees = await EMPLOYEE_PROFILE_MODEL.find({
        is_active: true
    });
    for (const emp of employees) {
        const record = await ATTENDANCE_RECORD_MODEL.findOne({
            employee_uuid: emp._id,
            attendance_date: today
        });
        if (!record) {
            await ATTENDANCE_RECORD_MODEL.create({
                organization_id: emp.organization_id,
                employee_uuid: emp._id,
                attendance_date: today,
                status: 'ABSENT'
            });
        }
    }
    console.log("✅ Midnight Attendance Cron Completed");
});

const startOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};