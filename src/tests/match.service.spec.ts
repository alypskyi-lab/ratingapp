import { MatchService } from '../app/api/match/match.service';

describe('MatchService', () => {
  const MATCH_ID = 'match-id-123';

  const makeTxMocks = () => {
    const create = jest.fn<any, any[]>((_: any, data?: any) => {
      return data ? { ...data } : {};
    });

    const save = jest.fn<any, any[]>(async (entity: any) => {
      if (!Array.isArray(entity) && entity && !('matchId' in entity)) {
        entity.id = MATCH_ID;
        return entity;
      }
      return entity;
    });

    const trx = { create, save };
    const transaction = jest.fn((cb: any) => cb(trx));

    return { trx, create, save, transaction };
  };

  it('submit() should persist match and participants, enqueue recompute event, and return match id', async () => {
    const { trx, create, save, transaction } = makeTxMocks();

    const dsMock = { transaction } as any;
    const queueMock = { add: jest.fn() } as any;

    const service = new MatchService(dsMock, queueMock);

    const request = {
      teams: [
        {
          players: [
            { playerId: 'p1', score: 10 },
            { playerId: 'p2', score: 8 },
          ],
        },
        { players: [{ playerId: 'p3', score: 5 }] },
      ],
    } as any;

    const result = await service.submit(request);

    expect(result).toBe(MATCH_ID);

    expect(dsMock.transaction).toHaveBeenCalledTimes(1);

    expect(create).toHaveBeenCalled();

    const participantCreateArgs = create.mock.calls
      .filter(([, data]) => data) // only calls with data are participants
      .map(([, data]) => data);

    expect(participantCreateArgs).toEqual([
      { matchId: MATCH_ID, playerId: 'p1', score: 10, team: 0 },
      { matchId: MATCH_ID, playerId: 'p2', score: 8, team: 0 },
      { matchId: MATCH_ID, playerId: 'p3', score: 5, team: 1 },
    ]);

    // Save was called twice: once for match, once for participants array
    expect(save).toHaveBeenCalledTimes(2);
    expect(Array.isArray(save.mock.calls[1][0])).toBe(true);
    expect(save.mock.calls[1][0]).toHaveLength(3);

    expect(queueMock.add).toHaveBeenCalledTimes(1);
    const eventArg = queueMock.add.mock.calls[0][0];
    expect(eventArg).toHaveProperty('matchId', MATCH_ID);
  });

  it('submit() should propagate errors and not enqueue when persistence fails', async () => {
    const { trx, create, transaction } = makeTxMocks();

    const failingSave = jest.fn(async (entity: any) => {
      if (!Array.isArray(entity) && entity && !('matchId' in entity)) {
        entity.id = 'another-id';
        return entity;
      }
      throw new Error('DB failure while saving participants');
    });

    trx.save = failingSave;

    const dsMock = { transaction } as any;
    const queueMock = { add: jest.fn() } as any;
    const service = new MatchService(dsMock, queueMock);

    const request = {
      teams: [{ players: [{ playerId: 'p1', score: 7 }] }],
    } as any;

    await expect(service.submit(request)).rejects.toThrow('DB failure while saving participants');

    expect(queueMock.add).not.toHaveBeenCalled();

    expect(dsMock.transaction).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalled();
    expect(failingSave).toHaveBeenCalled();
  });
});
