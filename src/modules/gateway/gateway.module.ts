import { Module } from '@nestjs/common';
import { AppGateway } from '@modules/gateway/gateway.gateway';

@Module({
    providers: [AppGateway],
    exports: [AppGateway]
})
export class AppGatewayModule {}

export default AppGatewayModule;