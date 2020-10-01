import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthModule } from './auth.module';

describe('[Controller] [Auth] Start...', () => {
    let controller: AuthController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            imports: [AuthModule]
        }).compile();

        controller = app.get<AuthController>(AuthController);
    });

    describe('', () => {
        it('should return ', () => {

        });
    });
});
