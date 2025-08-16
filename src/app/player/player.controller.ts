import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Cached } from "@cache//cache.decorator";
import { CacheNamespace } from "@common/enums/cache.namespace.enum";
import { PlayersService } from "./player.service";
import { GetPlayerRatingResponseDto } from "./responses/get-player-rating.response.dto";

@ApiTags('players')
@Controller('players')
export class PlayerController {
  constructor(private playerService: PlayersService) {}

  @Get(':id/rating')
  @ApiOkResponse({ description: 'Current rating for player' })
  @Cached(CacheNamespace.PLAYER_RATING, { withEtag: true })
  async getPlayerRating(@Param('playerId') id: string): Promise<GetPlayerRatingResponseDto> {
    return this.playerService.getPlayerRating(id);
  }
}
