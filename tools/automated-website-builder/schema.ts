import { z } from 'zod';

export const MasterBlueprintSchema = z.object({
  project_meta: z.object({
    project_id: z.string().min(3).max(64).regex(/^[a-z0-9_]+$/),
    continuous_operation_mode: z.boolean(),
    deployment_target: z.enum(['vps_containerized', 'serverless_edge'])
  }),
  database_schema: z.object({
    tables: z.array(z.object({
      table_name: z.string().regex(/^[a-z0-9_]+$/),
      columns: z.array(z.object({
        name: z.string().regex(/^[a-z0-9_]+$/),
        type: z.enum(['uuid', 'varchar(255)', 'decimal', 'timestamp', 'boolean', 'text', 'integer']),
        primary_key: z.boolean().default(false),
        nullable: z.boolean().default(true)
      })),
      rls_policies: z.array(z.object({
        name: z.string(),
        action: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
        roles: z.array(z.string()).default(['authenticated']),
        using_expression: z.string()
      })).default([])
    }))
  }),
  api_layer: z.object({
    endpoints: z.array(z.object({
      route: z.string().startsWith('/api/'),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
      protocol: z.enum(['http', 'websocket']),
      requires_auth: z.boolean()
    }))
  })
}).strict();
