import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Cached } from "@cache//cache.decorator";
import { CacheNamespace } from "@common/enums/cache.namespace.enum";
import { PlayersService } from "./player.service";
import { GetPlayerRatingResponse } from "./responses/get-player-rating.response";
import {Player} from "@app/api/player/player.entity";

@ApiTags('players')
@Controller('players')
export class PlayerController {
  constructor(private playerService: PlayersService) {}

  @Get()
  @ApiOkResponse({ description: 'Get current list of players' })
  @Cached(CacheNamespace.PLAYER_RATING, { withEtag: true })
  async getPlayers(): Promise<Player[]> {
    return this.playerService.getPlayers();
  }

  @Get(':id/rating')
  @ApiOkResponse({ description: 'Current rating for player' })
  @Cached(CacheNamespace.PLAYER_RATING, { withEtag: true })
  async getPlayerRating(@Param('playerId') id: string): Promise<GetPlayerRatingResponse> {
    return this.playerService.getPlayerRating(id);
  }
}
