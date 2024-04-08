import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';


@Controller('api/tasks')
export class TasksController {

    @Get()
    getAll() :number[]{
        return [1,2,3]
    }

    @Get(':id')
    getOne(@Param('id') id: number) {
        return id;
    }

    @Post()
    create(@Body() body: any){
        return body;
    }

    @Put(':id')
    update(@Body() body: any, @Param('id') id: number){
        return body;
    }

    @Delete(':id')
    delete(@Param('id') id: number){
        return true;
    }

}
