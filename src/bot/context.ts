import { Context } from 'grammy';
import type { User } from '../features/users/user.types.js';

export interface BotContext extends Context {
  user: User;
}
