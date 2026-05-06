import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { FinishGameDto } from './dto/finish-game.dto';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateGameDto) {
    return this.gamesService.create(req.user.sub, dto);
  }

  @Get()
  list(@Request() req) {
    return this.gamesService.listForUser(req.user.sub);
  }

  @Get('stats')
  stats(@Request() req) {
    return this.gamesService.stats(req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.gamesService.findOne(req.user.sub, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGameDto,
  ) {
    return this.gamesService.update(req.user.sub, id, dto);
  }

  @Post(':id/finish')
  finish(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinishGameDto,
  ) {
    return this.gamesService.finish(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.gamesService.remove(req.user.sub, id);
  }
}
