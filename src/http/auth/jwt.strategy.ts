import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { JwtPayload } from "./jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
        super({
            secretOrKey: process.env.JWT_SECRET,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }       

    async validate(payload: JwtPayload): Promise<User> {
        const { email } = payload;
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            throw new UnauthorizedException();
        }

        return user!;
    }

}