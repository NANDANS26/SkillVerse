// Backend/src/routes/auth.routes.js
import { Router } from 'express';
import { login, signup, me, logout } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/me', authMiddleware(), me);
router.post('/logout', logout);

export default router;
