import { PlayersService } from '../app/api/player/player.service';

describe('PlayersService', () => {
  let service: PlayersService;
  let ratingRepo: { findOneOrFail: jest.Mock };
  let playerRepo: { find: jest.Mock };

  beforeEach(() => {
    ratingRepo = { findOneOrFail: jest.fn() };
    playerRepo = { find: jest.fn() };
    service = new PlayersService(ratingRepo as any, playerRepo as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getPlayers', () => {
    it('returns players from repository', async () => {
      const players = [
        { id: 'p1', username: 'alice' },
        { id: 'p2', username: 'bob' },
      ];
      playerRepo.find.mockResolvedValue(players);

      const result = await service.getPlayers();

      expect(playerRepo.find).toHaveBeenCalledTimes(1);
      expect(playerRepo.find).toHaveBeenCalledWith();
      expect(result).toEqual(players);
    });
  });

  describe('getPlayerRating', () => {
    it('returns rating with selected fields', async () => {
      const rating = { id: 'r1', mu: 25.0, sigma: 8.333 };
      ratingRepo.findOneOrFail.mockResolvedValue(rating);

      const result = await service.getPlayerRating('player-123');

      expect(ratingRepo.findOneOrFail).toHaveBeenCalledTimes(1);
      expect(ratingRepo.findOneOrFail).toHaveBeenCalledWith(
        expect.objectContaining({
          select: ['id', 'mu', 'sigma'],
          where: { player: { id: 'player-123' } },
        }),
      );
      expect(result).toEqual(rating);
    });

    it('propagates errors from repository', async () => {
      const err = new Error('not found');
      ratingRepo.findOneOrFail.mockRejectedValue(err);

      await expect(service.getPlayerRating('missing-id')).rejects.toBe(err);
      expect(ratingRepo.findOneOrFail).toHaveBeenCalled();
    });
  });
});
