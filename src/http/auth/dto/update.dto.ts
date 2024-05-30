import { ApiProperty } from '@nestjs/swagger';

export class UpdateDto {
  @ApiProperty({ description: 'El nombre del usuario', example: 'John' })
  name?: string;

  @ApiProperty({ description: 'El apellido del usuario', example: 'Doe' })
  lastName?: string;

  @ApiProperty({
    description: 'La fecha de nacimiento del usuario',
    example: '1990-01-01',
  })
  birthdate?: string;
}
