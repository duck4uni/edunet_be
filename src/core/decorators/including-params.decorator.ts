import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface Including {
  include: string[];
}

export const IncludeRelations = createParamDecorator(
  (validIncludes: string[], ctx: ExecutionContext): Including | null => {
    const req: Request = ctx.switchToHttp().getRequest();
    const includeQuery = req.query.include as string;
    if (!includeQuery) return null;

    // Split the include query into an array of included relations (supports both '|' and ',' separators)
    const includes = includeQuery.split(/[|,]/);

    return { include: includes };
  },
);
