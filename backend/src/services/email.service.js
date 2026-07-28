import { supabase } from '../config/supabase.js';
import emailjs from '@emailjs/nodejs';
import dotenv from 'dotenv';
dotenv.config();

export const sendScheduleNotification = async (payload) => {
  let emailStatus = '';

  try {
    // Fetch student emails for the batch
    const { data: students, error: studentError } = await supabase
      .from('student_profiles')
      .select('profiles(email)')
      .eq('batch_id', payload.batch_id);

    if (!studentError && students && students.length > 0) {
      const serviceId = process.env.EMAILJS_SERVICE_ID;
      const templateId = process.env.EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.EMAILJS_PUBLIC_KEY;
      const privateKey = process.env.EMAILJS_PRIVATE_KEY;

      if (serviceId && templateId && publicKey && privateKey) {
        const emailPromises = students.map(student => {
          const email = student.profiles?.email;
          if (!email) return Promise.resolve();
          
          const templateParams = {
            to_email: email,
            module_name: payload.module_name,
            date: payload.specific_date,
            start_time: payload.start_time,
            end_time: payload.end_time
          };

          return emailjs.send(serviceId, templateId, templateParams, {
            publicKey,
            privateKey
          });
        });

        await Promise.allSettled(emailPromises);
        emailStatus = ' Notification emails were sent to the students in the batch.';
        return { success: true, message: emailStatus };
      } else {
        emailStatus = ' (EmailJS credentials not configured, so emails were skipped.)';
        return { success: false, message: emailStatus };
      }
    } else {
      emailStatus = ' No students found in the batch to notify.';
      return { success: false, message: emailStatus };
    }
  } catch (emailErr) {
    console.error('EmailJS Error:', emailErr);
    emailStatus = ' However, there was an error sending notification emails.';
    return { success: false, message: emailStatus };
  }
};
