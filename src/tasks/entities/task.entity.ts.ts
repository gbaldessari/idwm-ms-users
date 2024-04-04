import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Task {
    
    @PrimaryGeneratedColumn() // primary key
    id: number;

    @Column() // columna
    name: string;

    @Column({default: false}) // columna
    completed: boolean;

}