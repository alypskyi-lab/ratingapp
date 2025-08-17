import { Cached } from '@cache//cache.decorator';
import { CacheNamespace } from '@common/enums/cache.namespace.enum';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { RatingService } from './rating.service';

@ApiTags('rating')
@Controller('rating')
export class LeaderboardController {
    constructor(private ratingService: RatingService) {}

    @Get('leaderboard')
    @ApiOkResponse({ description: 'Get leaderboard of top players' })
    @Cached(CacheNamespace.LEADERBOARD, { withEtag: true })
    async getLeaderboard(): Promise<string[]> {
        return this.ratingService.getLeaderboard();
    }
}
