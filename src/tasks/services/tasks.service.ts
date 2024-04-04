import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Task } from '../entities/task.entity.ts';

@Injectable()
export class TasksService {

    constructor(
        @InjectRepository(Task) private tasksRepo: Repository<Task>
    ){}
    
    findAll() {
        return this.tasksRepo.find();
    }

    findOne(id: number) {
        return this.tasksRepo.findOne({ where: {id} });
    }

    create(body: any) {
        
    }

}
