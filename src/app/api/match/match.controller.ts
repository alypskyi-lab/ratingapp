import { Body, Controller, Post } from '@nestjs/common';
import {ApiOkResponse, ApiTags} from '@nestjs/swagger';
import { MatchSubmitRequest } from './requests/match-submit.request';
import { MatchService } from './match.service';

@ApiTags('match')
@Controller('match')
export class MatchController {
  constructor(private matchService: MatchService) {}

  @Post()
  @ApiOkResponse({ description: 'Current rating for player' })
  async submit(@Body() dto: MatchSubmitRequest): Promise<string> {
    return this.matchService.submit(dto);
  }
}
