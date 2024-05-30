import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePasswordDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'La contraseña antigua del usuario',
        example: 'password123',
    })
    oldPassword?: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'La contraseña nueva del usuario',
        example: 'password123',
    })
    newPassword?: string;
}