import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import AuthGuard from '@modules/auth/auth.guard';
import UsersService from '@modules/users/users.service';
import { ApiTags } from '@nestjs/swagger';

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(AuthGuard)
    @ApiTags('me')
    @Get('/me')
    getProfile(@Req() req: Request) {
        const { id }: any = req.user;
        return this.usersService.findOne({ where: { id } });
    }
}

export default UsersController;