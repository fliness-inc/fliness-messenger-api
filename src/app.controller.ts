import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@modules/auth/auth.guard';
import { Request } from 'express';
import UsersService from '@modules/users/users.service';

@Controller()
export class AppController {
    constructor(
      private readonly appService: AppService,
      private readonly usersService: UsersService
    ) {}

    @UseGuards(AuthGuard)
    @Get('me')
    getProfile(@Req() req: Request) {
        const { id }: any = req.user;
        return this.usersService.findOne({ where: { id } });
    }
}
