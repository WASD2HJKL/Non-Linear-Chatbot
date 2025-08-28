import { Request, Response } from "express";
import type { User } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
    user?: User;
}

export interface WaspContext {
    user?: User;
    entities?: {
        User?: unknown;
        Conversation?: unknown;
        Node?: unknown;
    };
}

export type WaspResponse = Response;
