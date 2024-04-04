import { Module } from '@nestjs/common';
import { TasksService } from './services/tasks.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './controllers/tasks.controller';

import { Task } from './entities/task.entity.ts';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
  ],
  providers: [TasksService],
  controllers: [TasksController]
})
export class TasksModule {}
