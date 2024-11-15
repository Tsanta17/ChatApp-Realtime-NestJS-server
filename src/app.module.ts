import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat/chat.gateway';
import { RoomsService } from './rooms/rooms.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ChatGateway, RoomsService],
})
export class AppModule {}
