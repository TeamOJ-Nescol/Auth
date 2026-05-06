import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { FinishGameDto } from './dto/finish-game.dto';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: number, dto: CreateGameDto) {
    return this.prisma.game.create({
      data: {
        ownerId,
        mode: dto.mode,
        status: 'in_progress',
        state: '{}',
        players: {
          create: dto.players.map((name, position) => ({ name, position })),
        },
      },
      include: { players: true },
    });
  }

  async listForUser(ownerId: number) {
    return this.prisma.game.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: { players: true },
    });
  }

  async findOne(ownerId: number, id: number) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: { players: { orderBy: { position: 'asc' } } },
    });
    if (!game) throw new NotFoundException('Game not found');
    if (game.ownerId !== ownerId) throw new ForbiddenException();
    return game;
  }

  async update(ownerId: number, id: number, dto: UpdateGameDto) {
    await this.findOne(ownerId, id);
    if (dto.players?.length) {
      await Promise.all(
        dto.players.map((p) =>
          this.prisma.gamePlayer.updateMany({
            where: { gameId: id, position: p.position },
            data: {
              ...(p.currentScore !== undefined && { currentScore: p.currentScore }),
              ...(p.dartsThrown !== undefined && { dartsThrown: p.dartsThrown }),
            },
          }),
        ),
      );
    }
    return this.prisma.game.update({
      where: { id },
      data: dto.state !== undefined ? { state: dto.state } : {},
      include: { players: true },
    });
  }

  async finish(ownerId: number, id: number, dto: FinishGameDto) {
    await this.findOne(ownerId, id);
    await Promise.all(
      dto.players.map((p) =>
        this.prisma.gamePlayer.updateMany({
          where: { gameId: id, position: p.position },
          data: {
            finalScore: p.finalScore ?? null,
            dartsThrown: p.dartsThrown ?? 0,
          },
        }),
      ),
    );
    return this.prisma.game.update({
      where: { id },
      data: {
        status: 'finished',
        winner: dto.winner ?? null,
        state: dto.state ?? undefined,
        finishedAt: new Date(),
      },
      include: { players: true },
    });
  }

  async remove(ownerId: number, id: number) {
    await this.findOne(ownerId, id);
    await this.prisma.game.delete({ where: { id } });
    return { success: true };
  }

  async stats(ownerId: number) {
    const games = await this.prisma.game.findMany({
      where: { ownerId },
      include: { players: true },
    });
    const finished = games.filter((g) => g.status === 'finished');
    const wins = finished.filter((g) => !!g.winner).length;
    const byMode: Record<string, number> = {};
    for (const g of games) byMode[g.mode] = (byMode[g.mode] ?? 0) + 1;
    const totalDarts = finished.reduce(
      (sum, g) => sum + g.players.reduce((s, p) => s + (p.dartsThrown || 0), 0),
      0,
    );
    return {
      totalGames: games.length,
      finishedGames: finished.length,
      wins,
      byMode,
      totalDarts,
    };
  }
}
