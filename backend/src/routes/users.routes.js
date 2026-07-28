import express from 'express';
import { createUser, deleteUser } from '../controllers/users.controller.js';

const router = express.Router();

// POST /api/users - Create a new user
router.post('/', createUser);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', deleteUser);

export default router;
