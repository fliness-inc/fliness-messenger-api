import { ApiProperty } from '@nestjs/swagger';

export class AuthLoginDTO {
    @ApiProperty({ type: () => String })
    public email: string;

    @ApiProperty({ type: () => String })
    public password: string;
}

export class AuthRegisterDTO {
    @ApiProperty({ type: () => String })
    public name: string;

    @ApiProperty({ type: () => String })
    public email: string;

    @ApiProperty({ type: () => String })
    public password: string;
}