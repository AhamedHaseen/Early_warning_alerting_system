import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { supabase } from '../config/supabase.js';
import dotenv from 'dotenv';
import { sendScheduleNotification } from './email.service.js';
dotenv.config();

// The NVIDIA NIM base URL uses the OpenAI interface format
const llm = new ChatOpenAI({
  modelName: 'meta/llama-3.1-70b-instruct',
  apiKey: process.env.NVIDIA_API_KEY,
  configuration: {
    baseURL: 'https://integrate.api.nvidia.com/v1',
  },
  temperature: 0.2,
  topP: 0.7,
  maxTokens: 1024,
});

// Tool 1: Query Database Tool (Read-only general questions)
const queryDatabaseTool = new DynamicStructuredTool({
  name: 'queryDatabase',
  description: 'Use this tool to answer general questions about the system, like listing courses, checking counts, or looking up simple information.',
  schema: z.object({
    table: z.enum(['courses', 'departments', 'lecture_halls', 'batches', 'profiles', 'student_profiles']),
    action: z.enum(['count', 'list']),
    columnFilter: z.string().optional().describe('Column name to filter by, e.g. "role"'),
    valueFilter: z.string().optional().describe('Value to filter by, e.g. "lecturer"'),
  }),
  func: async ({ table, action, columnFilter, valueFilter }) => {
    try {
      let query = supabase.from(table).select('*', { count: 'exact' });

      if (columnFilter && valueFilter) {
        // Clean up columnFilter in case the AI hallucinates quotes or table prefixes (e.g. "batches.name" -> "name")
        const cleanColumn = columnFilter.replace(/["']/g, '').split('.').pop();
        query = query.ilike(cleanColumn, `%${valueFilter}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      if (action === 'count') {
        return `There are ${count} records in ${table}${columnFilter ? ` where ${columnFilter}=${valueFilter}` : ''}.`;
      }

      // Limit to 10 for 'list' to avoid massive responses
      return JSON.stringify(data.slice(0, 10));
    } catch (err) {
      return `Error querying database: ${err.message}`;
    }
  },
});

// Tool 2: Check Availability Tool
const checkAvailabilityTool = new DynamicStructuredTool({
  name: 'checkAvailability',
  description: 'Use this tool to check if a lecturer, batch, or lecture hall is available on a specific date and time.',
  schema: z.object({
    date: z.string().describe('The date in YYYY-MM-DD format (e.g. "2024-11-20")'),
    startTime: z.string().describe('The start time in HH:MM format (e.g. "09:00")'),
    endTime: z.string().describe('The end time in HH:MM format (e.g. "11:00")'),
    entityType: z.enum(['lecturer', 'batch', 'hall']).describe('What to check availability for'),
    entityId: z.string().describe('The UUID of the entity (e.g. lecturer_id, batch_id, hall_id). IMPORTANT: Ask the user or use queryDatabase tool to find the ID first if you do not know it.'),
  }),
  func: async ({ date, startTime, endTime, entityType, entityId }) => {
    try {
      // Step 1: Check leaves if checking a lecturer
      if (entityType === 'lecturer') {
        const { data: leaves } = await supabase
          .from('leave_requests')
          .select('*')
          .eq('status', 'approved')
          .lte('start_date', date)
          .gte('end_date', date);

        const onLeave = leaves?.some(l =>
          l.user_id === entityId || l.profile_id === entityId || l.staff_id === entityId
        );

        if (onLeave) {
          return `The lecturer is on approved leave on ${date}.`;
        }
      }

      // Step 2: Check timetables for overlap
      const { data: timetables, error } = await supabase
        .from('timetables')
        .select('*')
        .eq('specific_date', date);

      if (error) throw error;

      const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };

      const formStartMins = timeToMinutes(startTime);
      let formEndMins = timeToMinutes(endTime);
      if (formEndMins === 0) formEndMins = 24 * 60;

      const conflicts = timetables.filter(t => {
        const s = timeToMinutes(t.start_time);
        let e = timeToMinutes(t.end_time);
        if (e === 0) e = 24 * 60;

        const timeOverlap = (s < formEndMins && e > formStartMins);
        if (!timeOverlap) return false;

        if (entityType === 'lecturer' && t.lecturer_id === entityId) return true;
        if (entityType === 'batch' && t.batch_id === entityId) return true;
        if (entityType === 'hall' && t.lecture_hall_id === entityId) return true;
        return false;
      });

      if (conflicts.length > 0) {
        return `Conflict found! The ${entityType} is busy from ${conflicts[0].start_time} to ${conflicts[0].end_time} for module: ${conflicts[0].module_name || conflicts[0].course_id}.`;
      }

      return `The ${entityType} is available on ${date} between ${startTime} and ${endTime}.`;
    } catch (err) {
      return `Error checking availability: ${err.message}`;
    }
  },
});

// Tool 3: Schedule Session Tool
const scheduleSessionTool = new DynamicStructuredTool({
  name: 'scheduleSession',
  description: 'Use this tool to schedule a new timetable session. ONLY use this AFTER you have verified availability and confirmed the details with the user.',
  schema: z.object({
    course_id: z.string().describe('The UUID of the course'),
    module_name: z.string().describe('The name of the module'),
    lecturer_id: z.string().describe('The UUID of the lecturer'),
    lecture_hall_id: z.string().describe('The UUID of the lecture hall'),
    batch_id: z.string().describe('The UUID of the batch'),
    specific_date: z.string().describe('The date in YYYY-MM-DD format'),
    start_time: z.string().describe('Start time HH:MM format'),
    end_time: z.string().describe('End time HH:MM format'),
  }),
  func: async (payload) => {
    try {
      const dateObj = new Date(payload.specific_date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      payload.day_of_week = days[dateObj.getDay()];

      const { error } = await supabase.from('timetables').insert([payload]);

      if (error) throw error;

      const emailResult = await sendScheduleNotification(payload);

      return `Successfully scheduled the session for module "${payload.module_name}" on ${payload.specific_date} from ${payload.start_time} to ${payload.end_time}.${emailResult.message}`;
    } catch (err) {
      return `Failed to schedule session: ${err.message}`;
    }
  },
});

const tools = [queryDatabaseTool, checkAvailabilityTool, scheduleSessionTool];

// System prompt
const systemMessage = `You are a helpful and intelligent Administrative Chatbot for an Educational Institution's Management System.
Your job is to help admins query the database, check system availability (lecturers, batches, lecture halls), and schedule timetables.

You have access to tools that query the database, check availability, and schedule sessions.
When checking availability or scheduling, if you don't know the exact UUIDs for lecturers, halls, or courses, use the 'queryDatabase' tool first to find them!

Database Schema Hints:
- The 'batches' table uses the column 'name' (NOT batch_name or batch_code) for the batch name.
- The 'courses', 'departments', and 'lecture_halls' tables also use the column 'name' for their respective names.
- When querying using columnFilter, ensure you use the exact column name like 'name'.

Example Flow for Scheduling:
1. Admin: "Schedule a class for Software Engineering batch A tomorrow at 10am in Hall 1 with John Doe"
2. You: Query DB to find the IDs for "Software Engineering batch A", "Hall 1", and "John Doe".
3. You: Check availability for the batch, hall, and lecturer using 'checkAvailability'.
4. You: If all are available, use 'scheduleSession' to book it. If not, inform the admin.

Always be polite, concise, and helpful. Format your responses with clear markdown.

IMPORTANT: When you want to present clickable options or choices to the user (like asking them to select a course, lecturer, or next action), provide each choice on a new line starting with exactly "[OPTION] ". 
Do NOT use any markdown formatting (like ** or *) or emojis in the [OPTION] lines. They must be plain text.
Example:
[OPTION] Schedule a new session
[OPTION] Check lecturer availability
[OPTION] View all courses`;

export const agentExecutor = createReactAgent({
  llm,
  tools,
  messageModifier: systemMessage
});
