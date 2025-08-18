import { RatingService } from '../app/api/rating/rating.service';

describe('RatingService', () => {
  let service: RatingService;

  // Minimal chainable QueryBuilder mock
  const qb = {
    innerJoin: jest.fn(),
    select: jest.fn(),
    orderBy: jest.fn(),
    take: jest.fn(),
    getRawMany: jest.fn(),
  };

  const ratingRepo = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(() => {
    // Make all chainable methods return the qb itself
    qb.innerJoin.mockReturnValue(qb);
    qb.select.mockReturnValue(qb);
    qb.orderBy.mockReturnValue(qb);
    qb.take.mockReturnValue(qb);
    qb.getRawMany.mockReset();

    ratingRepo.createQueryBuilder.mockReset().mockReturnValue(qb);

    service = new RatingService(ratingRepo as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('builds the leaderboard query and returns usernames with default limit', async () => {
    qb.getRawMany.mockResolvedValue([{ username: 'alice' }, { username: 'bob' }]);

    const result = await service.getLeaderboard();

    expect(ratingRepo.createQueryBuilder).toHaveBeenCalledWith('rating');
    expect(qb.innerJoin).toHaveBeenCalledWith('rating.player', 'player');
    expect(qb.select).toHaveBeenCalledWith('player.username', 'username');
    expect(qb.orderBy).toHaveBeenCalledWith('rating.mu - 3 * rating.sigma', 'DESC');
    expect(qb.take).toHaveBeenCalledWith(100);
    expect(qb.getRawMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual(['alice', 'bob']);
  });

  it('uses provided limit when passed', async () => {
    qb.getRawMany.mockResolvedValue([{ username: 'charlie' }]);

    const result = await service.getLeaderboard(3);

    expect(qb.take).toHaveBeenCalledWith(3);
    expect(result).toEqual(['charlie']);
  });

  it('returns an empty array when no rows are found', async () => {
    qb.getRawMany.mockResolvedValue([]);

    const result = await service.getLeaderboard();

    expect(result).toEqual([]);
  });

  it('propagates errors from the repository', async () => {
    const err = new Error('db error');
    qb.getRawMany.mockRejectedValue(err);

    await expect(service.getLeaderboard()).rejects.toBe(err);
  });
});
