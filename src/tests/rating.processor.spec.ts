import { RatingsProcessor } from '@app/processors/rating/rating.processor';
import type { Job } from 'bullmq';

jest.mock('openskill', () => ({
  rate: jest.fn(),
}));
import { rate } from 'openskill';

describe('RatingsProcessor', () => {
  const matchRepo = {
    findOne: jest.fn(),
  };
  const participantRepo = {
    find: jest.fn(),
  };
  const ratingRepo = {
    save: jest.fn(),
    upsert: jest.fn(),
  };

  const makeProcessor = () => new RatingsProcessor(matchRepo as any, participantRepo as any, ratingRepo as any);

  const makeJob = (matchId = 'match-1') => ({ data: { matchId } }) as unknown as Job<{ matchId: string }>;

  beforeEach(() => {
    jest.clearAllMocks();
    (rate as jest.Mock).mockReset();
  });

  it('returns false when match is not found', async () => {
    matchRepo.findOne.mockResolvedValue(null);

    const processor = makeProcessor();
    const res = await processor.process(makeJob('missing-match'));

    expect(res).toBe(false);
    expect(matchRepo.findOne).toHaveBeenCalledWith({ where: { id: 'missing-match' } });
    expect(participantRepo.find).not.toHaveBeenCalled();
    expect(ratingRepo.save).not.toHaveBeenCalled();
    expect(ratingRepo.upsert).not.toHaveBeenCalled();
  });

  it('returns false when no participants are found', async () => {
    matchRepo.findOne.mockResolvedValue({ id: 'match-1' });
    participantRepo.find.mockResolvedValue([]);

    const processor = makeProcessor();
    const res = await processor.process(makeJob('match-1'));

    expect(res).toBe(false);
    expect(participantRepo.find).toHaveBeenCalledWith({
      where: { matchId: 'match-1' },
      order: { team: 'ASC', createdAt: 'ASC' },
    });
    expect(ratingRepo.save).not.toHaveBeenCalled();
    expect(ratingRepo.upsert).not.toHaveBeenCalled();
  });

  it('computes byTeam from participants and calls getParticipantRatings, getParticipantRanks, and rate', async () => {
    matchRepo.findOne.mockResolvedValue({ id: 'match-1' });

    const participants = [
      { playerId: 'p1', matchId: 'match-1', team: 0, createdAt: new Date('2024-01-01T00:00:00Z') },
      { playerId: 'p2', matchId: 'match-1', team: 0, createdAt: new Date('2024-01-01T00:00:01Z') },
      { playerId: 'p3', matchId: 'match-1', team: 1, createdAt: new Date('2024-01-01T00:00:02Z') },
    ];
    participantRepo.find.mockResolvedValue(participants);

    const processor = makeProcessor();

    // Spy on the internal helpers
    const getParticipantRatingsSpy = jest.spyOn(processor as any, 'getParticipantRatings').mockResolvedValue([
      [
        { mu: 25, sigma: 8 },
        { mu: 24, sigma: 9 },
      ],
      [{ mu: 30, sigma: 7 }],
    ]);

    const getParticipantRanksSpy = jest.spyOn(processor as any, 'getParticipantRanks').mockResolvedValue([1, 2]);

    (rate as jest.Mock).mockReturnValue([
      [
        { mu: 26, sigma: 8 },
        { mu: 23, sigma: 9 },
      ],
      [{ mu: 29, sigma: 7 }],
    ]);

    await processor.process(makeJob('match-1'));

    const expectedByTeam = [['p1', 'p2'], ['p3']];

    expect(participantRepo.find).toHaveBeenCalledWith({
      where: { matchId: 'match-1' },
      order: { team: 'ASC', createdAt: 'ASC' },
    });

    expect(getParticipantRatingsSpy).toHaveBeenCalledTimes(1);
    expect(getParticipantRatingsSpy).toHaveBeenCalledWith(expectedByTeam);

    expect(getParticipantRanksSpy).toHaveBeenCalledTimes(1);
    expect(getParticipantRanksSpy).toHaveBeenCalledWith(participants, 2);

    expect(rate).toHaveBeenCalledTimes(1);
    expect(rate).toHaveBeenCalledWith(
      [
        [
          { mu: 25, sigma: 8 },
          { mu: 24, sigma: 9 },
        ],
        [{ mu: 30, sigma: 7 }],
      ],
      { rank: [1, 2] },
    );
  });

  it('propagates errors from getParticipantRatings', async () => {
    matchRepo.findOne.mockResolvedValue({ id: 'match-1' });
    participantRepo.find.mockResolvedValue([
      { playerId: 'p1', matchId: 'match-1', team: 0, createdAt: new Date() },
      { playerId: 'p2', matchId: 'match-1', team: 1, createdAt: new Date() },
    ]);

    const processor = makeProcessor();
    jest.spyOn(processor as any, 'getParticipantRatings').mockRejectedValue(new Error('ratings error'));

    await expect(processor.process(makeJob('match-1'))).rejects.toThrow('ratings error');
  });
});
