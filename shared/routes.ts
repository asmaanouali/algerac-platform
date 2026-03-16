import { z } from 'zod';
import { insertUserSchema, insertRequestSchema, User, AccreditationRequest, Document, Notification } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<User>()),
      },
    },
  },
  requests: {
    list: {
      method: 'GET' as const,
      path: '/api/requests',
      responses: {
        200: z.array(z.custom<AccreditationRequest>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/requests',
      input: insertRequestSchema,
      responses: {
        201: z.custom<AccreditationRequest>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/requests/:id',
      responses: {
        200: z.custom<AccreditationRequest>(),
        404: errorSchemas.notFound,
      },
    },
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents',
      responses: {
        200: z.array(z.custom<Document>()),
      },
    },
  },
  notifications: {
    list: {
      method: 'GET' as const,
      path: '/api/notifications',
      responses: {
        200: z.array(z.custom<Notification>()),
      },
    },
    unreadCount: {
      method: 'GET' as const,
      path: '/api/notifications/unread-count',
      responses: {
        200: z.object({ count: z.number() }),
      },
    },
    markRead: {
      method: 'PUT' as const,
      path: '/api/notifications/:id/read',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    markAllRead: {
      method: 'PUT' as const,
      path: '/api/notifications/read-all',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
  },
  stats: {
    admin: {
      method: 'GET' as const,
      path: '/api/stats/admin',
      responses: {
        200: z.object({
          activeUsers: z.number(),
          systemHealth: z.number(),
          securityAlerts: z.number(),
          totalDocuments: z.number(),
        }),
      },
    },
    ra: {
      method: 'GET' as const,
      path: '/api/stats/ra',
      responses: {
        200: z.object({
          activeDossiers: z.number(),
          criticalAlerts: z.number(),
          pendingValidation: z.number(),
          closedThisMonth: z.number(),
        }),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
