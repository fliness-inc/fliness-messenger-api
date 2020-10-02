import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { UsersModule } from '@modules/users/users.module';
import { InvitationsController } from './invitations.controller';

@Module({
    imports: [UsersModule],
    controllers: [InvitationsController],
    providers: [InvitationsService],
    exports: [InvitationsService]
})
export class InvitationsModule {}

export default InvitationsModule;