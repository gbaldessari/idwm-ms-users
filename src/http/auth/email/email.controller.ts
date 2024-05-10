import { EmailService } from './email.service';
import { User } from '../entities/user.entity';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('passwordRecovery')
export class EmailController {
    constructor(
        private emailService: EmailService,
    ) { }

    @Post('sendUserRecovery')
    sendUserRecovery(@Body() user: User) {
        return this.emailService.sendUserRecovery(user);
    }
}