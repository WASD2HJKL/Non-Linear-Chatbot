import { Request, Response } from "express";
import { User } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
    user?: User;
}

export interface WaspContext {
    user?: User;
    entities?: {
        User?: any;
        Conversation?: any;
        Node?: any;
    };
}

export type WaspResponse = Response;
