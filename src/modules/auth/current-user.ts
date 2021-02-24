import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    /* const ctx = GqlExecutionContext.create(context); */
    return /*  ctx.getContext().req.user */;
  }
);

export default CurrentUser;
